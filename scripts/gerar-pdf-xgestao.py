#!/usr/bin/env python3
"""
Gera o resumo executivo do plano xgestão em PDF (2 páginas).

Uso:  python3 scripts/gerar-pdf-xgestao.py
Saída: docs/novo-fluxo/xgestao-plano-40-45-dias.pdf

Este script é a fonte do PDF — para atualizar preços, prazos ou escopo,
edite os dados abaixo e rode de novo. Não edite o PDF diretamente.

Dependência: pip install fpdf2
"""

from pathlib import Path
from fpdf import FPDF

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs" / "novo-fluxo" / "xgestao-plano-40-45-dias.pdf"

# Fonte Unicode: a Helvetica embutida do fpdf é latin-1 e quebra em travessão
# e aspas curvas. DejaVu cobre todo o português sem substituições.
DIR_FONTES = Path("/usr/share/fonts/truetype/dejavu")
FONTE_REGULAR = DIR_FONTES / "DejaVuSans.ttf"
FONTE_NEGRITO = DIR_FONTES / "DejaVuSans-Bold.ttf"
FAMILIA = "DejaVu"

# ── Paleta ───────────────────────────────────────────────────────────────
LARANJA = (234, 88, 12)
GRAFITE = (31, 41, 55)
CINZA = (107, 114, 128)
CINZA_CLARO = (243, 244, 246)
VERDE = (22, 128, 61)
VERMELHO = (185, 28, 28)
BRANCO = (255, 255, 255)

MARGEM = 14
LARGURA_UTIL = 210 - 2 * MARGEM


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font(FAMILIA, "", 7.5)
        self.set_text_color(*CINZA)
        self.cell(0, 5, "xconstrução — Plano xgestão", align="L")
        self.cell(0, 5, "Página 2 de 2", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-14)
        self.set_font(FAMILIA, "", 7)
        self.set_text_color(*CINZA)
        self.cell(
            0, 4,
            "Documento técnico preliminar — prazos estimados, sujeitos às definições pendentes listadas ao final.",
            align="C",
        )


def titulo_secao(pdf, texto):
    pdf.ln(1.5)
    pdf.set_font(FAMILIA, "B", 10)
    pdf.set_text_color(*LARANJA)
    pdf.cell(0, 5.5, texto.upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*LARANJA)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(MARGEM, y, MARGEM + LARGURA_UTIL, y)
    pdf.ln(2)


def paragrafo(pdf, texto, tamanho=8.5, cor=GRAFITE, estilo=""):
    pdf.set_font(FAMILIA, estilo, tamanho)
    pdf.set_text_color(*cor)
    pdf.multi_cell(LARGURA_UTIL, 4.1, texto, new_x="LMARGIN", new_y="NEXT")


def linha_tabela(pdf, col1, col2, larg1, negrito_col1=True, cor2=GRAFITE):
    """Uma linha de tabela de duas colunas com altura dinâmica."""
    larg2 = LARGURA_UTIL - larg1
    x0, y0 = MARGEM, pdf.get_y()

    pdf.set_font(FAMILIA, "B" if negrito_col1 else "", 8)
    alt1 = len(pdf.multi_cell(larg1, 3.9, col1, dry_run=True, output="LINES"))
    pdf.set_font(FAMILIA, "", 8)
    alt2 = len(pdf.multi_cell(larg2, 3.9, col2, dry_run=True, output="LINES"))
    altura = max(alt1, alt2) * 3.9 + 2.2

    pdf.set_fill_color(*CINZA_CLARO)
    pdf.rect(x0, y0, LARGURA_UTIL, altura, style="F")

    pdf.set_xy(x0 + 1.5, y0 + 1.1)
    pdf.set_font(FAMILIA, "B" if negrito_col1 else "", 8)
    pdf.set_text_color(*GRAFITE)
    pdf.multi_cell(larg1 - 2, 3.9, col1, align="L")

    pdf.set_xy(x0 + larg1, y0 + 1.1)
    pdf.set_font(FAMILIA, "", 8)
    pdf.set_text_color(*cor2)
    pdf.multi_cell(larg2 - 2, 3.9, col2, align="L")

    pdf.set_xy(x0, y0 + altura + 0.9)


