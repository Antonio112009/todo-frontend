"use client";

import { useCallback } from "react";
import { useActivityLog } from "@/context/ActivityLogContext";

export function useLoggedFetch(source: "app" | "test" = "app") {
  const { addLog } = useActivityLog();

  const loggedFetch = useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const method = init?.method?.toUpperCase() || "GET";
      const url = input;
      const start = performance.now();

      try {
        const res = await fetch(input, init);
        const durationMs = Math.round(performance.now() - start);

        addLog({
          method,
          url,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          durationMs,
          error: res.ok ? undefined : `${res.status} ${res.statusText}`,
          source,
        });

        return res;
      } catch (e: unknown) {
        const durationMs = Math.round(performance.now() - start);
        const errorMsg = e instanceof Error ? e.message : String(e);

        addLog({
          method,
          url,
          status: null,
          statusText: "",
          ok: false,
          durationMs,
          error: errorMsg,
          source,
        });

        throw e;
      }
    },
    [addLog, source]
  );

  return loggedFetch;
}
