import { parseIanaTimeZone, parseLocalDate, parseLocalTime } from '../domain/temporal/index.ts';

/** Strict UI conversion of explicitly confirmed wall times; never infer an instant from legacy projection. */
export function confirmedInstant(local: string, timeZone: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(local);
  if (!match || !parseLocalDate(match[1]).ok || !parseLocalTime(match[2]).ok) {
    throw new Error("Informe data e horário completos válidos.");
  }
  const zone = parseIanaTimeZone(timeZone);
  if (!zone.ok) throw new Error("Informe um fuso IANA válido.");
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-iso8601-nu-latn", {
    timeZone: zone.value, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  function wall(epoch: number) {
    const parts = Object.fromEntries(formatter.formatToParts(epoch).map((part) => [part.type, part.value]));
    return `${parts.year.padStart(4, "0")}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`;
  }
  const target = `${local}:00.000Z`;
  const naive = Date.parse(target);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    const sample = naive + hours * 3_600_000;
    offsets.add(Date.parse(wall(sample)) - sample);
  }
  const candidates = [...offsets].map((offset) => naive - offset).filter((epoch) => wall(epoch) === target);
  if (candidates.length !== 1) throw new Error("Horário inexistente ou ambíguo no fuso informado. Informe horários inequívocos.");
  return new Date(candidates[0]).toISOString();
}
