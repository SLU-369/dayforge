import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelOccurrence,
  completeOccurrence,
  createDateOnlyExecutionTiming,
  createDateOnlySchedule,
  createExecutionRecord,
  createOccurrence,
  createOriginReference,
  createRoutineTemplate,
  createTemplateTiming,
  createTimedSchedule,
  createWeeklyRecurrence,
  executionRecordId,
  markOccurrenceNotCompleted,
  rescheduleEventId,
  rescheduleOccurrence,
  routineTemplateId,
  scheduleOccurrenceId,
} from "../domain/temporal/index.ts";

function value(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error.message);
  return result.value;
}

function timed(startsAt) {
  return value(createTimedSchedule({ startsAt, timeZone: "America/Sao_Paulo", durationMinutes: 60 }));
}

function occurrence() {
  return value(createOccurrence({
    id: value(scheduleOccurrenceId("occ_edge")),
    source: {
      kind: "standalone",
      title: "Estudo de Go",
      flexibility: "flexible",
      origin: value(createOriginReference({ kind: "study", label: "Sessão avulsa" })),
    },
    schedule: timed("2026-09-15T22:00:00.000Z"),
    createdAt: "2026-09-12T12:00:00.000Z",
  }));
}

function dateOnlyExecution(recordedAt) {
  return value(createExecutionRecord({
    id: value(executionRecordId(`exec_${recordedAt.slice(8, 10)}`)),
    timing: value(createDateOnlyExecutionTiming({
      date: "2026-09-15",
      timeZone: "America/Sao_Paulo",
      durationMinutes: 50,
    })),
    recordedAt,
  }));
}

test("standalone occurrence validates runtime flexibility and origin", () => {
  const base = {
    id: value(scheduleOccurrenceId("occ_invalid_runtime")),
    schedule: value(createDateOnlySchedule({ date: "2026-09-15", timeZone: "America/Sao_Paulo" })),
    createdAt: "2026-09-12T12:00:00.000Z",
  };
  assert.equal(createOccurrence({
    ...base,
    source: { kind: "standalone", title: "Leitura", flexibility: "opportunistic", origin: { kind: "study" } },
  }).error.code, "invalid_occurrence");
  assert.equal(createOccurrence({
    ...base,
    source: { kind: "standalone", title: "Leitura", flexibility: "flexible", origin: { kind: "unknown" } },
  }).error.code, "invalid_occurrence");
});

test("occurrence and reschedule snapshots do not retain mutable command references", () => {
  const initialSchedule = timed("2026-09-15T22:00:00.000Z");
  const created = value(createOccurrence({
    id: value(scheduleOccurrenceId("occ_alias")),
    source: {
      kind: "standalone",
      title: "Leitura",
      flexibility: "flexible",
      origin: value(createOriginReference({ kind: "study" })),
    },
    schedule: initialSchedule,
    createdAt: "2026-09-12T12:00:00.000Z",
  }));
  const nextSchedule = timed("2026-09-16T00:00:00.000Z");
  const moved = value(rescheduleOccurrence(created, {
    id: value(rescheduleEventId("move_alias")),
    schedule: nextSchedule,
    changedAt: "2026-09-14T12:00:00.000Z",
  }));

  initialSchedule.startsAt = "2026-01-01T00:00:00.000Z";
  nextSchedule.startsAt = "2026-01-02T00:00:00.000Z";

  assert.equal(created.originalSchedule.startsAt, "2026-09-15T22:00:00.000Z");
  assert.equal(moved.originalSchedule.startsAt, "2026-09-15T22:00:00.000Z");
  assert.equal(moved.currentSchedule.startsAt, "2026-09-16T00:00:00.000Z");
  assert.equal(moved.rescheduleHistory[0].to.startsAt, "2026-09-16T00:00:00.000Z");
});

test("later states own copies of the complete earlier history", () => {
  const first = value(rescheduleOccurrence(occurrence(), {
    id: value(rescheduleEventId("move_history_01")),
    schedule: timed("2026-09-16T00:00:00.000Z"),
    changedAt: "2026-09-14T12:00:00.000Z",
  }));
  const second = value(rescheduleOccurrence(first, {
    id: value(rescheduleEventId("move_history_02")),
    schedule: timed("2026-09-16T01:00:00.000Z"),
    changedAt: "2026-09-14T13:00:00.000Z",
  }));

  first.rescheduleHistory[0].to.startsAt = "2026-01-01T00:00:00.000Z";
  assert.equal(second.rescheduleHistory[0].to.startsAt, "2026-09-16T00:00:00.000Z");
});

test("completion state remains derived for date-only execution", () => {
  const normal = value(completeOccurrence(occurrence(), dateOnlyExecution("2026-09-16T02:00:00.000Z")));
  const moved = value(rescheduleOccurrence(occurrence(), {
    id: value(rescheduleEventId("move_date_only")),
    schedule: timed("2026-09-16T00:00:00.000Z"),
    changedAt: "2026-09-14T12:00:00.000Z",
  }));
  const rescheduled = value(completeOccurrence(moved, dateOnlyExecution("2026-09-16T02:00:00.000Z")));
  assert.equal(normal.status, "completed");
  assert.equal(rescheduled.status, "completed_rescheduled");
});

test("terminal transitions return errors without mutating their inputs", () => {
  const planned = occurrence();
  const cancelled = value(cancelOccurrence(planned, { resolvedAt: "2026-09-14T12:00:00.000Z" }));
  const before = structuredClone(cancelled);

  assert.equal(markOccurrenceNotCompleted(cancelled, { resolvedAt: "2026-09-15T12:00:00.000Z" }).ok, false);
  assert.deepEqual(cancelled, before);
  assert.equal(planned.status, "planned");
});

test("template snapshots remain independent for all nested template values", () => {
  const recurrence = value(createWeeklyRecurrence({ weekdays: [2], startsOn: "2026-09-01" }));
  const source = value(createRoutineTemplate({
    id: value(routineTemplateId("tpl_nested_snapshot")),
    title: "Academia",
    recurrence,
    timing: value(createTemplateTiming({ kind: "timed", localTime: "06:30", durationMinutes: 60 })),
    timeZone: "America/Sao_Paulo",
    flexibility: "preferred",
    origin: value(createOriginReference({ kind: "gym", label: "Plano original" })),
    createdAt: "2026-09-12T12:00:00.000Z",
  }));
  const created = value(createOccurrence({
    id: value(scheduleOccurrenceId("occ_nested_snapshot")),
    source: { kind: "template", template: source },
    schedule: timed("2026-09-15T09:30:00.000Z"),
    createdAt: "2026-09-12T12:05:00.000Z",
  }));

  source.origin.label = "Plano alterado";
  source.recurrence.weekdays[0] = 5;
  assert.equal(created.origin.label, "Plano original");
  assert.equal(created.templateId, "tpl_nested_snapshot");
});
