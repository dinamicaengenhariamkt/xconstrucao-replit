export interface GlassNavProps {
  showAccessButton?: boolean;
  // XG16 — `showAdminButton` removida: o link público para a área administrativa
  // saiu da navegação. O acesso segue por /login?perfil=administrador.
}

export interface StructuredDataProps {
  data: object | object[];
}
