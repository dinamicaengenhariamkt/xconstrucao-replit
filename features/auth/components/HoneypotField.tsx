'use client';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/**
 * Campo invisível anti-bot. Usuários reais nunca veem nem tabulam para ele;
 * bots que preenchem todos os inputs disparam o honeypot no servidor.
 */
export function HoneypotField({ value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <label>
        Website (não preencha)
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
