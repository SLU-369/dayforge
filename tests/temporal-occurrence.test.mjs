import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelOccurrence,
  completeOccurrence,
  createAllDayExecutionTiming,
  createDateOnlyExecutionTiming,
  createExecutionRecord,
  createOccurrence,
  createOriginReference,
  createRoutineTemplate,
  createTemplateTiming,
  createTemporalReason,
  createTimedExecutionTiming,
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

function schedule(hour, durationMinutes = 60) {
  return value(createTimedSchedule({
    startsAt: `2026-09-15T${hour}:00.000Z`,
    timeZone: "America/Sao_Paulo",
    durationMinutes,
  }));
}

function template() {
  return value(createRoutineTemplate({
    id: value(routineTemplateId("tpl_gym_tuesday")),
    title: "Academia",
    recurrence: value(createWeeklyRecurrence({ weekdays: [2], startsOn: "2026-09-01" })),
    timing: value(createTemplateTiming({ kind: "timed", localTime: "06:30", durationMinutes: 60 })),
    timeZone: "America/Sao_Paulo",
    flexibility: "preferred",
    origin: value(createOriginReference({ kind: "gym", label: "Treino semanal" })),
    createdAt: "2026-09-12T12:00:00.000Z",
  }));
}

function occurrence() {
  return value(createOccurrence({
    id: value(scheduleOccurrenceId("occ_2026_09_15_gym")),
    source: { kind: "template", template: template() },
    schedule: schedule("09:30"),
    createdAt: "2026-09-12T12:05:00.000Z",
  }));
}

function execution(recordedAt = "2026-09-15T11:00:00.000Z") {
  return value(createExecutionRecord({
    id: value(executionRecordId("exec_2026_09_15_gym")),
    timing: value(createTimedExecutionTiming({
      start: "2026-09-15T09:35:00.000Z",
      end: "2026-09-15T10:40:00.000Z",
      timeZone: "America/Sao_Paulo",
    })),
    recordedAt,
  }));
}

test("creates a planned occurrence as a snapshot independent from its template", () => {
  const sourceTemplate = template();
  const created = value(createOccurrence({
    id: value(scheduleOccurrenceId("occ_snapshot")),
    source: { kind: "template", template: sourceTemplate },
    schedule: schedule("09:30"),
    createdAt: "2026-09-12T12:05:00.000Z",
  }));

  sourceTemplate.title = "Título alterado externamente";
  sourceTemplate.origin.label = "Origem alterada externamente";

  assert.equal(created.status, "planned");
  assert.equal(created.title, "Academia");
  assert.equal(created.origin.label, "Treino semanal");
  assert.equal(created.execution, null);
  assert.deepEqual(created.rescheduleHistory, []);
});

test("completes normally without allowing the consumer to choose the completed status", () => {
  const completed = value(completeOccurrence(occurrence(), execution()));
  assert.equal(completed.status, "completed");
  assert.equal(completed.execution.id, "exec_2026_09_15_gym");
  assert.deepEqual(completed.rescheduleHistory, []);
});

test("derives completed_rescheduled and preserves a complete reschedule chain", () => {
  const original = occurrence();
  const first = value(rescheduleOccurrence(original, {
    id: value(rescheduleEventId("move_01")),
    schedule: schedule("12:00"),
    changedAt: "2026-09-14T10:00:00.000Z",
    reason: value(createTemporalReason({ code: "work_commitment" })),
  }));
  const second = value(rescheduleOccurrence(first, {
    id: value(rescheduleEventId("move_02")),
    schedule: schedule("23:00"),
    changedAt: "2026-09-15T08:00:00.000Z",
  }));
  const completed = value(completeOccurrence(second, execution("2026-09-16T01:00:00.000Z")));

  assert.equal(completed.status, "completed_rescheduled");
  assert.deepEqual(completed.originalSchedule, original.originalSchedule);
  assert.deepEqual(completed.currentSchedule, schedule("23:00"));
  assert.equal(completed.rescheduleHistory.length, 2);
  assert.deepEqual(completed.rescheduleHistory[0].from, original.originalSchedule);
  assert.deepEqual(completed.rescheduleHistory[0].to, schedule("12:00"));
  assert.deepEqual(completed.rescheduleHistory[1].from, schedule("12:00"));
  assert.deepEqual(completed.rescheduleHistory[1].to, schedule("23:00"));

  assert.deepEqual(original.rescheduleHistory, []);
  assert.equal(original.currentSchedule.startsAt, "2026-09-15T09:30:00.000Z");
  assert.equal(first.rescheduleHistory.length, 1);
  assert.equal(first.currentSchedule.startsAt, "2026-09-15T12:00:00.000Z");
});

