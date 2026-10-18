import {
  getJob,
  type AsyncJob,
} from "@/lib/api/capex-api";

const STORAGE_KEY = "capex-active-job";

/** Start fast, then back off so imports/exports don't hammer the proxy. */
const POLL_INITIAL_MS = 800;
const POLL_MAX_MS = 2500;
const POLL_GROWTH = 1.5;

export type TrackedJob = {
  id: string;
  type: string;
  label: string;
  status: string;
  progress: number;
  error: string | null;
  result: unknown;
};

type Listener = (job: TrackedJob | null) => void;

let current: TrackedJob | null = null;
let pollTimer: number | null = null;
let pollDelayMs = POLL_INITIAL_MS;
const listeners = new Set<Listener>();

function readStored(): TrackedJob | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrackedJob;
  } catch {
    return null;
  }
}

function writeStored(job: TrackedJob | null) {
  if (typeof window === "undefined") return;
  try {
    if (!job || job.status === "succeeded" || job.status === "failed") {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    }
  } catch {
    // ignore quota
  }
}

function emit() {
  for (const listener of listeners) listener(current);
}

function setCurrent(job: TrackedJob | null) {
  current = job;
  writeStored(job);
  emit();
}

function clearPollTimer() {
  if (pollTimer != null) {
    window.clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function stopPolling() {
  clearPollTimer();
  pollDelayMs = POLL_INITIAL_MS;
}

function scheduleNextPoll() {
  if (typeof window === "undefined" || !current) return;
  clearPollTimer();
  const delay = pollDelayMs;
  pollDelayMs = Math.min(
    POLL_MAX_MS,
    Math.round(pollDelayMs * POLL_GROWTH),
  );
  pollTimer = window.setTimeout(() => {
    pollTimer = null;
    void tick();
  }, delay);
}

async function tick() {
  if (!current) {
    stopPolling();
    return;
  }
  try {
    const remote = await getJob(current.id);
    const next: TrackedJob = {
      ...current,
      status: remote.status,
      progress: remote.progress,
      error: remote.error,
      result: remote.result,
      type: remote.type,
    };
    setCurrent(next);
    if (remote.status === "succeeded" || remote.status === "failed") {
      stopPolling();
      // Keep failed/succeeded briefly for UI, then clear.
      window.setTimeout(() => {
        if (current?.id === next.id) setCurrent(null);
      }, 4000);
      return;
    }
  } catch {
    // transient network — keep polling
  }
  scheduleNextPoll();
}

function startPolling() {
  if (pollTimer != null || typeof window === "undefined") return;
  pollDelayMs = POLL_INITIAL_MS;
  void tick();
}

export function subscribeJob(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function getTrackedJob() {
  return current;
}

export function labelForJobType(type: string) {
  if (type === "import_template") return "Importing Capex_1…";
  if (type === "export_portfolio") return "Preparing export…";
  return "Background job…";
}

/** Begin tracking an enqueued job (persists across refresh). */
export function trackJob(job: AsyncJob, label?: string) {
  setCurrent({
    id: job.id,
    type: job.type,
    label: label || labelForJobType(job.type),
    status: job.status,
    progress: job.progress,
    error: job.error,
    result: job.result,
  });
  startPolling();
}

/** Wait until tracked job finishes (or timeout). */
export function waitForTrackedJob(
  id: string,
  timeoutMs = 120_000,
): Promise<TrackedJob> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const unsub = subscribeJob((job) => {
      if (!job || job.id !== id) return;
      if (job.status === "succeeded") {
        unsub();
        resolve(job);
      } else if (job.status === "failed") {
        unsub();
        reject(new Error(job.error || "Job failed"));
      } else if (Date.now() - started > timeoutMs) {
        unsub();
        reject(new Error("Job timed out"));
      }
    });
  });
}

/** Resume a job left in sessionStorage after page reload. */
export function resumeTrackedJobFromStorage() {
  const stored = readStored();
  if (!stored) return;
  if (stored.status === "succeeded" || stored.status === "failed") {
    writeStored(null);
    return;
  }
  current = stored;
  emit();
  startPolling();
}

export function clearTrackedJob() {
  stopPolling();
  setCurrent(null);
}
