"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface LogEntry {
  id: number;
  timestamp: Date;
  method: string;
  url: string;
  status: number | null;
  statusText: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  source: "app" | "test";
}

interface ActivityLogContextType {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | null>(null);

let nextId = 1;

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [
      { ...entry, id: nextId++, timestamp: new Date() },
      ...prev,
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <ActivityLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const ctx = useContext(ActivityLogContext);
  if (!ctx) throw new Error("useActivityLog must be used within ActivityLogProvider");
  return ctx;
}
