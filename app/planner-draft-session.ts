import type { PlannerState } from "./planner-data.ts";
import type { ExecutionBridge } from "../persistence/execution/bridge.ts";
import { canonicalStringify } from "../persistence/migration/canonical-json.ts";

export type PlannerSnapshot = Readonly<{ state: PlannerState; executionBridge: ExecutionBridge | null; authorityEpoch: number; datasetRevision: number }>;
const sameState = (left: PlannerState, right: PlannerState) => canonicalStringify(JSON.parse(JSON.stringify(left))) === canonicalStringify(JSON.parse(JSON.stringify(right)));

/** Local drafts and open forms must survive authority invalidation. No automatic merge. */
export class PlannerDraftSession {
  persisted: PlannerSnapshot;
  state: PlannerState;
  remote: PlannerSnapshot | null = null;
  dirty = false;
  openEditors = 0;
  paused = false;
  constructor(initial: PlannerSnapshot) { this.persisted = initial; this.state = initial.state; }
  get fence() { return { expectedAuthorityEpoch: this.persisted.authorityEpoch, expectedDatasetRevision: this.persisted.datasetRevision }; }
  beginEditing() { this.openEditors++; }
  endEditing() { this.openEditors = Math.max(0, this.openEditors - 1); }
  conflict(snapshot: PlannerSnapshot) { this.remote = snapshot; this.paused = true; }
  pause() { this.paused = true; }
  retry() { this.paused = false; }
  load(snapshot: PlannerSnapshot) {
    this.persisted = snapshot; this.state = snapshot.state; this.remote = null; this.dirty = false; this.paused = false;
  }
  edit(action: PlannerState | ((state: PlannerState) => PlannerState)) {
    this.state = typeof action === "function" ? action(this.state) : action;
    this.dirty = !sameState(this.state, this.persisted.state);
  }
  /** Acknowledging one event must not discard an unrelated draft/open editor. */
  confirmedEvent(snapshot: PlannerSnapshot) {
    if (this.dirty || this.openEditors > 1) { this.observe(snapshot); return; }
    const observed = this.remote ?? this.persisted;
    if (observed.authorityEpoch > snapshot.authorityEpoch
      || observed.authorityEpoch === snapshot.authorityEpoch && observed.datasetRevision > snapshot.datasetRevision) return;
    this.load(snapshot);
  }
  observe(snapshot: PlannerSnapshot) {
    if (snapshot.authorityEpoch === this.persisted.authorityEpoch && snapshot.datasetRevision === this.persisted.datasetRevision) return;
    if (this.dirty || this.openEditors || this.remote) { this.remote = snapshot; this.paused = true; }
    else this.load(snapshot);
  }
  saved(draft: PlannerState, fence: { expectedAuthorityEpoch: number; expectedDatasetRevision: number }, snapshot: PlannerSnapshot) {
    if (snapshot.authorityEpoch !== fence.expectedAuthorityEpoch || snapshot.datasetRevision > fence.expectedDatasetRevision + 1 || !sameState(snapshot.state, draft)) {
      this.remote = snapshot; this.paused = true; return false;
    }
    this.persisted = snapshot;
    this.dirty = !sameState(this.state, draft);
    if (!this.dirty) this.state = snapshot.state;
    return true;
  }
}
