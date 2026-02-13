import { motion } from "framer-motion";

export function MonetizationSection() {
  return (
    <section className="py-32 px-6 bg-[#fcfcfc] dark:bg-background/50">
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
              Mercado em <br />
              Foco
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Informações e conteúdos selecionados para profissionais da
              construção.
            </motion.p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Conteúdo de Marca */}
          <motion.div
            className="bg-background rounded-xl overflow-hidden shadow-lg border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="relative aspect-video bg-muted bg-cover bg-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-brand-warning text-white text-xs font-bold px-2 py-1 rounded">
                  Conteúdo de Marca
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                Por <span className="font-semibold text-foreground">Anunciante</span>
              </p>
              <h3 className="text-xl font-bold text-foreground leading-tight">
                Inovações em construção modular aceleram entregas de projetos
              </h3>
            </div>
          </motion.div>

          {/* Card 2: Widget de Cotações */}
          <motion.div
            className="bg-background rounded-xl overflow-hidden shadow-lg p-6 border border-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-bold text-sm">valor data</span>
                <span className="text-purple-600 font-bold text-xl">mia</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">oferecido por</p>
                <span className="text-purple-600 font-bold text-xl">nu</span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-muted-foreground text-sm">Ibovespa</p>
              <p className="text-muted-foreground text-xs">179.847pts (+4257,19)</p>
              <p className="text-green-500 text-2xl font-bold flex items-center gap-1">
                <span>▲</span> 2.43%
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>MOEDAS</span>
                <span>COMPRA</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-foreground">Dólar Comercial</span>
                <span className="text-brand-warning font-semibold">R$ 5,287</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-foreground">Euro Comercial</span>
                <span className="text-brand-warning font-semibold">R$ 6,245</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                atualizado 23/01/2026 18h00
              </p>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">fonte:</p>
                <span className="text-red-600 font-bold text-sm">
                  Valor<sup className="text-xs">PRO</sup>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