test("marks an occurrence not completed and preserves its reason", () => {
  const reason = value(createTemporalReason({ code: "unexpected_event", note: "Consulta médica" }));
  const resolved = value(markOccurrenceNotCompleted(occurrence(), {
    resolvedAt: "2026-09-16T01:00:00.000Z",
    reason,
  }));
  assert.equal(resolved.status, "not_completed");
  assert.equal(resolved.execution, null);
  assert.deepEqual(resolved.resolution.reason, reason);
});

test("cancels an occurrence without inventing an execution", () => {
  const resolved = value(cancelOccurrence(occurrence(), {
    resolvedAt: "2026-09-14T08:00:00.000Z",
  }));
  assert.equal(resolved.status, "cancelled");
  assert.equal(resolved.execution, null);
  assert.equal(resolved.resolution.kind, "cancelled");
});

test("all terminal states reject every further temporal transition", () => {
  const completed = value(completeOccurrence(occurrence(), execution()));
  const notCompleted = value(markOccurrenceNotCompleted(occurrence(), { resolvedAt: "2026-09-16T01:00:00.000Z" }));
  const cancelled = value(cancelOccurrence(occurrence(), { resolvedAt: "2026-09-14T08:00:00.000Z" }));
  const rescheduled = value(rescheduleOccurrence(occurrence(), {
    id: value(rescheduleEventId("move_terminal")),
    schedule: schedule("12:00"),
    changedAt: "2026-09-14T10:00:00.000Z",
  }));
  const completedRescheduled = value(completeOccurrence(rescheduled, execution()));

  for (const terminal of [completed, completedRescheduled, notCompleted, cancelled]) {
    assert.equal(rescheduleOccurrence(terminal, {
      id: value(rescheduleEventId(`move_${terminal.status}`)),
      schedule: schedule("13:00"),
      changedAt: "2026-09-16T02:00:00.000Z",
    }).error.code, "invalid_transition");
    assert.equal(completeOccurrence(terminal, execution("2026-09-16T02:00:00.000Z")).error.code, "invalid_transition");
    assert.equal(markOccurrenceNotCompleted(terminal, { resolvedAt: "2026-09-16T02:00:00.000Z" }).error.code, "invalid_transition");
    assert.equal(cancelOccurrence(terminal, { resolvedAt: "2026-09-16T02:00:00.000Z" }).error.code, "invalid_transition");
  }
});

test("rejects no-op reschedules and commands older than existing history", () => {
  const current = occurrence();
  assert.equal(rescheduleOccurrence(current, {
    id: value(rescheduleEventId("move_same")),
    schedule: current.currentSchedule,
    changedAt: "2026-09-14T10:00:00.000Z",
  }).error.code, "invalid_reschedule");

  assert.equal(cancelOccurrence(current, {
    resolvedAt: "2026-09-01T08:00:00.000Z",
  }).error.code, "invalid_transition");
});

test("supports exact, date-only, and all-day execution facts", () => {
  assert.equal(createTimedExecutionTiming({
    start: "2026-09-15T10:00:00.000Z",
    end: "2026-09-15T09:00:00.000Z",
    timeZone: "America/Sao_Paulo",
  }).ok, false);
  assert.equal(createDateOnlyExecutionTiming({
    date: "2026-09-15",
    timeZone: "America/Sao_Paulo",
    durationMinutes: 45,
  }).value.kind, "date_only");
  assert.equal(createAllDayExecutionTiming({
    startsOn: "2026-09-15",
    endsBefore: "2026-09-16",
    timeZone: "America/Sao_Paulo",
  }).value.kind, "all_day");
});