def caixa_destaque(pdf, titulo, texto, cor_titulo, cor_fundo):
    """Caixa colorida com título e corpo, altura medida a partir do texto.

    O padrão estava repetido em duas caixas; virou helper quando a terceira
    apareceu. Medir com dry_run evita o texto vazar do retângulo — que é
    desenhado ANTES do conteúdo e não se ajusta sozinho.
    """
    pdf.ln(1)
    pdf.set_font(FAMILIA, "", 8)
    linhas = len(pdf.multi_cell(LARGURA_UTIL - 5, 3.8, texto, dry_run=True, output="LINES"))
    altura = linhas * 3.8 + 7.5

    y0 = pdf.get_y()
    pdf.set_fill_color(*cor_fundo)
    pdf.rect(MARGEM, y0, LARGURA_UTIL, altura, style="F")

    pdf.set_xy(MARGEM + 2.5, y0 + 1.8)
    pdf.set_font(FAMILIA, "B", 8)
    pdf.set_text_color(*cor_titulo)
    pdf.cell(0, 4, titulo, new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(MARGEM + 2.5)
    pdf.set_font(FAMILIA, "", 8)
    pdf.set_text_color(*GRAFITE)
    pdf.multi_cell(LARGURA_UTIL - 5, 3.8, texto)

    pdf.set_y(y0 + altura + 1)


def bullets(pdf, itens, tamanho=8.5):
    for item in itens:
        pdf.set_font(FAMILIA, "", tamanho)
        pdf.set_text_color(*LARANJA)
        pdf.cell(4, 4.1, "•")
        pdf.set_text_color(*GRAFITE)
        pdf.multi_cell(LARGURA_UTIL - 4, 4.1, item, new_x="LMARGIN", new_y="NEXT")


def construir():
    if not FONTE_REGULAR.exists():
        raise SystemExit(
            f"Fonte não encontrada em {FONTE_REGULAR}.\n"
            "Instale a DejaVu (pacote fonts-dejavu-core) ou ajuste DIR_FONTES no topo deste script."
        )

    pdf = PDF(orientation="P", unit="mm", format="A4")
    pdf.add_font(FAMILIA, "", str(FONTE_REGULAR))
    pdf.add_font(FAMILIA, "B", str(FONTE_NEGRITO))
    pdf.set_auto_page_break(auto=True, margin=17)
    pdf.set_margins(MARGEM, 12, MARGEM)
    pdf.add_page()

    # ── Cabeçalho ────────────────────────────────────────────────────────
    pdf.set_fill_color(*LARANJA)
    pdf.rect(0, 0, 210, 22, style="F")
    pdf.set_xy(MARGEM, 5)
    pdf.set_font(FAMILIA, "B", 15)
    pdf.set_text_color(*BRANCO)
    pdf.cell(0, 7, "xgestão — Plano de Desenvolvimento", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGEM)
    pdf.set_font(FAMILIA, "", 9)
    pdf.cell(0, 5, "Nova frente de produto  ·  Estimativa: 40 a 45 dias", new_x="LMARGIN", new_y="NEXT")
    pdf.set_y(26)

    # ── 1. O que muda ────────────────────────────────────────────────────
    titulo_secao(pdf, "1. O que muda")
    paragrafo(
        pdf,
        "O foco passa a ser 100% o xgestão: uma ferramenta de gestão de obras onde o empreiteiro é o "
        "cliente pagante. O contratante deixa de precisar de conta — ele recebe do empreiteiro um link "
        "com o andamento da obra.",
    )
    pdf.ln(1)
    paragrafo(
        pdf,
        "Nada do marketplace será apagado. Todo o fluxo já construído (contratante, empreiteiro, "
        "anunciante) será ocultado por configuração, permanecendo íntegro e reversível a qualquer momento "
        "para o relançamento futuro.",
    )

    # ── 2. Reaproveitamento ──────────────────────────────────────────────
    titulo_secao(pdf, "2. O que já está pronto e será reaproveitado")
    paragrafo(
        pdf,
        "Esta é a razão de o prazo ser viável. O sistema já possui, funcionando:",
    )
    pdf.ln(1.2)

    for nome, desc in [
        ("Painel da obra",
         "Tarefas, checklists com assinatura, cronograma, etapas, fotos por fase, "
         "documentos, ocorrências, equipe e linha do tempo."),
        ("Gestão financeira",
         "Controle de caixa por obra, lançamentos, vencimentos e comprovantes."),
        ("Relatórios",
         "Exportação em PDF e planilha, já implementadas."),
        ("Indicadores",
         "Índice de saúde da obra e cálculo de margem/lucro."),
        ("Cobrança",
         "Planos, assinaturas, integração de pagamento e cobrança recorrente."),
        ("Página de divulgação",
         "A landing do xgestão já está escrita e publicada — só precisa ser ligada ao site."),
    ]:
        linha_tabela(pdf, nome, desc, 40)

    caixa_destaque(
        pdf,
        "Ressalva importante",
        "Reaproveitar não é copiar e colar. Cada tela precisa ser reorganizada para atender ao novo fluxo "
        "sem quebrar o que já funciona — é justamente esse cuidado que consome a maior parte do prazo.",
        LARANJA,
        (255, 247, 237),
    )

    # ── 3. A construir ───────────────────────────────────────────────────
    titulo_secao(pdf, "3. O que precisa ser construído")
    bullets(pdf, [
        "Cadastro e criação de obra pelo próprio empreiteiro (hoje só o contratante cria).",
        "Link de acompanhamento para o cliente final: ele abre sem criar conta e vê a obra em "
        "modo somente leitura, reaproveitando as telas que o contratante já usa hoje.",
        "Limites de obras por plano (1 / 3 / 10) e período de teste.",
        "Área administrativa com visão específica do xgestão.",
        "Entrada e login próprios do xgestão, para o usuário saber em qual produto está.",
    ])

    # O cronograma fecha a página 1; a quebra vem depois dele, deixando a
    # página 2 para escopo e definições pendentes.
    titulo_secao(pdf, "4. Cronograma — 40 a 45 dias")
    paragrafo(
        pdf,
        "São aproximadamente 20 dias úteis de desenvolvimento. O restante do prazo é reservado para "
        "testes conjuntos, ajustes após o primeiro feedback e homologação — a etapa que costuma faltar "
        "e que garante um lançamento sem sobressaltos.",
    )
    pdf.ln(1.5)

    for bloco, desc, risco in [
        ("Bloco 1 · Base e acesso",
         "Estrutura do novo produto, entrada e login próprios do xgestão.", "Baixo"),
        ("Bloco 2 · Obra do empreiteiro",
         "Criação e edição de obras pelo próprio empreiteiro.", "Baixo"),
        ("Bloco 3 · Planos e limites",
         "Limite de obras por plano, período de teste e cobrança.", "Médio"),
        ("Bloco 4 · Telas do cliente",
         "As telas de acompanhamento adaptadas para visualização.", "Médio"),
        ("Bloco 5 · Link do cliente",
         "Link de acompanhamento, com revogação a qualquer momento.", "Médio"),
        ("Bloco 6 · Ocultar marketplace",
         "Marketplace sai de cena por configuração, sem ser removido.", "Baixo"),
        ("Bloco 7 · Administração",
         "Visão administrativa do xgestão.", "Baixo"),
    ]:
        larg1, larg3 = 47.0, 24.0
        larg2 = LARGURA_UTIL - larg1 - larg3
        x0, y0 = MARGEM, pdf.get_y()
        texto_risco = risco

        # A altura precisa acomodar a MAIOR das três colunas — medir só a do
        # meio fazia os nomes de bloco longos vazarem para a linha seguinte.
        pdf.set_font(FAMILIA, "B", 7.8)
        n1 = len(pdf.multi_cell(larg1 - 3, 3.8, bloco, dry_run=True, output="LINES"))
        pdf.set_font(FAMILIA, "", 7.8)
        n2 = len(pdf.multi_cell(larg2 - 3, 3.8, desc, dry_run=True, output="LINES"))
        n3 = len(pdf.multi_cell(larg3 - 3, 3.8, texto_risco, dry_run=True, output="LINES"))
        altura = max(n1, n2, n3) * 3.8 + 2.6

        pdf.set_fill_color(*CINZA_CLARO)
        pdf.rect(x0, y0, LARGURA_UTIL, altura, style="F")

        pdf.set_xy(x0 + 1.5, y0 + 1.3)
        pdf.set_font(FAMILIA, "B", 7.8)
        pdf.set_text_color(*GRAFITE)
        pdf.multi_cell(larg1 - 3, 3.8, bloco, align="L")

        pdf.set_xy(x0 + larg1, y0 + 1.3)
        pdf.set_font(FAMILIA, "", 7.8)
        pdf.multi_cell(larg2 - 3, 3.8, desc, align="L")

        pdf.set_xy(x0 + larg1 + larg2, y0 + 1.3)
        pdf.set_font(FAMILIA, "B" if risco == "ALTO" else "", 7.5)
        pdf.set_text_color(*(VERMELHO if risco == "ALTO" else CINZA))
        pdf.multi_cell(larg3 - 3, 3.8, texto_risco, align="R")

        pdf.set_xy(x0, y0 + altura + 0.9)

    pdf.ln(1)
    paragrafo(
        pdf,
        "A decisão de reaproveitar as telas que o cliente já vê hoje, em vez de criar telas novas, "
        "tirou o maior risco do projeto. O que era um bloco construído do zero virou adaptação de "
        "algo pronto — e a saída da consulta SINAPI e da área de anunciante desta etapa deixou o "
        "caminho mais curto e mais previsível.",
        tamanho=8, cor=CINZA,
    )

    caixa_destaque(
        pdf,
        "Sobre o prazo",
        "Os 40 a 45 dias foram dimensionados com folga proposital: é um teto, não uma meta. "
        "A folga existe para absorver imprevistos sem renegociar data. A tendência, conforme os "
        "blocos forem fechando, é de encurtar esse prazo — e cada bloco entregue antes será "
        "comunicado, não guardado até o fim.",
        LARANJA,
        (255, 247, 237),
    )

    # ── PÁGINA 2 ─────────────────────────────────────────────────────────
    pdf.add_page()

    # ── 5. SINAPI ────────────────────────────────────────────────────────
    # Histórico desta seção: começou como item de "Fora do escopo" (premissa de
    # que não havia consulta automática), virou seção própria quando a API de
    # terceiro apareceu, e voltou a sair do escopo em 19/08 — agora por decisão
    # de sequenciamento do cliente, não por limitação técnica.
    titulo_secao(pdf, "5. Integração SINAPI — adiada para depois do lançamento")
    paragrafo(
        pdf,
        "Ficou decidido na reunião de 19 de agosto que a consulta ao SINAPI não entra nesta etapa. "
        "O motivo não é técnico: o caminho está mapeado e continua viável em poucos dias de "
        "trabalho. É de prioridade — o objetivo agora é a plataforma rodando em obras reais, e a "
        "consulta de preços não é necessária para isso.",
    )
    pdf.ln(1)

    for nome, desc in [
        ("O que fica pronto agora",
         "O levantamento está concluído e documentado: o serviço de consulta, os limites de uso, "
         "os termos do contrato e o desenho da integração. Nada disso se perde."),
        ("Economia imediata",
         "Adiar evita o custo recorrente de R$ 79,90 por mês antes de haver receita, e devolve "
         "esses dias de desenvolvimento para o que é prioridade agora."),
        ("Quando retomar",
         "Na preparação do lançamento comercial. A consulta de preços de referência é um "
         "diferencial de venda, e faz mais sentido quando existe público para percebê-lo."),
    ]:
        linha_tabela(pdf, nome, desc, 40)

    caixa_destaque(
        pdf,
        "O que isso significa para o prazo",
        "Menos um bloco no caminho crítico e um custo recorrente a menos antes do lançamento. "
        "O trabalho de pesquisa já feito fica registrado e é retomado sem retrabalho quando a "
        "funcionalidade voltar à pauta.",
        VERDE,
        (240, 253, 244),
    )

    # ── 6. Fora do escopo ────────────────────────────────────────────────
    titulo_secao(pdf, "6. Fora do escopo desta etapa")
    for nome, desc in [
        ("Migração de infra",
         "Segue como decisão em aberto e não entra nesta etapa. Todo o desenvolvimento acontece "
         "no ambiente atual."),
        ("Área do anunciante",
         "Congelada nesta etapa, conforme decidido em 19 de agosto. O foco é a jornada do "
         "empreiteiro. Ela já está construída no marketplace e volta junto com o relançamento."),
        ("Interação do contratante",
         "O link de acompanhamento é somente leitura: o cliente visualiza a obra, sem enviar "
         "arquivos nem trocar mensagens pela plataforma. Tema retomado adiante."),
    ]:
        linha_tabela(pdf, nome, desc, 40)

    # ── 7. Definições pendentes ──────────────────────────────────────────
    titulo_secao(pdf, "7. O que preciso de vocês")
    paragrafo(
        pdf,
        "A reunião de 19 de agosto respondeu a maior parte das definições que estavam abertas — "
        "limite de obras do plano Pro, formato do link do cliente, área do anunciante e consulta "
        "SINAPI. Restam três, e nenhuma impede o desenvolvimento de começar:",
        tamanho=8.5,
    )
    pdf.ln(1)
    bullets(pdf, [
        "Preços finais dos três planos e o que cada um inclui. Vocês ficaram de enviar o "
        "documento detalhado. Isso é necessário antes do fechamento do Bloco 3.",
        "Como funciona o período de teste. Há um ponto a alinhar: o documento de monetização "
        "descreve acesso completo e irrestrito por 3 meses, e na reunião ficou dito que o usuário "
        "teria o acesso do plano dele. São dois comportamentos diferentes do sistema — o segundo "
        "é bem mais simples de construir. Basta confirmar qual dos dois vale.",
        "Acesso ao registrador do domínio xconstrução, para apontar o endereço na hora do "
        "lançamento. Não bloqueia o desenvolvimento, mas precisa estar resolvido antes de subir.",
    ])

    caixa_destaque(
        pdf,
        "Compromisso de acompanhamento",
        "Reunião semanal de alinhamento do início ao fim do projeto. Assim que as primeiras telas "
        "estiverem navegáveis, essas reuniões passam a ser feitas sobre a tela real — vocês veem e "
        "testam o que foi construído antes de o bloco ser dado como fechado. É esse ciclo curto que "
        "acelera o processo: o ajuste aparece na semana em que o trabalho foi feito, e não na "
        "véspera do lançamento.",
        VERDE,
        (240, 253, 244),
    )

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(SAIDA))
    print(f"PDF gerado: {SAIDA}  ({SAIDA.stat().st_size / 1024:.1f} KB, {pdf.page_no()} páginas)")


if __name__ == "__main__":
    construir()
