import assert from "node:assert/strict";
import test from "node:test";
import {
  FLEXIBILITIES,
  ORIGIN_KINDS,
  TEMPORAL_STATUSES,
  createOriginReference,
  createRoutineTemplate,
  createTemplateTiming,
  createWeeklyRecurrence,
  routineTemplateId,
  sourceEntityId,
} from "../domain/temporal/index.ts";

function value(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error.message);
  return result.value;
}

function template(overrides = {}) {
  return createRoutineTemplate({
    id: value(routineTemplateId("tpl_gym_tuesday")),
    title: "Academia",
    recurrence: value(createWeeklyRecurrence({ weekdays: [2], startsOn: "2026-09-01" })),
    timing: value(createTemplateTiming({ kind: "timed", localTime: "06:30", durationMinutes: 60 })),
    timeZone: "America/Sao_Paulo",
    flexibility: "preferred",
    origin: value(createOriginReference({ kind: "gym", referenceId: value(sourceEntityId("workout_plan_01")) })),
    createdAt: "2026-09-12T12:00:00.000Z",
    ...overrides,
  });
}

test("exports exactly the approved states and flexibility values", () => {
  assert.deepEqual([...TEMPORAL_STATUSES], [
    "planned",
    "completed",
    "completed_rescheduled",
    "not_completed",
    "cancelled",
  ]);
  assert.deepEqual([...FLEXIBILITIES], ["fixed", "preferred", "flexible"]);
  assert.equal(FLEXIBILITIES.includes("opportunistic"), false);
  assert.equal(TEMPORAL_STATUSES.includes("skipped"), false);
  assert.deepEqual([...ORIGIN_KINDS], ["routine", "task", "study", "formation", "gym", "event", "other"]);
});

test("creates a validated weekly routine template", () => {
  const result = template();
  assert.equal(result.ok, true);
  assert.equal(result.value.title, "Academia");
  assert.deepEqual(result.value.recurrence.weekdays, [2]);
  assert.equal(result.value.timing.kind, "timed");
  assert.equal(result.value.flexibility, "preferred");
  assert.equal(result.value.origin.kind, "gym");
  assert.equal(result.value.createdAt, result.value.updatedAt);
});

test("one weekly rule represents daily and weekday recurrence deterministically", () => {
  const daily = value(createWeeklyRecurrence({ weekdays: [7, 1, 4, 3, 2, 6, 5], startsOn: "2026-09-01" }));
  const weekdays = value(createWeeklyRecurrence({ weekdays: [5, 1, 3, 2, 4], startsOn: "2026-09-01" }));
  assert.deepEqual(daily.weekdays, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(weekdays.weekdays, [1, 2, 3, 4, 5]);
});

test("supports timed, date-only, and all-day template intentions", () => {
  assert.equal(createTemplateTiming({ kind: "timed", localTime: "20:00", durationMinutes: 45 }).ok, true);
  assert.deepEqual(value(createTemplateTiming({ kind: "date_only" })), { kind: "date_only" });
  assert.equal(createTemplateTiming({ kind: "date_only", estimatedDurationMinutes: 20 }).ok, true);
  assert.equal(createTemplateTiming({ kind: "all_day", durationDays: 1 }).ok, true);
});

test("rejects invalid recurrence, template, origin, and flexibility", () => {
  assert.equal(createWeeklyRecurrence({ weekdays: [], startsOn: "2026-09-01" }).ok, false);
  assert.equal(createWeeklyRecurrence({ weekdays: [2, 2], startsOn: "2026-09-01" }).ok, false);
  assert.equal(createWeeklyRecurrence({ weekdays: [2], startsOn: "2026-09-02", endsOn: "2026-09-01" }).ok, false);
  assert.equal(createOriginReference({ kind: "other", label: "   " }).ok, false);
  assert.equal(template({ title: "  " }).ok, false);
  assert.equal(template({ flexibility: "opportunistic" }).ok, false);
});
