import assert from "node:assert/strict";
import test from "node:test";
import {
  absoluteIntervalsOverlap,
  allDayRangesOverlap,
  availabilityWindowId,
  createAbsoluteInterval,
  createAbsoluteWindow,
  createAllDaySchedule,
  createAvailabilityWindow,
  createOccupiedInterval,
  createOriginReference,
  createRecurringWindow,
  createScheduleAnchor,
  createUnavailableWindow,
  createWeeklyRecurrence,
  routineTemplateId,
  scheduleAnchorId,
  scheduleOccurrenceId,
  unavailableWindowId,
} from "../domain/temporal/index.ts";

function value(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error.message);
  return result.value;
}

function interval(startHour, endHour) {
  return value(createAbsoluteInterval({
    start: `2026-09-15T${startHour}:00.000Z`,
    end: `2026-09-15T${endHour}:00.000Z`,
  }));
}

const origin = () => value(createOriginReference({ kind: "routine", label: "Rotina" }));

test("uses semi-open overlap semantics for absolute intervals", () => {
  const morning = interval("09:00", "10:00");
  assert.equal(absoluteIntervalsOverlap(morning, interval("09:30", "10:30")), true);
  assert.equal(absoluteIntervalsOverlap(morning, interval("09:15", "09:45")), true);
  assert.equal(absoluteIntervalsOverlap(morning, interval("10:00", "11:00")), false);
  assert.equal(absoluteIntervalsOverlap(morning, interval("08:00", "09:00")), false);
});

test("uses semi-open overlap semantics for all-day civil ranges", () => {
  const first = value(createAllDaySchedule({
    startsOn: "2026-09-15",
    endsBefore: "2026-09-16",
    timeZone: "America/Sao_Paulo",
  }));
  const adjacent = value(createAllDaySchedule({
    startsOn: "2026-09-16",
    endsBefore: "2026-09-17",
    timeZone: "America/Sao_Paulo",
  }));
  const overlapping = value(createAllDaySchedule({
    startsOn: "2026-09-15",
    endsBefore: "2026-09-17",
    timeZone: "America/Sao_Paulo",
  }));
  assert.equal(allDayRangesOverlap(first, adjacent), false);
  assert.equal(allDayRangesOverlap(first, overlapping), true);
});

test("represents available, unavailable, occupied, and anchor contracts separately", () => {
  const absolute = createAbsoluteWindow(interval("09:00", "10:00"));
  const available = createAvailabilityWindow({
    id: value(availabilityWindowId("availability_01")),
    window: absolute,
    origin: origin(),
  });
  const unavailable = createUnavailableWindow({
    id: value(unavailableWindowId("unavailable_01")),
    window: absolute,
    origin: origin(),
  });
  const occupied = createOccupiedInterval({
    occurrenceId: value(scheduleOccurrenceId("occ_01")),
    interval: interval("09:00", "10:00"),
  });
  const anchor = createScheduleAnchor({
    id: value(scheduleAnchorId("anchor_01")),
    window: absolute,
    origin: origin(),
    templateId: value(routineTemplateId("tpl_work")),
  });

  assert.equal(available.kind, "available");
  assert.equal(unavailable.kind, "unavailable");
  assert.equal(occupied.kind, "occupied");
  assert.equal(anchor.kind, "anchor");
});

test("represents opportunity as a recurring availability window, not flexibility", () => {
  const recurring = value(createRecurringWindow({
    recurrence: value(createWeeklyRecurrence({ weekdays: [1, 2, 3, 4, 5], startsOn: "2026-09-01" })),
    localTime: "12:30",
    durationMinutes: 45,
    timeZone: "America/Sao_Paulo",
  }));
  const window = createAvailabilityWindow({
    id: value(availabilityWindowId("availability_opportunity")),
    window: recurring,
    origin: value(createOriginReference({ kind: "other", label: "Janela no trabalho" })),
  });

  assert.equal(window.window.kind, "recurring");
  assert.deepEqual(window.window.recurrence.weekdays, [1, 2, 3, 4, 5]);
  assert.equal(window.window.localTime, "12:30");
});
