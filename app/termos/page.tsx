"use client";

import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@shared/components/ui/accordion";
import { Card, CardContent } from "@shared/components/ui/card";
import { Separator } from "@shared/components/ui/separator";
import { RiScalesLine, RiMailLine } from 'react-icons/ri';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';

export default function TermosDeUso() {
  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Termos de Uso', url: '/termos' }
        ]),
        generateWebPageSchema({
          title: 'Termos de Uso - XConstrução',
          description: 'Termos de uso da plataforma XConstrução',
          url: '/termos',
          datePublished: '2026-01-01',
        })
      ]} />
      <GlassNav />

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 pt-32 pb-20">
          {/* Background Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center opacity-[0.08]"
              style={{ backgroundImage: 'url("/images/background-homepage.png")' }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[900px] w-full flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 dark:bg-white/10 text-[#333333] dark:text-white text-sm font-bold uppercase tracking-wider">
              <RiScalesLine className="w-4 h-4" />
              <span>Termos de Uso</span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95]"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Termos de Uso
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Última atualização: 13 de fevereiro de 2026
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20 px-6">
          <div className="max-w-[900px] mx-auto">
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 mb-4">
                Bem-vindo à XConstrução. Ao acessar e utilizar nossa plataforma, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Por favor, leia-os atentamente antes de usar nossos serviços.
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Se você não concordar com qualquer parte destes termos, não deverá utilizar a plataforma XConstrução.
              </p>
            </div>

            <Separator className="my-12" />

            {/* Accordion Sections */}
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  1. Aceitação dos Termos
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Ao acessar ou usar a plataforma XConstrução, você concorda em estar legalmente vinculado a estes Termos de Uso, todas as leis e regulamentos aplicáveis, e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.
                  </p>
                  <p>
                    Para utilizar nossos serviços, você deve ter pelo menos 18 (dezoito) anos de idade ou a maioridade legal em sua jurisdição. Ao usar a plataforma, você declara e garante que atende a este requisito de idade.
                  </p>
                  <p>
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. Seu uso continuado da plataforma após tais modificações constituirá seu reconhecimento e aceitação dos termos modificados.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  2. Definições
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>Para fins destes Termos de Uso, as seguintes definições se aplicam:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Plataforma:</strong> Refere-se ao sistema XConstrução, incluindo website, aplicativo móvel e todos os serviços relacionados.</li>
                    <li><strong>Usuário:</strong> Qualquer pessoa que acesse ou utilize a plataforma, independentemente de ter realizado cadastro.</li>
                    <li><strong>Serviços:</strong> Todas as funcionalidades oferecidas pela XConstrução, incluindo gestão de obras, conexão entre profissionais e acesso à tabela SINAPI.</li>
                    <li><strong>Contratante:</strong> Usuário que busca profissionais ou empresas para execução de obras ou serviços de construção.</li>
                    <li><strong>Empreiteiro:</strong> Profissional ou empresa registrada na plataforma que oferece serviços de construção civil.</li>
                    <li><strong>Conta:</strong> O registro único de cada usuário na plataforma, contendo suas informações pessoais e profissionais.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  3. Cadastro e Conta de Usuário
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Para utilizar determinados recursos da plataforma, você deverá criar uma conta fornecendo informações precisas, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorram sob sua conta.
                  </p>
                  <p>
                    <strong>Você concorda em:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Fornecer informações verdadeiras, precisas, atuais e completas sobre você conforme solicitado no formulário de cadastro</li>
                    <li>Manter e atualizar prontamente seus dados para mantê-los verdadeiros, precisos, atuais e completos</li>
                    <li>Manter a segurança de sua senha e identificação</li>
                    <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                    <li>Ser responsável por todas as atividades que ocorram sob sua conta</li>
                  </ul>
                  <p>
                    Reservamo-nos o direito de suspender ou encerrar sua conta se qualquer informação fornecida for imprecisa, falsa ou incompleta.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  4. Serviços Oferecidos
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    A XConstrução é uma plataforma digital que conecta contratantes a profissionais e empresas do setor de construção civil, oferecendo ferramentas de gestão inteligente de obras.
                  </p>
                  <p>
                    <strong>Nossos principais serviços incluem:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>xgestão inteligente:</strong> Sistema completo de gestão de obras, incluindo cronogramas, orçamentos e acompanhamento de progresso</li>
                    <li><strong>Conexão de profissionais:</strong> Marketplace que conecta contratantes a empreiteiros qualificados</li>
                    <li><strong>Tabela SINAPI:</strong> Acesso atualizado à tabela de preços de referência do Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil</li>
                    <li><strong>Documentação técnica:</strong> Repositório para ARTs, RRTs e documentação de obra</li>
                    <li><strong>Gestão financeira:</strong> Controle de custos, pagamentos e fluxo de caixa de obras</li>
                  </ul>
                  <p>
                    A XConstrução atua como intermediadora, facilitando a conexão entre as partes, mas não se responsabiliza pela execução dos serviços contratados.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  5. Responsabilidades do Usuário
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Ao utilizar a plataforma XConstrução, você concorda em:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Usar a plataforma apenas para fins legais e de acordo com estes Termos de Uso</li>
                    <li>Não utilizar a plataforma de qualquer maneira que possa danificar, desabilitar, sobrecarregar ou prejudicar qualquer servidor ou rede</li>
                    <li>Não tentar obter acesso não autorizado a qualquer parte da plataforma, contas de outros usuários ou sistemas de computador</li>
                    <li>Não publicar ou transmitir conteúdo ilegal, fraudulento, difamatório, obsceno, ofensivo ou que viole direitos de terceiros</li>
                    <li>Verificar a documentação técnica (ART/RRT) e qualificações de profissionais antes de contratar serviços</li>
                    <li>Cumprir todas as obrigações contratuais estabelecidas com outros usuários através da plataforma</li>
                    <li>Não realizar atividades de spam, phishing ou outras práticas enganosas</li>
                  </ul>
                  <p>
                    O descumprimento destas responsabilidades pode resultar na suspensão ou encerramento de sua conta, sem prejuízo de outras medidas legais cabíveis.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  6. Propriedade Intelectual
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Todo o conteúdo da plataforma XConstrução, incluindo, mas não se limitando a, textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, é de propriedade exclusiva da XConstrução ou de seus licenciadores e é protegido por leis brasileiras e internacionais de direitos autorais.
                  </p>
                  <p>
                    A marca XConstrução, logotipos e todos os elementos visuais relacionados são marcas registradas e não podem ser usados sem permissão expressa por escrito.
                  </p>
                  <p>
                    Você recebe uma licença limitada, não exclusiva, intransferível e revogável para acessar e usar a plataforma exclusivamente para fins pessoais ou comerciais internos. Esta licença não inclui qualquer direito de:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Revenda ou uso comercial da plataforma ou seu conteúdo</li>
                    <li>Coleta e uso de listagens de produtos, descrições ou preços</li>
                    <li>Uso derivado da plataforma ou seu conteúdo</li>
                    <li>Download ou cópia de informações de conta para benefício de terceiros</li>
                    <li>Uso de data mining, robots ou ferramentas similares de coleta e extração de dados</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  7. Limitações de Responsabilidade
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    A XConstrução atua como plataforma intermediadora, conectando contratantes e empreiteiros. Não somos parte dos contratos firmados entre usuários e não assumimos responsabilidade pela qualidade, segurança, legalidade ou conformidade dos serviços prestados.
                  </p>
                  <p>
                    <strong>A plataforma é fornecida "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas.</strong>
                  </p>
                  <p>
                    Não garantimos que:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>A plataforma estará disponível de forma ininterrupta ou livre de erros</li>
                    <li>Defeitos serão corrigidos imediatamente</li>
                    <li>A plataforma estará livre de vírus ou outros componentes prejudiciais</li>
                    <li>Os resultados obtidos pelo uso da plataforma serão precisos ou confiáveis</li>
                  </ul>
                  <p>
                    Em nenhuma circunstância a XConstrução será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas não se limitando a, perda de lucros, receita, dados ou uso, resultantes do uso ou incapacidade de usar a plataforma.
                  </p>
                  <p>
                    É responsabilidade exclusiva do usuário verificar a idoneidade, qualificações técnicas e documentação dos profissionais contratados através da plataforma.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  8. Modificações dos Termos
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Reservamos o direito de modificar ou substituir estes Termos de Uso a qualquer momento, a nosso exclusivo critério. As modificações entrarão em vigor imediatamente após a publicação dos Termos de Uso revisados na plataforma.
                  </p>
                  <p>
                    Faremos esforços razoáveis para notificá-lo sobre mudanças significativas nestes termos através de:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Notificação na plataforma</li>
                    <li>Email para o endereço cadastrado em sua conta</li>
                    <li>Aviso destacado na página inicial</li>
                  </ul>
                  <p>
                    Seu uso continuado da plataforma após a publicação de quaisquer alterações constitui sua aceitação de tais alterações. Se você não concordar com os termos modificados, deve interromper imediatamente o uso da plataforma e cancelar sua conta.
                  </p>
                  <p>
                    Recomendamos que você revise periodicamente estes Termos de Uso para se manter informado sobre quaisquer atualizações.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  9. Lei Aplicável e Foro
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil, sem consideração a conflitos de disposições legais.
                  </p>
                  <p>
                    Qualquer disputa, controvérsia ou reivindicação decorrente ou relacionada a estes Termos de Uso, incluindo a formação, interpretação, violação ou rescisão destes, será resolvida de acordo com a legislação brasileira.
                  </p>
                  <p>
                    Fica eleito o foro da comarca da Capital do Estado de São Paulo para dirimir quaisquer dúvidas ou controvérsias oriundas destes Termos de Uso, renunciando expressamente a qualquer outro, por mais privilegiado que seja.
                  </p>
                  <p>
                    Nada nestes Termos de Uso afetará seus direitos legais como consumidor, conforme previsto no Código de Defesa do Consumidor (Lei nº 8.078/1990).
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  10. Contato
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Se você tiver dúvidas, comentários ou preocupações sobre estes Termos de Uso, entre em contato conosco:
                  </p>
                  <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-xl p-4 space-y-2">
                    <p><strong>Email:</strong> contato@xconstrucao.com.br</p>
                    <p><strong>Telefone:</strong> (11) 0000-0000</p>
                    <p><strong>Horário de atendimento:</strong> Segunda a sexta, das 9h às 18h</p>
                  </div>
                  <p>
                    Faremos o possível para responder às suas solicitações dentro de 5 (cinco) dias úteis.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Important Notice Card */}
            <Card className="mt-12 bg-[#F4F5F5] dark:bg-[#2A2D30] border-0" style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}>
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <RiMailLine className="w-8 h-8 text-[#333333] dark:text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Dúvidas?</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Em caso de dúvidas sobre estes termos, entre em contato conosco através do email:{" "}
                      <a href="mailto:contato@xconstrucao.com.br" className="font-bold text-[#333333] dark:text-white underline">
                        contato@xconstrucao.com.br
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16">
              <Link
                href="/cadastro"
                className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center text-sm"
              >
                Voltar para Cadastro
              </Link>
              <Link
                href="/politica-privacidade"
                className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold px-8 py-3 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center text-sm"
              >
                Ver Política de Privacidade
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
