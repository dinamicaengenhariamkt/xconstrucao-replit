export function canApplySignupPersonaToRole(role: string): boolean {
  return role === "contratante" || role === "empreiteiro";
}