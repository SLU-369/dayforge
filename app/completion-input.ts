import {
  createExecutionRecord, createTimedExecutionTiming, executionRecordId,
  type ExecutionRecord,
} from "../domain/temporal/index.ts";

import { confirmedInstant as actualInstant } from './temporal-input.ts';

export type CompletionInput = Readonly<{ start: string; end: string; timeZone: string; note: string }>;

export { confirmedInstant as actualInstant } from './temporal-input.ts';

export function buildCompletionRecord(occurrenceId: string, input: CompletionInput, recordedAt: string): ExecutionRecord {
  if (!/^occ:[1-9]\d*$/.test(occurrenceId)) throw new Error("Ocorrência canônica inválida.");
  const id = executionRecordId(`execution:${occurrenceId}`);
  const timing = createTimedExecutionTiming({ start: actualInstant(input.start, input.timeZone), end: actualInstant(input.end, input.timeZone), timeZone: input.timeZone });
  if (!id.ok || !timing.ok) throw new Error("O fim real deve ser posterior ao início real.");
  const record = createExecutionRecord({ id: id.value, timing: timing.value, recordedAt,
    ...(input.note.trim() ? { note: input.note.trim() } : {}) });
  if (!record.ok) throw new Error("Não foi possível validar o registro de execução.");
  return record.value;
}
