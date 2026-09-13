export type DomainErrorCode =
  | "invalid_id"
  | "invalid_date"
  | "invalid_time"
  | "invalid_instant"
  | "invalid_time_zone"
  | "invalid_duration"
  | "invalid_interval"
  | "invalid_recurrence"
  | "invalid_template"
  | "invalid_origin"
  | "invalid_occurrence"
  | "invalid_reason"
  | "invalid_execution"
  | "invalid_transition"
  | "invalid_reschedule";

export type DomainError = Readonly<{
  code: DomainErrorCode;
  message: string;
  field?: string;
}>;

export type DomainResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: DomainError }>;

export function success<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}

export function failure(
  code: DomainErrorCode,
  message: string,
  field?: string,
): DomainResult<never> {
  return { ok: false, error: { code, message, ...(field ? { field } : {}) } };
}
