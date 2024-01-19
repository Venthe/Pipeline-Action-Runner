/**
 * success()
 * always()
 * cancelled()
 * failure()
 *
 * js code
 * context?
 */
export type Expression = string;

export type InputOutput = string | number | boolean | undefined;

export type JobStatus = "queued" | "in_progress" | "waiting" | "completed" | "neutral" | "success" | "failure" | "cancelled" | "action_required" | "timed_out" | "skipped" | "stale";
