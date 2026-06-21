import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (dsn) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      environment: process.env.NODE_ENV ?? "development",
      beforeSend(event) {
        return scrubEvent(event);
      },
    });
  }
}
