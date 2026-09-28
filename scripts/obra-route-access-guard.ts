import ts from "typescript";

export interface ObraRouteIssue {
  file: string;
  method: string;
  reason: string;
}

const METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);
const ACCESS_IMPORTS: Record<string, string[]> = {
  "@features/obras/api/access": ["findObraAccess"],
  "@features/xgestao/equipe/server/access": ["resolverAcessoObraXgestao"],
  "@features/xgestao/obra-publica/server/share-api": ["requireXgestaoObraAccess"],
  "@features/xgestao/lib/entitlement": ["assertXgestaoUser"],
};

/**
 * Static tripwire, not a proof of authorization: checks the guard call in each
 * exported handler. Paths below are deliberately narrow: admin routes have their
 * own role gate; /api/obras is the marketplace listing/creation endpoint, and
 * /api/obras/destaque is public curated content.
 */
export function checkObraRouteAccess(file: string, content: string): ObraRouteIssue[] {
  const path = file.replaceAll("\\", "/");
  if (path.startsWith("app/api/admin/") || path === "app/api/obras/route.ts" ||
      path === "app/api/obras/destaque/route.ts") return [];

  const isDetail = path.startsWith("app/api/obras/[id]/") ||
    path.startsWith("app/api/xgestao/obras/[id]/");
  const isCreate = path === "app/api/xgestao/obras/route.ts";
  if (!isDetail && !isCreate) return [];

  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const names = new Set<string>();
  const expected = isCreate ? ["assertXgestaoUser"] : isDetail
    ? ["findObraAccess", "resolverAcessoObraXgestao", "requireXgestaoObraAccess"]
    : [];
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const allowed = ACCESS_IMPORTS[node.moduleSpecifier.text];
    const bindings = node.importClause?.namedBindings;
    if (!allowed || !bindings || !ts.isNamedImports(bindings)) continue;
    for (const item of bindings.elements) {
      if (allowed.includes(item.propertyName?.text ?? item.name.text) &&
          expected.includes(item.propertyName?.text ?? item.name.text)) names.add(item.name.text);
    }
  }

  const helpers = new Map<string, ts.FunctionDeclaration>();
  for (const node of source.statements) {
    if (ts.isFunctionDeclaration(node) && node.name) helpers.set(node.name.text, node);
  }

  function callsGuard(node: ts.Node, visited = new Set<string>()): boolean {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.has(node.expression.text)) return true;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      const helper = helpers.get(name);
      if (helper && !visited.has(name)) {
        const next = new Set(visited);
        next.add(name);
        if (callsGuard(helper, next)) return true;
      }
    }
    return ts.forEachChild(node, (child) => callsGuard(child, visited)) ?? false;
  }

  const issues: ObraRouteIssue[] = [];
  for (const node of source.statements) {
    if (!ts.canHaveModifiers(node) ||
        !ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const handlers: Array<{ method: string; body: ts.Node | undefined }> = [];
    if (ts.isFunctionDeclaration(node) && node.name && METHODS.has(node.name.text)) {
      handlers.push({ method: node.name.text, body: node.body });
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && METHODS.has(declaration.name.text)) {
          handlers.push({ method: declaration.name.text, body: declaration.initializer });
        }
      }
    }
    for (const handler of handlers) {
      if (handler.body && callsGuard(handler.body)) continue;
      issues.push({
        file, method: handler.method,
        reason: isCreate
          ? "chame assertXgestaoUser antes de criar uma obra"
          : "chame findObraAccess, resolverAcessoObraXgestao ou requireXgestaoObraAccess neste handler",
      });
    }
  }
  return issues;
}