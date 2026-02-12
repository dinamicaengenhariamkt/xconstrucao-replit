import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Target, Network, Zap, BarChart3, ArrowRight, Building2, HardHat, CheckCircle2 } from "lucide-react";

function GlassNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
      <nav className="flex items-center justify-between gap-4 w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 bg-white/70 dark:bg-[#1C1F22]/70 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background font-extrabold text-sm">X</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight" data-testid="text-brand">xconstrução</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#inicio" data-testid="link-inicio">Início</a>
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#solucoes" data-testid="link-solucoes">Soluções</a>
          <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#projetos" data-testid="link-projetos">Projetos</a>
        </div>
        <Link href="/login">
          <Button className="rounded-full font-bold" data-testid="button-access-platform">
            Acesso à Plataforma
          </Button>
        </Link>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section id="inicio" className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center pt-32">
      <div className="max-w-[1000px] w-full">
        <div className="w-20 h-20 rounded-2xl bg-foreground flex items-center justify-center mx-auto mb-8">
          <span className="text-background font-extrabold text-3xl">X</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.02em] leading-[1.1] mb-8" data-testid="text-hero-title">
          Reinventando as relações na{" "}
          <span className="text-primary">construção civil</span>
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-[720px] mx-auto leading-relaxed mb-12" data-testid="text-hero-subtitle">
          Conectamos projetos a executores de excelência, com praticidade, precisão, previsibilidade e inovação em cada etapa
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
          <Link href="/register?role=empreiteiro">
            <Button size="lg" className="rounded-full font-bold text-base min-w-[200px] min-h-14" data-testid="button-empreiteiro">
              <HardHat className="w-5 h-5 mr-2" />
              Sou Empreiteiro
            </Button>
          </Link>
          <Link href="/register?role=contratante">
            <Button variant="outline" size="lg" className="rounded-full font-bold text-base min-w-[200px] min-h-14" data-testid="button-contratante">
              <Building2 className="w-5 h-5 mr-2" />
              Sou Contratante
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-24 w-full max-w-[1100px] relative">
        <div className="aspect-[16/8] rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="flex justify-center gap-6 mb-6 flex-wrap">
              <StatCard label="Obras Gerenciadas" value="150+" />
              <StatCard label="Empreiteiros" value="80+" />
              <StatCard label="Satisfação" value="98%" />
            </div>
            <p className="text-muted-foreground text-sm">Plataforma completa de gestão de obras</p>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border min-w-[140px]">
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
    </div>
  );
}

const features = [
  {
    icon: Shield,
    title: "Segurança e agilidade",
    description: "Pagamentos só após comprovação, profissionais com histórico verificado e transparência total em cada etapa.",
  },
  {
    icon: Target,
    title: "Precisão digital",
    description: "Dados em tempo real para decisões assertivas, eliminando erros comuns em grandes cronogramas.",
  },
  {
    icon: Network,
    title: "Conexão xconstrução",
    description: "Acesse os melhores projetos e profissionais do mercado através de nosso ecossistema verificado.",
  },
  {
    icon: Zap,
    title: "Responsabilidade Técnica",
    description: "Profissionais respaldados por ART/RRT ativa e portfólio de obras reais validado pela plataforma.",
  },
  {
    icon: BarChart3,
    title: "Gestão ágil e monitorada",
    description: "Interface intuitiva e colaborativa para otimizar cronogramas e recursos com clareza total.",
  },
];

function FeaturesSection() {
  return (
    <section id="solucoes" className="py-32 px-6 bg-card/50">
      <div className="max-w-[1200px] mx-auto">
        <div className="max-w-[600px] mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6" data-testid="text-features-title">
            Inovação em{" "}<br />cada etapa
          </h2>
          <p className="text-xl text-muted-foreground">
            Nossa plataforma oferece as ferramentas necessárias para transformar a gestão de obras complexas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.slice(0, 3).map((f, i) => (
            <Card key={i} className="p-8 border-border hover:-translate-y-1 transition-all duration-300 group" data-testid={`card-feature-${i}`}>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mb-6">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.description}</p>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-[800px] mx-auto">
          {features.slice(3).map((f, i) => (
            <Card key={i} className="p-8 border-border hover:-translate-y-1 transition-all duration-300 group" data-testid={`card-feature-${i + 3}`}>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-md flex items-center justify-center mb-6">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const benefits = [
  "Controle financeiro completo com entradas e saídas",
  "Medições digitais com comprovação fotográfica",
  "Chat integrado entre contratante e empreiteiro",
  "Dashboards personalizados por perfil de acesso",
  "Gestão inteligente com indicadores em tempo real",
  "Histórico completo e auditável de todas as operações",
];

function BenefitsSection() {
  return (
    <section id="projetos" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6" data-testid="text-benefits-title">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Gerencie obras, finanças, equipes e documentos com uma plataforma integrada.
            </p>
            <ul className="space-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3" data-testid={`text-benefit-${i}`}>
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm font-medium">{b}</span>
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button size="lg" className="rounded-full font-bold mt-10" data-testid="button-start-now">
                Começar agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border border-border">
            <div className="space-y-4">
              <DemoCard icon={Building2} title="12 obras ativas" subtitle="R$ 4.8M em contratos" />
              <DemoCard icon={HardHat} title="8 empreiteiros" subtitle="Avaliação média: 4.7" />
              <DemoCard icon={BarChart3} title="R$ 1.2M faturado" subtitle="Este trimestre" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoCard({ icon: Icon, title, subtitle }: { icon: typeof Building2; title: string; subtitle: string }) {
  return (
    <div className="bg-background rounded-xl p-5 border border-border flex items-center gap-4">
      <div className="w-10 h-10 bg-primary/10 text-primary rounded-md flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background font-extrabold text-xs">X</span>
          </div>
          <span className="text-base font-extrabold tracking-tight">xconstrução</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium" data-testid="text-copyright">
          2026 xconstrução.lab. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <GlassNav />
      <main className="relative overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
      </main>
      <Footer />
    </div>
  );
}
