import { BentoGrid, BentoGridItem } from "@/components/aceternity/features/bento-grid";
import { motion } from "framer-motion";
import { MdShield, MdOutlineGpsFixed, MdHub, MdBolt, MdBarChart } from "react-icons/md";

const features = [
  {
    icon: MdShield,
    title: "Segurança e agilidade",
    description:
      "Na xconstrução, a relação é segura do começo ao fim: pagamentos só após comprovação, profissionais com histórico verificado e transparência total em cada etapa. Acabou a desconfiança — a obra anda com segurança para todos.",
    className: "md:col-span-1",
  },
  {
    icon: MdOutlineGpsFixed,
    title: "Precisão digital e previsibilidade",
    description:
      "Dados em tempo real para decisões assertivas, eliminando erros comuns em grandes cronogramas.",
    className: "md:col-span-1",
  },
  {
    icon: MdHub,
    title: "Conexão xconstrução",
    description:
      "Acesse os melhores projetos e profissionais do mercado através de nosso ecossistema verificado. Profissionais respaldados por Responsabilidade Técnica ativa (ART/RRT) e portfólio de obras reais validado pela plataforma — garantia de qualidade, legalidade e experiência comprovada em projetos diversos e de alto padrão.",
    className: "md:col-span-1",
  },
  {
    icon: MdBolt,
    title: "Profissionais com Responsabilidade Técnica e portfólio validado",
    description:
      "Profissionais respaldados por Responsabilidade Técnica ativa (ART/RRT) e portfólio de obras reais validado pela plataforma — garantia de qualidade, legalidade e experiência comprovada em projetos diversos e de alto padrão.",
    className: "md:col-span-1",
  },
  {
    icon: MdBarChart,
    title: "Gestão ágil e monitorada",
    description:
      "Interface intuitiva e colaborativa para otimizar cronogramas e recursos. Com clareza total em todas as etapas, todos trabalham em sincronia. Bem-vindo à nova dinâmica da construção.",
    className: "md:col-span-1",
  },
];

export function FeaturesBento() {
  return (
    <section
      id="solucoes"
      className="py-32 px-6 bg-[#fcfcfc] dark:bg-background/50"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-[600px]">
            <motion.h2
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Inovação em <br />
              cada etapa
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Nossa plataforma oferece as ferramentas necessárias para
              transformar a gestão de obras complexas.
            </motion.p>
          </div>
        </div>

        {/* First row - 3 cards */}
        <BentoGrid className="mb-6">
          {features.slice(0, 3).map((feature, i) => (
            <BentoGridItem
              key={i}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className={feature.className}
            />
          ))}
        </BentoGrid>

        {/* Second row - 2 cards centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
          {features.slice(3).map((feature, i) => (
            <BentoGridItem
              key={i + 3}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className="md:col-span-1"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
