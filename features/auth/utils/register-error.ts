export class RegistrationRateLimitError extends Error {
  readonly retryAfterSeconds: number;
  readonly retryAt: number;

  constructor(message: string, retryAfterSeconds: number, retryAt?: number) {
    super(message);
    this.name = "RegistrationRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.retryAt =
      retryAt && Number.isFinite(retryAt)
        ? retryAt
        : Date.now() + retryAfterSeconds * 1000;
  }
}