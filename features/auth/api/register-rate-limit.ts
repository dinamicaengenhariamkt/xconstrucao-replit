import { createHash } from "node:crypto";
import { checkRateLimit, type RateLimitResult } from "./rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const REQUEST_LIMIT_BY_IP = 60;
const EMERGENCY_REQUEST_LIMIT = 1_000;
const TARGET_LIMIT = 5;
const CREATION_LIMIT_BY_IP = 10;
const EMERGENCY_CREATION_LIMIT = 100;

export type RegisterRateLimitStage = "request" | "target" | "creation";

export interface RegisterRateLimitDecision extends RateLimitResult {
  stage: RegisterRateLimitStage;
}

function identifierHash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function getRegisterClientKey(ip: string): string {
  if (ip !== "unknown") return `ip:${ip}`;
  return "unidentified";
}

function decision(
  stage: RegisterRateLimitStage,
  key: string,
  max: number,
  windowMs: number,
  now?: number,
): RegisterRateLimitDecision {
  return {
    stage,
    ...checkRateLimit(key, max, windowMs, now),
  };
}

/**
 * Barreira ampla contra rajadas. Sem IP confiável, usa um circuito global alto:
 * não confia em headers controláveis pelo cliente e não cria uma cota pequena
 * compartilhada entre usuários legítimos.
 */
export function checkRegisterRequestLimit(
  clientKey: string,
  now?: number,
): RegisterRateLimitDecision {
  return decision(
    "request",
    `register.request:${clientKey}`,
    clientKey === "unidentified" ? EMERGENCY_REQUEST_LIMIT : REQUEST_LIMIT_BY_IP,
    TEN_MINUTES,
    now,
  );
}

/**
 * Limite por destino, aplicado somente depois de schema, anti-bot e senha.
 * Pessoas diferentes atrás do mesmo IP não compartilham esta cota.
 */
export function checkRegisterTargetLimit(
  email: string,
  now?: number,
): RegisterRateLimitDecision {
  return decision(
    "target",
    `register.target:${identifierHash(email)}`,
    TARGET_LIMIT,
    FIFTEEN_MINUTES,
    now,
  );
}

/**
 * Evita criação em massa depois das validações. Sem IP, o circuito global é
 * deliberadamente alto: funciona como proteção emergencial contra abuso maciço,
 * sem bloquear correções e cadastros normais.
 */
export function checkRegisterCreationLimit(
  clientKey: string,
  now?: number,
): RegisterRateLimitDecision {
  return decision(
    "creation",
    `register.creation:${clientKey}`,
    clientKey === "unidentified" ? EMERGENCY_CREATION_LIMIT : CREATION_LIMIT_BY_IP,
    ONE_HOUR,
    now,
  );
}

export function formatRetryWait(seconds: number): string {
  if (seconds < 60) return "menos de 1 minuto";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${hours === 1 ? "hora" : "horas"}`;
}