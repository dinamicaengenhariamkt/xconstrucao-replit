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

    pdf.ln(1)
    pdf.set_fill_color(255, 247, 237)
    y0 = pdf.get_y()
    pdf.rect(MARGEM, y0, LARGURA_UTIL, 13, style="F")
    pdf.set_xy(MARGEM + 2.5, y0 + 1.8)
    pdf.set_font(FAMILIA, "B", 8)
    pdf.set_text_color(*LARANJA)
    pdf.cell(0, 4, "Ressalva importante", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGEM + 2.5)
    pdf.set_font(FAMILIA, "", 8)
    pdf.set_text_color(*GRAFITE)
    pdf.multi_cell(
        LARGURA_UTIL - 5, 3.8,
        "Reaproveitar não é copiar e colar. Cada tela precisa ser reorganizada para atender ao novo fluxo "
        "sem quebrar o que já funciona — é justamente esse cuidado que consome a maior parte do prazo.",
    )
    pdf.set_y(y0 + 14)

    # ── 3. A construir ───────────────────────────────────────────────────
    titulo_secao(pdf, "3. O que precisa ser construído")
    bullets(pdf, [
        "Cadastro e criação de obra pelo próprio empreiteiro (hoje só o contratante cria).",
        "Link público de acompanhamento para o cliente final, com espaço de anúncio — usado também "
        "para divulgar o marketplace que vem a seguir.",
        "Limites de obras por plano (1 / 3 / 10) e período de teste de 3 meses.",
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
        ("Bloco 4 · Link do cliente",
         "Página pública de acompanhamento com espaço de anúncio.", "ALTO"),
        ("Bloco 5 · Ocultar marketplace",
         "Marketplace sai de cena por configuração, sem ser removido.", "Baixo"),
        ("Bloco 6 · Administração",
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
        "O link do cliente é o único item construído do zero — não existe nada parecido hoje. Por isso "
        "ele começa já na segunda semana, para que eventuais imprevistos caibam dentro do prazo.",
        tamanho=8, cor=CINZA,
    )

    # ── PÁGINA 2 ─────────────────────────────────────────────────────────
    pdf.add_page()

    # ── 5. Fora do escopo ────────────────────────────────────────────────
    titulo_secao(pdf, "5. Fora do escopo desta etapa")
    for nome, desc in [
        ("Integração SINAPI",
         "Hoje o SINAPI aparece apenas como texto de divulgação — não há integração implementada. "
         "Os dados são publicados majoritariamente em planilhas mensais por estado, e não como serviço "
         "de consulta automática, o que torna a integração um projeto próprio, de várias semanas. "
         "Fica para a etapa seguinte. Se houver um serviço de consulta que eu desconheça, "
         "basta me indicar que eu reavalio."),
        ("Migração de infra",
         "Segue como decisão em aberto e não entra nesta etapa. Todo o desenvolvimento acontece no "
         "ambiente atual."),
    ]:
        linha_tabela(pdf, nome, desc, 40)

    # ── 6. Definições pendentes ──────────────────────────────────────────
    titulo_secao(pdf, "6. O que preciso de vocês")
    paragrafo(
        pdf,
        "Quatro definições destravam o cronograma. As três primeiras são necessárias antes do Bloco 3:",
        tamanho=8.5,
    )
    pdf.ln(1)
    bullets(pdf, [
        "Preços finais dos três planos (o documento e o sistema estão divergentes hoje).",
        "Como funciona o teste de 3 meses: acesso gratuito limitado, ou acesso completo com "
        "redução automática ao final?",
        "Limite do plano Pro: 10 ou 15 obras? Do lado técnico é indiferente — é apenas um número "
        "de configuração.",
        "SINAPI: existe um serviço de consulta automática disponível?",
    ])

    pdf.ln(1.5)
    pdf.set_fill_color(240, 253, 244)
    y0 = pdf.get_y()
    pdf.rect(MARGEM, y0, LARGURA_UTIL, 12, style="F")
    pdf.set_xy(MARGEM + 2.5, y0 + 1.8)
    pdf.set_font(FAMILIA, "B", 8)
    pdf.set_text_color(*VERDE)
    pdf.cell(0, 4, "Compromisso de acompanhamento", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(MARGEM + 2.5)
    pdf.set_font(FAMILIA, "", 8)
    pdf.set_text_color(*GRAFITE)
    pdf.multi_cell(
        LARGURA_UTIL - 5, 3.8,
        "Reunião semanal de alinhamento, com testes feitos em conjunto a cada bloco entregue — "
        "para que os ajustes apareçam cedo, e não na véspera do lançamento.",
    )

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(SAIDA))
    print(f"PDF gerado: {SAIDA}  ({SAIDA.stat().st_size / 1024:.1f} KB, {pdf.page_no()} páginas)")


if __name__ == "__main__":
    construir()
