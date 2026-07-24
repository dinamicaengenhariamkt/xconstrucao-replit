'use client';

import { useState } from 'react';
import { RiStarFill, RiStarLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { useSurveysPendentes, useResponderSurvey, type SurveyPendente } from '../hooks/use-surveys';

/**
 * J20 — Card de coleta de pesquisa (NPS/CSAT). Renderiza o PRIMEIRO convite
 * pendente do usuário. NPS = escala 0-10 (botões); CSAT = 0-5 estrelas.
 * Comentário livre é opcional (LGPD). Some ao responder (invalida a lista).
 */
export function SurveyPendenteCard() {
  const { data: pendentes } = useSurveysPendentes();
  const survey = pendentes?.[0];
  if (!survey) return null;
  return <SurveyForm survey={survey} />;
}

function SurveyForm({ survey }: { survey: SurveyPendente }) {
  const responder = useResponderSurvey();
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');

  const isNps = survey.tipo === 'nps';
  const max = isNps ? 10 : 5;
  const titulo = isNps ? 'Como foi sua experiência?' : 'Como foi o pagamento?';
  const descricao = isNps
    ? 'De 0 a 10, o quanto você recomendaria a plataforma?'
    : 'De 1 a 5, como você avalia esta experiência?';

  function enviar() {
    if (nota === null) return;
    responder.mutate({ surveyId: survey.id, nota, comentario });
  }

  return (
    <Card className="luminous-section border-transparent shadow-none" data-testid="survey-pendente-card">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isNps ? (
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nota de 0 a 10">
            {Array.from({ length: max + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nota === n}
                data-testid={`survey-nota-${n}`}
                onClick={() => setNota(n)}
                className={[
                  'h-10 w-10 rounded-md border text-sm font-medium transition-colors',
                  nota === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nota === n}
                data-testid={`survey-estrela-${n}`}
                onClick={() => setNota(n)}
                className="text-2xl text-amber-500"
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              >
                {nota !== null && n <= nota ? <RiStarFill /> : <RiStarLine />}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Quer deixar um comentário? (opcional)"
          data-testid="survey-comentario"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Seu comentário é opcional e usado apenas para melhorar a plataforma.
        </p>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={enviar}
            disabled={nota === null || responder.isPending}
            data-testid="survey-enviar"
          >
            {responder.isPending ? 'Enviando…' : 'Enviar resposta'}
          </Button>
          {responder.isError && (
            <span className="text-sm text-destructive">Não foi possível enviar. Tente de novo.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
