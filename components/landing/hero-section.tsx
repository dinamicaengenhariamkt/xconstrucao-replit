import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/aceternity/backgrounds/background-beams";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden pb-40"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/background-homepage.png"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      {/* Background Beams */}
      <BackgroundBeams className="opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-[1000px] w-full pt-20">
        <motion.img
          src="/logo-xconstrucao-vertical-01.png"
          alt="XConstrução"
          className="h-24 mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold tracking-[-0.02em] leading-[1.1] mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Reinventando as relações na{" "}
          <span className="text-brand-primary dark:text-brand-success">construção civil</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-2xl text-muted-foreground font-medium max-w-[720px] mx-auto leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Conectamos projetos a executores de excelência, com praticidade,
          precisão, previsibilidade e inovação em cada etapa
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/register?role=empreiteiro">
            <Button
              size="lg"
              className="min-w-[200px] rounded-full font-bold text-lg h-14"
            >
              Sou Empreiteiro
            </Button>
          </Link>
          <Link href="/register?role=contratante">
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] rounded-full font-bold text-lg h-14"
            >
              Sou Contratante
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Floating Hero Visual */}
      <motion.div
        className="relative z-10 mt-16 w-full max-w-[1100px]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="aspect-[16/8] rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center shadow-2xl">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: 'url("/background-homepage.png")' }}
          />
        </div>
        {/* Decorative element */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      </motion.div>
    </section>
  );
}
