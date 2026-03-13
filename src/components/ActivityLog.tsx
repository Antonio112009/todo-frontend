"use client";

import { useActivityLog, type LogEntry } from "@/context/ActivityLogContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function statusColor(entry: LogEntry): string {
  if (entry.status === null) return "text-red-600 dark:text-red-400";
  if (entry.status < 300) return "text-green-600 dark:text-green-400";
  if (entry.status < 400) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function statusBg(entry: LogEntry): string {
  if (entry.status === null) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (entry.status < 300) return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (entry.status < 400) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
}

const methodBadge: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  POST: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url;
  }
}

export default function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold">Activity Log</h2>
        {logs.length > 0 && (
          <Button variant="ghost" size="xs" onClick={clearLogs}>
            Clear
          </Button>
        )}
      </div>

      <Separator />

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            No HTTP activity yet. Use the Todo App or run tests to see requests here.
          </p>
        ) : (
          <div className="flex flex-col">
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={`border-b border-border px-4 py-2.5 text-xs transition-colors ${
                  entry.ok
                    ? "hover:bg-muted/50"
                    : "bg-red-50/40 hover:bg-red-50/60 dark:bg-red-900/10 dark:hover:bg-red-900/20"
                }`}
              >
                {/* Row 1: method, path, status */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${methodBadge[entry.method] || "bg-muted text-muted-foreground"}`}>
                    {entry.method}
                  </span>
                  <span className="flex-1 truncate font-mono text-[11px]">
                    {shortenUrl(entry.url)}
                  </span>
                  {entry.status !== null ? (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono font-bold ${statusColor(entry)}`}>
                      {entry.status}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      ERR
                    </Badge>
                  )}
                </div>

                {/* Row 2: status text, duration, time */}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {entry.status !== null ? (
                    <span className={statusColor(entry)}>
                      {entry.status} {entry.statusText}
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 truncate max-w-[140px]">
                      {entry.error || "Network error"}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2">
                    <span>{entry.durationMs}ms</span>
                    <span>{formatTime(entry.timestamp)}</span>
                  </span>
                </div>

                {/* Error detail */}
                {!entry.ok && entry.error && entry.status !== null && (
                  <div className="mt-1 rounded bg-red-100/60 px-2 py-1 text-[10px] text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {entry.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {logs.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2 px-4 py-2 text-[10px] text-muted-foreground">
            <span>{logs.length} request{logs.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span className="text-green-600 dark:text-green-400">
              {logs.filter((l) => l.ok).length} ok
            </span>
            {logs.some((l) => !l.ok) && (
              <>
                <span>·</span>
                <span className="text-red-600 dark:text-red-400">
                  {logs.filter((l) => !l.ok).length} failed
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
