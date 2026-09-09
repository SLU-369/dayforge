export type SkyVisitor = { kind: "hippogriff" | "thestral" | "student" | "birds"; id: number; top: number };

type Clock = { random: () => number; now: () => number; later: typeof setTimeout; cancel: typeof clearTimeout };

export function startSkyVisits(visit: (visitor: SkyVisitor | null) => void, clock: Clock = { random: Math.random, now: Date.now, later: setTimeout, cancel: clearTimeout }) {
  let timer: ReturnType<typeof setTimeout>;
  let disposed = false;
  let previous = -1;
  const kinds = ["birds", "hippogriff", "student", "thestral"] as const;
  function schedule(first = false) {
    timer = clock.later(() => {
      if (disposed) return;
      let index = Math.floor(clock.random() * kinds.length);
      if (index === previous) index = (index + 1) % kinds.length;
      previous = index;
      visit({ kind: kinds[index], id: clock.now(), top: 12 + clock.random() * 16 });
      timer = clock.later(() => {
        if (disposed) return;
        visit(null);
        schedule();
      }, 24000);
    }, first ? 12000 + clock.random() * 12000 : 55000 + clock.random() * 75000);
  }
  schedule(true);
  return () => { disposed = true; clock.cancel(timer); };
}
