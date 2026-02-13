import { motion } from "framer-motion";
import { MdRedeem, MdRocketLaunch, MdVerified } from "react-icons/md";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: MdRedeem,
    title: "xgestão inteligente",
    description: "Gratuita por 3 meses para novos usuários da plataforma.",
    buttonText: "Saiba Mais",
    iconColor: "text-brand-success",
    iconBg: "bg-brand-success/10",
    link: "#",
  },
  {
    icon: MdRocketLaunch,
    title: "Comece com xgestão inteligente",
    description: "Experimente a gestão de obras do futuro agora mesmo.",
    buttonText: "Teste Grátis",
    iconColor: "text-brand-info",
    iconBg: "bg-brand-info/10",
    link: "#",
  },
  {
    icon: MdVerified,
    title: "SINAPI em Todos os Planos",
    description:
      "Custo Real, Confiança Total! A referência oficial da Caixa e IBGE para materiais, mão de obra e serviços.",
    buttonText: null,
    iconColor: "text-brand-warning",
    iconBg: "bg-brand-warning/10",
    link: null,
  },
];

export function HighlightsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              className="bg-background dark:bg-card p-8 rounded-xl border border-border shadow-sm text-center flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div
                className={`w-12 h-12 ${highlight.iconBg} ${highlight.iconColor} rounded-lg flex items-center justify-center mb-6 mx-auto`}
              >
                <highlight.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{highlight.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                {highlight.description}
              </p>
              {highlight.buttonText && (
                <a href={highlight.link || "#"}>
                  <Button className="rounded-full font-bold px-8 py-3 w-full hover:scale-105 transition-transform">
                    {highlight.buttonText}
                  </Button>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
