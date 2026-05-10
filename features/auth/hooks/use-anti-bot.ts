'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook que devolve o payload anti-bot a ser enviado em cada submit:
 *  - `website`: honeypot (sempre "")
 *  - `mountedAt`: timestamp em ms de quando o form foi montado
 *
 * Use junto do componente <HoneypotField /> para o campo invisível.
 */
export function useAntiBotPayload() {
  const mountedAtRef = useRef<number>(Date.now());
  const [website, setWebsite] = useState('');

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  return {
    website,
    setWebsite,
    getPayload: () => ({ website, mountedAt: mountedAtRef.current }),
  };
}
