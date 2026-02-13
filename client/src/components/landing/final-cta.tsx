import { motion } from "framer-motion";
import { MovingBorder } from "@/components/aceternity/interactive/moving-border";
import { Link } from "wouter";

export function FinalCTA() {
  return (
    <section id="sobre" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto bg-brand-primary dark:bg-brand-primary rounded-[2rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
        <div className="relative z-10">
          <motion.h2
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Pronto para o próximo nível?
          </motion.h2>
          <motion.p
            className="text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Junte-se à xconstrução.
            <br />A plataforma que está revolucionando a construção civil.
          </motion.p>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link href="/login">
              <MovingBorder
                duration={3000}
                className="bg-white text-brand-primary dark:bg-white dark:text-brand-primary h-14 hover:scale-105 transition-transform"
                containerClassName="rounded-full"
              >
                Acesso à Plataforma
              </MovingBorder>
            </Link>
          </motion.div>
        </div>

        {/* Abstract BG patterns */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
