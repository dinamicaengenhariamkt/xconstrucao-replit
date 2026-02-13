// Prevent static generation for auth page (uses useSearchParams)
export const dynamic = 'force-dynamic'

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
