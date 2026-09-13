import assert from "node:assert/strict";
import test from "node:test";
import {
  createAbsoluteInterval,
  createAllDaySchedule,
  createDateOnlySchedule,
  createTimedSchedule,
  intervalForTimedSchedule,
  parseIanaTimeZone,
  parseLocalDate,
  parseLocalTime,
  parsePositiveMinutes,
  parseUtcInstant,
  routineTemplateId,
} from "../domain/temporal/index.ts";

function value(result) {
  assert.equal(result.ok, true, result.ok ? undefined : result.error.message);
  return result.value;
}

test("validates nominal IDs without generating identity", () => {
  assert.equal(value(routineTemplateId("tpl_01HRQ7W4K2")).toString(), "tpl_01HRQ7W4K2");
  for (const invalid of ["", " leading", "has space", "invalid/"]) {
    assert.equal(routineTemplateId(invalid).ok, false);
  }
});

test("validates canonical calendar dates including leap years", () => {
  assert.equal(value(parseLocalDate("2028-02-29")), "2028-02-29");
  for (const invalid of ["2026-2-01", "2026-02-29", "2026-04-31", "0000-01-01"]) {
    assert.equal(parseLocalDate(invalid).ok, false);
  }
});

test("validates local times, UTC instants, time zones, and positive minutes", () => {
  assert.equal(value(parseLocalTime("23:59")), "23:59");
  assert.equal(parseLocalTime("24:00").ok, false);
  assert.equal(parseLocalTime("9:30").ok, false);

  assert.equal(value(parseUtcInstant("2026-09-15T09:30:00.000Z")), "2026-09-15T09:30:00.000Z");
  assert.equal(parseUtcInstant("2026-09-15T09:30:00Z").ok, false);
  assert.equal(parseUtcInstant("2026-02-29T09:30:00.000Z").ok, false);

  assert.equal(value(parseIanaTimeZone("America/Sao_Paulo")), "America/Sao_Paulo");
  assert.equal(parseIanaTimeZone("Local browser zone").ok, false);

  assert.equal(value(parsePositiveMinutes(30)), 30);
  for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(parsePositiveMinutes(invalid).ok, false);
  }
});

test("keeps timed, date-only, and all-day schedules distinct", () => {
  const timed = value(createTimedSchedule({
    startsAt: "2026-09-15T09:30:00.000Z",
    timeZone: "America/Sao_Paulo",
    durationMinutes: 60,
  }));
  const dateOnly = value(createDateOnlySchedule({
    date: "2026-09-15",
    timeZone: "America/Sao_Paulo",
  }));
  const allDay = value(createAllDaySchedule({
    startsOn: "2026-09-15",
    endsBefore: "2026-09-16",
    timeZone: "America/Sao_Paulo",
  }));

  assert.equal(timed.kind, "timed");
  assert.equal(dateOnly.kind, "date_only");
  assert.equal(allDay.kind, "all_day");
  assert.deepEqual(value(intervalForTimedSchedule(timed)), {
    start: "2026-09-15T09:30:00.000Z",
    end: "2026-09-15T10:30:00.000Z",
  });

  assert.equal(createAllDaySchedule({
    startsOn: "2026-09-15",
    endsBefore: "2026-09-15",
    timeZone: "America/Sao_Paulo",
  }).ok, false);

  assert.equal(createTimedSchedule({
    startsAt: "9999-12-31T23:59:59.999Z",
    timeZone: "America/Sao_Paulo",
    durationMinutes: Number.MAX_SAFE_INTEGER,
  }).ok, false);
});

test("absolute intervals require a strict semi-open range", () => {
  assert.equal(createAbsoluteInterval({
    start: "2026-09-15T09:30:00.000Z",
    end: "2026-09-15T10:30:00.000Z",
  }).ok, true);
  assert.equal(createAbsoluteInterval({
    start: "2026-09-15T09:30:00.000Z",
    end: "2026-09-15T09:30:00.000Z",
  }).ok, false);
});
