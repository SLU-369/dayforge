import { failure, success, type DomainResult } from "./errors.ts";

declare const entityIdBrand: unique symbol;

export type EntityId<Entity extends string> = string & {
  readonly [entityIdBrand]: Entity;
};

export type RoutineTemplateId = EntityId<"routine_template">;
export type ScheduleOccurrenceId = EntityId<"schedule_occurrence">;
export type ExecutionRecordId = EntityId<"execution_record">;
export type RescheduleEventId = EntityId<"reschedule_event">;
export type SourceEntityId = EntityId<"source_entity">;
export type AvailabilityWindowId = EntityId<"availability_window">;
export type UnavailableWindowId = EntityId<"unavailable_window">;
export type ScheduleAnchorId = EntityId<"schedule_anchor">;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function parseEntityId<Entity extends string>(
  value: string,
  field: string,
): DomainResult<EntityId<Entity>> {
  if (!ID_PATTERN.test(value)) {
    return failure(
      "invalid_id",
      "IDs must be opaque, non-empty, and contain only stable identifier characters.",
      field,
    );
  }

  return success(value as EntityId<Entity>);
}

export const routineTemplateId = (value: string) =>
  parseEntityId<"routine_template">(value, "id");

export const scheduleOccurrenceId = (value: string) =>
  parseEntityId<"schedule_occurrence">(value, "id");

export const executionRecordId = (value: string) =>
  parseEntityId<"execution_record">(value, "execution.id");

export const rescheduleEventId = (value: string) =>
  parseEntityId<"reschedule_event">(value, "reschedule.id");

export const sourceEntityId = (value: string) =>
  parseEntityId<"source_entity">(value, "origin.referenceId");

export const availabilityWindowId = (value: string) =>
  parseEntityId<"availability_window">(value, "availability.id");

export const unavailableWindowId = (value: string) =>
  parseEntityId<"unavailable_window">(value, "unavailable.id");

export const scheduleAnchorId = (value: string) =>
  parseEntityId<"schedule_anchor">(value, "anchor.id");
