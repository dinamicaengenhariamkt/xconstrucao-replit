"use client";

import Link from "next/link";
import { GlassNav } from "@/components/glass-nav";
import { SiteFooter } from "@/components/site-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@shared/components/ui/accordion";
import { Card, CardContent } from "@shared/components/ui/card";
import { Separator } from "@shared/components/ui/separator";
import { Shield, Mail } from "lucide-react";
import { StructuredData } from "@/components/structured-data";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@/lib/seo';

export default function PoliticaDePrivacidade() {
  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Política de Privacidade', url: '/politica-privacidade' }
        ]),
        generateWebPageSchema({
          title: 'Política de Privacidade - XConstrução',
          description: 'Política de privacidade e proteção de dados da XConstrução',
          url: '/politica-privacidade',
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
              <Shield className="w-4 h-4" />
              <span>Política de Privacidade</span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95]"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Política de Privacidade
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
                A XConstrução está comprometida em proteger a privacidade e segurança dos dados pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Ao utilizar a plataforma XConstrução, você concorda com as práticas descritas nesta política. Recomendamos que você leia esta política atentamente.
              </p>
            </div>

            <Separator className="my-12" />

            {/* Accordion Sections */}
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  1. Introdução e Compromisso com a Privacidade
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    A privacidade dos nossos usuários é fundamental para a XConstrução. Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
                  </p>
                  <p>
                    Esta política se aplica a todos os usuários da plataforma XConstrução, incluindo visitantes, usuários cadastrados, contratantes e empreiteiros.
                  </p>
                  <p>
                    <strong>Conformidade legal:</strong> Estamos em total conformidade com:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</li>
                    <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
                    <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
                  </ul>
                  <p>
                    A XConstrução designou um Encarregado de Dados (DPO - Data Protection Officer) responsável por garantir a conformidade com as leis de proteção de dados e responder às suas solicitações relacionadas à privacidade.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  2. Dados Coletados
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Coletamos diferentes tipos de dados para fornecer e melhorar nossos serviços:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold mb-2">Dados de Cadastro (fornecidos por você):</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Nome completo</li>
                        <li>Email</li>
                        <li>Telefone</li>
                        <li>CPF ou CNPJ</li>
                        <li>Endereço</li>
                        <li>Data de nascimento</li>
                        <li>Foto de perfil (opcional)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Dados Profissionais (para empreiteiros):</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Número de registro profissional (CREA, CAU, etc.)</li>
                        <li>ART (Anotação de Responsabilidade Técnica)</li>
                        <li>RRT (Registro de Responsabilidade Técnica)</li>
                        <li>Portfólio de obras realizadas</li>
                        <li>Certificações e qualificações</li>
                        <li>Documentação técnica</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Dados de Uso (coletados automaticamente):</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Endereço IP</li>
                        <li>Tipo e versão do navegador</li>
                        <li>Sistema operacional</li>
                        <li>Páginas visitadas e tempo de permanência</li>
                        <li>Ações realizadas na plataforma</li>
                        <li>Data e hora de acesso</li>
                        <li>Cookies e identificadores de dispositivo</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Dados de Transação:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Histórico de obras e projetos</li>
                        <li>Orçamentos e propostas</li>
                        <li>Informações financeiras (contas bancárias, cartões)</li>
                        <li>Histórico de pagamentos</li>
                        <li>Avaliações e comentários</li>
                      </ul>
                    </div>
                  </div>

                  <p className="mt-4">
                    Todos os dados são coletados com base em seu consentimento explícito ou conforme necessário para a execução do contrato de serviço.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  3. Como Utilizamos Seus Dados
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Utilizamos seus dados pessoais para as seguintes finalidades:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">Prestação de Serviços:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Criar e gerenciar sua conta na plataforma</li>
                        <li>Processar e executar transações</li>
                        <li>Conectar contratantes e empreiteiros</li>
                        <li>Fornecer acesso às funcionalidades da plataforma (xgestão inteligente, tabela SINAPI, etc.)</li>
                        <li>Processar pagamentos e emitir recibos</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Comunicação:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Enviar notificações sobre sua conta e atividades</li>
                        <li>Responder a suas solicitações e fornecer suporte ao cliente</li>
                        <li>Enviar atualizações sobre mudanças em nossos termos e políticas</li>
                        <li>Comunicar sobre novas funcionalidades e serviços</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Melhorias na Plataforma:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Analisar o uso da plataforma para melhorar funcionalidades</li>
                        <li>Desenvolver novos recursos e serviços</li>
                        <li>Personalizar sua experiência de usuário</li>
                        <li>Realizar pesquisas e análises estatísticas</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Segurança e Conformidade:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Prevenir fraudes e atividades ilegais</li>
                        <li>Garantir a segurança da plataforma</li>
                        <li>Cumprir obrigações legais e regulatórias</li>
                        <li>Resolver disputas e fazer cumprir nossos termos</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Marketing (mediante consentimento):</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Enviar newsletters e materiais promocionais</li>
                        <li>Ofertas personalizadas de serviços</li>
                        <li>Convites para eventos e webinars</li>
                      </ul>
                      <p className="text-sm mt-2 italic">Você pode cancelar o recebimento de comunicações de marketing a qualquer momento através do link de descadastramento incluído em cada email.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  4. Compartilhamento de Dados
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    A XConstrução não vende seus dados pessoais a terceiros. Compartilhamos seus dados apenas nas seguintes situações:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">Com Outros Usuários da Plataforma:</h4>
                      <p>Quando você cria um perfil público na plataforma, certas informações (nome, foto, portfólio, avaliações) são visíveis para outros usuários para facilitar a conexão entre contratantes e empreiteiros.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Com Prestadores de Serviço:</h4>
                      <p>Compartilhamos dados com empresas terceirizadas que nos auxiliam na operação da plataforma, incluindo:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Provedores de hospedagem e armazenamento em nuvem</li>
                        <li>Processadores de pagamento</li>
                        <li>Serviços de email e comunicação</li>
                        <li>Ferramentas de análise e monitoramento</li>
                      </ul>
                      <p className="text-sm mt-2 italic">Todos os prestadores de serviço são contratualmente obrigados a proteger seus dados e usá-los apenas para os fins especificados.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Por Exigência Legal:</h4>
                      <p>Podemos divulgar seus dados quando necessário para:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Cumprir uma ordem judicial ou intimação</li>
                        <li>Responder a solicitações de autoridades governamentais</li>
                        <li>Proteger direitos, propriedade ou segurança da XConstrução e de nossos usuários</li>
                        <li>Investigar ou prevenir atividades ilegais</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Em Caso de Reorganização Empresarial:</h4>
                      <p>Se a XConstrução passar por uma fusão, aquisição ou venda de ativos, seus dados pessoais podem ser transferidos. Notificaremos você sobre tal mudança e sobre as escolhas que você tem em relação aos seus dados.</p>
                    </div>
                  </div>

                  <p className="mt-4 font-semibold">
                    Importante: Nunca vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing sem seu consentimento explícito.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  5. Cookies e Tecnologias Similares
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma, personalizar conteúdo e analisar o tráfego.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">O que são cookies?</h4>
                      <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site reconheça seu dispositivo e lembre suas preferências.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Tipos de cookies que utilizamos:</h4>

                      <div className="space-y-2 mt-2">
                        <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-3">
                          <p className="font-semibold">Cookies Essenciais (Necessários)</p>
                          <p className="text-sm mt-1">Permitem que você navegue na plataforma e use seus recursos. Sem eles, serviços como login e carrinho de compras não funcionariam.</p>
                        </div>

                        <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-3">
                          <p className="font-semibold">Cookies de Desempenho (Analíticos)</p>
                          <p className="text-sm mt-1">Coletam informações sobre como você usa a plataforma, permitindo-nos melhorar seu funcionamento. Exemplo: Google Analytics.</p>
                        </div>

                        <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-3">
                          <p className="font-semibold">Cookies de Funcionalidade</p>
                          <p className="text-sm mt-1">Lembram suas escolhas (como idioma ou região) para fornecer uma experiência personalizada.</p>
                        </div>

                        <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-3">
                          <p className="font-semibold">Cookies de Marketing (Publicidade)</p>
                          <p className="text-sm mt-1">Usados para exibir anúncios relevantes e medir a eficácia de campanhas publicitárias. Requerem seu consentimento.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Gerenciamento de Cookies:</h4>
                      <p>Você pode controlar e/ou excluir cookies conforme desejar. A maioria dos navegadores permite que você:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Veja quais cookies estão armazenados</li>
                        <li>Exclua cookies individualmente ou todos de uma vez</li>
                        <li>Bloqueie cookies de sites específicos ou de todos os sites</li>
                        <li>Exclua todos os cookies ao fechar o navegador</li>
                      </ul>
                      <p className="text-sm mt-2 italic">Observe que bloquear todos os cookies pode afetar a funcionalidade da plataforma.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  6. Segurança de Dados
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    A segurança dos seus dados pessoais é extremamente importante para nós. Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">Medidas de Segurança Técnica:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Criptografia SSL/TLS:</strong> Todos os dados transmitidos entre seu navegador e nossos servidores são criptografados</li>
                        <li><strong>Criptografia de dados:</strong> Dados sensíveis (como senhas e informações financeiras) são criptografados em nosso banco de dados</li>
                        <li><strong>Firewalls:</strong> Proteção contra acessos não autorizados aos nossos sistemas</li>
                        <li><strong>Monitoramento contínuo:</strong> Sistemas de detecção de intrusão e monitoramento 24/7</li>
                        <li><strong>Backups regulares:</strong> Cópias de segurança automáticas para prevenir perda de dados</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Medidas de Segurança Organizacional:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Acesso restrito:</strong> Apenas funcionários autorizados têm acesso aos dados pessoais</li>
                        <li><strong>Treinamento:</strong> Equipe treinada regularmente sobre segurança e privacidade de dados</li>
                        <li><strong>Contratos de confidencialidade:</strong> Todos os funcionários e prestadores de serviço assinam acordos de confidencialidade</li>
                        <li><strong>Auditorias:</strong> Revisões periódicas de segurança e conformidade</li>
                        <li><strong>Políticas internas:</strong> Procedimentos documentados para tratamento de dados</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Suas Responsabilidades:</h4>
                      <p>Você também desempenha um papel importante na segurança dos seus dados:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Use senhas fortes e únicas</li>
                        <li>Não compartilhe suas credenciais de acesso</li>
                        <li>Faça logout ao usar dispositivos compartilhados</li>
                        <li>Mantenha seu software e antivírus atualizados</li>
                        <li>Notifique-nos imediatamente sobre atividades suspeitas</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Notificação de Violação:</h4>
                      <p>Em caso de violação de segurança que possa resultar em risco aos seus direitos e liberdades, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD, dentro do prazo legal.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  7. Seus Direitos (LGPD)
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    De acordo com a Lei Geral de Proteção de Dados (LGPD), você possui os seguintes direitos em relação aos seus dados pessoais:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">1. Direito de Confirmação e Acesso</h4>
                      <p className="text-sm">Confirmar se tratamos seus dados e acessar os dados pessoais que mantemos sobre você.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">2. Direito de Correção</h4>
                      <p className="text-sm">Solicitar a correção de dados incompletos, inexatos ou desatualizados.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">3. Direito de Anonimização, Bloqueio ou Eliminação</h4>
                      <p className="text-sm">Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">4. Direito de Portabilidade</h4>
                      <p className="text-sm">Solicitar a portabilidade de seus dados a outro fornecedor de serviço ou produto, mediante requisição expressa.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">5. Direito de Eliminação</h4>
                      <p className="text-sm">Solicitar a exclusão de dados tratados com base no seu consentimento (exceto quando houver outra base legal).</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">6. Direito de Informação</h4>
                      <p className="text-sm">Obter informações sobre entidades públicas e privadas com as quais compartilhamos seus dados.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">7. Direito de Informação sobre Consentimento</h4>
                      <p className="text-sm">Ser informado sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.</p>
                    </div>

                    <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-lg p-4">
                      <h4 className="font-bold mb-2">8. Direito de Revogação do Consentimento</h4>
                      <p className="text-sm">Revogar o consentimento a qualquer momento, mediante manifestação expressa.</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold mb-2">Como Exercer Seus Direitos:</h4>
                    <p>Para exercer qualquer um desses direitos, entre em contato conosco através de:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li><strong>Email:</strong> privacidade@xconstrucao.com.br</li>
                      <li><strong>Formulário online:</strong> Disponível na seção "Minha Conta" &gt; "Privacidade"</li>
                    </ul>
                    <p className="text-sm mt-2 italic">Responderemos à sua solicitação dentro de 15 (quinze) dias conforme estabelecido pela LGPD.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  8. Retenção de Dados
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados, incluindo requisitos legais, contábeis ou de relatórios.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">Critérios de Retenção:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Duração do relacionamento:</strong> Enquanto você mantiver uma conta ativa conosco</li>
                        <li><strong>Obrigações legais:</strong> Conforme exigido por lei (ex: documentos fiscais por 5 anos)</li>
                        <li><strong>Resolução de disputas:</strong> Até que todas as disputas sejam resolvidas</li>
                        <li><strong>Prevenção de fraudes:</strong> Dados relacionados a fraudes podem ser mantidos por mais tempo</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Períodos de Retenção Específicos:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Dados de cadastro:</strong> Até a exclusão da conta + 5 anos (obrigações fiscais)</li>
                        <li><strong>Dados de transação:</strong> 5 anos após a conclusão da transação</li>
                        <li><strong>Logs de acesso:</strong> 6 meses (Marco Civil da Internet)</li>
                        <li><strong>Cookies:</strong> Conforme configuração (geralmente até 24 meses)</li>
                        <li><strong>Comunicações de marketing:</strong> Até a revogação do consentimento</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Exclusão de Dados:</h4>
                      <p>Quando não for mais necessário reter seus dados, nós:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Excluiremos os dados de forma segura e irreversível</li>
                        <li>Anonimizaremos os dados para fins estatísticos</li>
                        <li>Arquivaremos os dados se exigido por lei</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Exclusão de Conta:</h4>
                      <p>Você pode solicitar a exclusão de sua conta a qualquer momento. Após a exclusão:</p>
                      <ul className="list-disc pl-6 space-y-1 mt-2">
                        <li>Seus dados pessoais serão removidos de nossos sistemas ativos</li>
                        <li>Alguns dados podem ser retidos em backups por até 90 dias</li>
                        <li>Dados necessários para obrigações legais serão mantidos conforme exigido</li>
                        <li>Dados anonimizados podem ser mantidos para fins estatísticos</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  9. Alterações na Política de Privacidade
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, tecnologias, requisitos legais ou por outros motivos operacionais.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold mb-1">Como Notificaremos Você:</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Email:</strong> Enviaremos uma notificação para o endereço de email cadastrado</li>
                        <li><strong>Notificação na plataforma:</strong> Exibiremos um aviso destacado ao fazer login</li>
                        <li><strong>Banner:</strong> Aviso visível na página inicial da plataforma</li>
                        <li><strong>Data de atualização:</strong> Sempre indicaremos a data da última atualização no topo desta política</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Mudanças Significativas:</h4>
                      <p>Em caso de alterações significativas que afetem seus direitos, forneceremos um aviso com antecedência de 30 dias e, quando exigido por lei, solicitaremos seu consentimento explícito antes de aplicar as novas práticas.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Seu Consentimento:</h4>
                      <p>Ao continuar usando a plataforma após a publicação de alterações, você concorda com a política atualizada. Se não concordar com as mudanças, você deve interromper o uso da plataforma e pode solicitar a exclusão de sua conta.</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-1">Histórico de Versões:</h4>
                      <p>Mantemos um registro de versões anteriores desta política, que pode ser solicitado através do email: privacidade@xconstrucao.com.br</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border border-slate-100 dark:border-slate-800 rounded-2xl px-6">
                <AccordionTrigger className="text-xl font-bold hover:no-underline">
                  10. Contato e Encarregado de Dados (DPO)
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                  <p>
                    Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco:
                  </p>

                  <div className="bg-[#F4F5F5] dark:bg-[#2A2D30]/50 rounded-xl p-6 space-y-4">
                    <div>
                      <h4 className="font-bold mb-2">Encarregado de Dados (DPO)</h4>
                      <p><strong>Nome:</strong> [Nome do DPO]</p>
                      <p><strong>Email:</strong> privacidade@xconstrucao.com.br</p>
                      <p><strong>Telefone:</strong> (11) 0000-0000</p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-bold mb-2">Contato Geral</h4>
                      <p><strong>Email:</strong> contato@xconstrucao.com.br</p>
                      <p><strong>Telefone:</strong> (11) 0000-0000</p>
                      <p><strong>Horário de atendimento:</strong> Segunda a sexta, das 9h às 18h</p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-bold mb-2">Endereço Postal</h4>
                      <p>XConstrução Ltda.</p>
                      <p>[Endereço completo]</p>
                      <p>São Paulo - SP, Brasil</p>
                      <p>CEP: [CEP]</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold mb-2">Autoridade Nacional de Proteção de Dados (ANPD):</h4>
                    <p>Você também tem o direito de apresentar uma reclamação à ANPD caso considere que o tratamento de seus dados pessoais viola a LGPD:</p>
                    <p className="mt-2"><strong>Website:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline text-[#333333] dark:text-white">www.gov.br/anpd</a></p>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold mb-2">Prazo de Resposta:</h4>
                    <p>Faremos o possível para responder às suas solicitações dentro de 15 (quinze) dias úteis, conforme estabelecido pela LGPD. Em casos excepcionais, podemos estender este prazo, informando você sobre o motivo da extensão.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Important Notice Card */}
            <Card className="mt-12 bg-[#F4F5F5] dark:bg-[#2A2D30] border-0" style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}>
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <Mail className="w-8 h-8 text-[#333333] dark:text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Dúvidas sobre Privacidade?</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Em caso de dúvidas sobre esta política ou sobre como tratamos seus dados, entre em contato com nosso Encarregado de Dados através do email:{" "}
                      <a href="mailto:privacidade@xconstrucao.com.br" className="font-bold text-[#333333] dark:text-white underline">
                        privacidade@xconstrucao.com.br
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
                href="/termos"
                className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold px-8 py-3 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center text-sm"
              >
                Ver Termos de Uso
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
