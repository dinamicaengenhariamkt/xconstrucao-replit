// Endpoint temporário para testar se as variáveis de ambiente do Google OAuth foram carregadas
// DELETAR após verificação

export async function GET() {
  return Response.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10),
  });
}
