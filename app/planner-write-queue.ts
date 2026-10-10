import type { ExecutionRecord } from "../domain/temporal/index.ts";
import { canonicalStringify } from "../persistence/migration/canonical-json.ts";

/** One application queue; revision invalidates React snapshots captured before a canonical write. */
export class PlannerWriteQueue {
  current: Promise<void> = Promise.resolve();
  revision = 0;
  private completions = new Map<string, { key: string; promise: Promise<void> }>();

  get completingIds() { return [...this.completions.keys()]; }

  enqueue<T>(work: () => Promise<T>): Promise<T> {
    const next = this.current.then(work);
    this.current = next.then(() => undefined, () => undefined);
    return next;
  }

  autosave(revision: number, work: () => Promise<void>): Promise<void> {
    return this.enqueue(async () => { if (revision === this.revision) await work(); });
  }

  complete(id: string, record: ExecutionRecord, work: () => Promise<void>): Promise<void> {
    return this.command(id, { kind: "completion", record }, work);
  }

  command(id: string, intent: unknown, work: () => Promise<void>): Promise<void> {
    const key = canonicalStringify(JSON.parse(JSON.stringify(intent)));
    const existing = this.completions.get(id);
    if (existing) return existing.key === key ? existing.promise : Promise.reject(new Error("Há outra operação em andamento para esta ocorrência."));
    const promise = this.enqueue(work);
    this.completions.set(id, { key, promise });
    const release = () => { this.completions.delete(id); };
    void promise.then(release, release);
    return promise;
  }
}
