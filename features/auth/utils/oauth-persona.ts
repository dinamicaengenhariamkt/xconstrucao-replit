export function canApplySignupPersonaToRole(role: string): boolean {
  return role !== "admin" && role !== "superadmin";
}