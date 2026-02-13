import { motion } from "framer-motion";

export function TrustBar() {
  return (
    <section className="py-24 px-6">
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
              Nossos <br />
              Parceiros
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Confiado pelas maiores empresas do mercado.
            </motion.p>
          </div>
        </div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-12 opacity-40 grayscale items-center justify-items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-32 bg-muted rounded-sm"
              aria-label={`Logotipo de parceiro corporativo ${i}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
