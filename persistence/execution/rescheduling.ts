import { appendRescheduleEvent, createTimedSchedule, createTemporalReason, parseUtcInstant, rescheduleEventId,
  type OccurrenceSchedule, type TemporalReason, type DomainResult } from "../../domain/temporal/index.ts";
import { assertAuthorityEpoch, type LocalPersistenceRepository } from "../contracts/index.ts";
import { readPlannerAuthoritySnapshot } from "../backup/export-backup-v2.ts";
import { canonicalStringify, type Sha256Hasher } from "../migration/index.ts";
import { canRescheduleBinding, occurrenceRevision, ExecutionBridgeError, type ExecutionBridge } from "./bridge.ts";
import { OccurrenceConflictError, savePlannerWithBridge } from "./repository.ts";

export type ReschedulingIntent = Readonly<{
  occurrenceId: string; expectedAuthorityEpoch: number; expectedRevision: string; expectedHistoryLength: number;
  previousSchedule?: OccurrenceSchedule; schedule: OccurrenceSchedule; changedAt: string; reason?: TemporalReason;
}>;
function value<T>(result: DomainResult<T>): T {
  if (!result.ok) throw new OccurrenceConflictError("Planejamento inválido: confira horários, fuso e histórico.");
  return result.value;
}
const same = (left: unknown, right: unknown) => canonicalStringify(JSON.parse(JSON.stringify(left))) === canonicalStringify(JSON.parse(JSON.stringify(right)));

/** Event identity is the captured append position. Its full payload identifies a retry. */
export async function rescheduleOccurrencePlanning(options: ReschedulingIntent & Readonly<{
  repository: LocalPersistenceRepository; hasher?: Sha256Hasher; afterWriteForTest?: () => void;
}>): Promise<ExecutionBridge> {
  const snapshot = await readPlannerAuthoritySnapshot({ repository: options.repository, active: true, exportedAt: "1970-01-01T00:00:00.000Z", hasher: options.hasher });
  if (snapshot.authorityEpoch !== options.expectedAuthorityEpoch) throw new OccurrenceConflictError("Os dados foram substituídos. Cancele e abra uma nova ação.");
  if (!Number.isSafeInteger(options.expectedHistoryLength) || options.expectedHistoryLength < 0) throw new OccurrenceConflictError();
  const bridge = snapshot.backup.payload.executionBridge?.bridge;
  const binding = bridge?.entries.find((entry) => entry.occurrenceId === options.occurrenceId);
  if (!binding || !bridge) throw new OccurrenceConflictError();
  if (options.schedule.kind !== "timed") throw new OccurrenceConflictError("Informe início e fim completos do novo planejamento.");
  if (/^[+-]/.test(options.schedule.timeZone) || options.previousSchedule && /^[+-]/.test(options.previousSchedule.timeZone)) throw new OccurrenceConflictError("Informe um identificador IANA, não apenas um offset.");
  const schedule = value(createTimedSchedule(options.schedule));
  const changedAt = value(parseUtcInstant(options.changedAt));
  if (Date.parse(schedule.startsAt) + schedule.durationMinutes * 60_000 <= Date.parse(changedAt)) throw new OccurrenceConflictError("O novo planejamento não pode ter terminado no passado.");
  const reason = options.reason ? value(createTemporalReason(options.reason)) : undefined;
  const id = value(rescheduleEventId(`reschedule:${options.occurrenceId}:${options.expectedHistoryLength + 1}`));
  const existing = binding.planningAudit?.rescheduleHistory[options.expectedHistoryLength];
  if (existing) {
    const audit = binding.planningAudit!;
    const { planningAudit: _audit, ...base } = binding;
    void _audit;
    const previousAudit = { ...audit, rescheduleHistory: audit.rescheduleHistory.slice(0, options.expectedHistoryLength) };
    const previousBinding = { ...base, item: audit.baselineItem, execution: null,
      ...(options.expectedHistoryLength ? { planningAudit: previousAudit } : {}) };
    const unconfirmedBaseline = occurrenceRevision(previousBinding) === options.expectedRevision;
    const matchesRevision = unconfirmedBaseline
      || options.expectedHistoryLength === 0 && occurrenceRevision({ ...previousBinding, planningAudit: previousAudit }) === options.expectedRevision;
    if (!matchesRevision) throw new OccurrenceConflictError();
    if (!same(existing, { ...existing, id, to: schedule, changedAt, ...(reason ? { reason } : {}) })
      || !same(existing.reason ?? null, reason ?? null)
      || options.expectedHistoryLength === 0 && (unconfirmedBaseline && !options.previousSchedule
        || options.previousSchedule && !same(binding.planningAudit!.baselineSchedule, options.previousSchedule))) throw new OccurrenceConflictError();
    await options.repository.read(async (tx) => assertAuthorityEpoch(await tx.getDatabaseMetadata(), options.expectedAuthorityEpoch));
    return bridge;
  }
  if (!canRescheduleBinding(binding, bridge) || occurrenceRevision(binding) !== options.expectedRevision
    || (binding.planningAudit?.rescheduleHistory.length ?? 0) !== options.expectedHistoryLength) throw new OccurrenceConflictError();
  const prior = binding.planningAudit ?? (() => {
    if (!options.previousSchedule || options.previousSchedule.kind !== "timed") throw new OccurrenceConflictError("Confirme o planejamento anterior para iniciar o histórico.");
    return { baselineItem: { ...binding.item }, baselineSchedule: value(createTimedSchedule(options.previousSchedule)), confirmedAt: changedAt, rescheduleHistory: [] };
  })();
  const from = prior.rescheduleHistory.at(-1)?.to ?? prior.baselineSchedule;
  const history = value(appendRescheduleEvent(prior, { id, from, to: schedule, changedAt, ...(reason ? { reason } : {}) }));
  const audit = { ...prior, rescheduleHistory: history.rescheduleHistory };
  try {
    return await savePlannerWithBridge({ ...options, state: snapshot.backup.payload.planner, expectedSnapshot: snapshot.backup,
      rescheduling: { occurrenceId: options.occurrenceId, audit } });
  } catch (error) {
    // Independent equivalent writers can lose CAS after the winner commits. Never retry a conflicting append.
    if (!(error instanceof ExecutionBridgeError)) throw error;
    const latest = await readPlannerAuthoritySnapshot({ repository: options.repository, active: true, exportedAt: changedAt, hasher: options.hasher });
    const saved = latest.backup.payload.executionBridge?.bridge;
    const event = saved?.entries.find((entry) => entry.occurrenceId === options.occurrenceId)?.planningAudit?.rescheduleHistory[options.expectedHistoryLength];
    if (latest.authorityEpoch === options.expectedAuthorityEpoch && saved && event && same(event, history.rescheduleHistory.at(-1))) {
      await options.repository.read(async (tx) => assertAuthorityEpoch(await tx.getDatabaseMetadata(), options.expectedAuthorityEpoch));
      return saved;
    }
    throw new OccurrenceConflictError();
  }
}
