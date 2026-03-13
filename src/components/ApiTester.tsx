"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TestStatus = "idle" | "running" | "pass" | "fail" | "skipped";

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
  request: { method: string; url: string; body?: string } | null;
  response: { status: number | null; body: string } | null;
}

const TEST_NAMES = [
  "GET /todos",
  "POST /todos",
  "PUT /todos/:id",
  "DELETE /todos/:id",
  "Verify deletion",
];

function makeInitial(): TestResult[] {
  return TEST_NAMES.map((name) => ({
    name,
    status: "idle" as TestStatus,
    detail: "",
    request: null,
    response: null,
  }));
}

export default function ApiTester() {
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  );
  const [tests, setTests] = useState<TestResult[]>(makeInitial());
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<TestResult>) {
    setTests((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  function resetAll() {
    setTests(makeInitial());
    setLastCreatedId(null);
    setExpandedIndex(null);
  }

  function toggleExpand(i: number) {
    setExpandedIndex((prev) => (prev === i ? null : i));
  }

  // ── Individual test runners ──────────────────────────────────────

  async function runGetTodos(): Promise<boolean> {
    const url = `${baseUrl}/todos`;
    update(0, { status: "running", detail: "", request: { method: "GET", url }, response: null });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(0, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      update(0, { status: "pass", detail: `Returned ${data.length} todo(s)` });
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(0, { status: "fail", detail: msg });
      return false;
    }
  }

  async function runPostTodo(): Promise<{ ok: boolean; id: number | null }> {
    const url = `${baseUrl}/todos`;
    const reqBody = JSON.stringify({ title: "__test_todo__" });
    update(1, {
      status: "running", detail: "",
      request: { method: "POST", url, body: reqBody },
      response: null,
    });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reqBody,
      });
      const text = await res.text();
      update(1, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (!data.id) throw new Error("Response missing 'id' field");
      if (data.title !== "__test_todo__")
        throw new Error(`Expected title "__test_todo__", got "${data.title}"`);
      if (data.completed !== false)
        throw new Error(`Expected completed=false, got ${data.completed}`);
      setLastCreatedId(data.id);
      update(1, { status: "pass", detail: `Created todo id=${data.id}` });
      return { ok: true, id: data.id };
    } catch (e: unknown) {
      update(1, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return { ok: false, id: null };
    }
  }

  async function runPutTodo(id: number | null): Promise<boolean> {
    if (id == null) {
      update(2, { status: "fail", detail: "No todo id — run POST first", request: null, response: null });
      return false;
    }
    const url = `${baseUrl}/todos/${id}`;
    const reqBody = JSON.stringify({ title: "__test_updated__", completed: true });
    update(2, {
      status: "running", detail: "",
      request: { method: "PUT", url, body: reqBody },
      response: null,
    });
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: reqBody,
      });
      const text = await res.text();
      update(2, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (data.title !== "__test_updated__")
        throw new Error(`Expected title "__test_updated__", got "${data.title}"`);
      if (data.completed !== true)
        throw new Error(`Expected completed=true, got ${data.completed}`);
      update(2, { status: "pass", detail: `Updated todo id=${id}` });
      return true;
    } catch (e: unknown) {
      update(2, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function runDeleteTodo(id: number | null): Promise<boolean> {
    if (id == null) {
      update(3, { status: "fail", detail: "No todo id — run POST first", request: null, response: null });
      return false;
    }
    const url = `${baseUrl}/todos/${id}`;
    update(3, {
      status: "running", detail: "",
      request: { method: "DELETE", url },
      response: null,
    });
    try {
      const res = await fetch(url, { method: "DELETE" });
      const text = await res.text();
      update(3, { response: { status: res.status, body: text || "(empty)" } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      update(3, { status: "pass", detail: `Deleted todo id=${id}` });
      return true;
    } catch (e: unknown) {
      update(3, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function runVerifyDeletion(id: number | null): Promise<boolean> {
    if (id == null) {
      update(4, { status: "fail", detail: "No todo id — run POST & DELETE first", request: null, response: null });
      return false;
    }
    const url = `${baseUrl}/todos`;
    update(4, {
      status: "running", detail: "",
      request: { method: "GET", url },
      response: null,
    });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(4, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      const found = data.find((t: { id: number }) => t.id === id);
      if (found) throw new Error(`Todo id=${id} still exists after deletion`);
      update(4, { status: "pass", detail: "Confirmed todo was deleted" });
      return true;
    } catch (e: unknown) {
      update(4, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  // ── Run single test ──────────────────────────────────────────────

  async function runSingle(index: number) {
    setRunningIndex(index);
    setExpandedIndex(index);
    if (index === 0) await runGetTodos();
    else if (index === 1) await runPostTodo();
    else if (index === 2) await runPutTodo(lastCreatedId);
    else if (index === 3) await runDeleteTodo(lastCreatedId);
    else if (index === 4) await runVerifyDeletion(lastCreatedId);
    setRunningIndex(null);
  }

  // ── Run all tests sequentially ───────────────────────────────────

  async function runAllTests() {
    setRunningAll(true);
    resetAll();
    await new Promise((r) => setTimeout(r, 50));

    // 1. GET
    if (!(await runGetTodos())) { setRunningAll(false); return; }

    // 2. POST
    const postResult = await runPostTodo();
    if (!postResult.ok) { setRunningAll(false); return; }
    const createdId = postResult.id;

    // 3. PUT
    if (!(await runPutTodo(createdId))) { setRunningAll(false); return; }

    // 4. DELETE
    if (!(await runDeleteTodo(createdId))) { setRunningAll(false); return; }

    // 5. Verify
    await runVerifyDeletion(createdId);

    setRunningAll(false);
  }

  const busy = runningAll || runningIndex !== null;

  const allPassed = tests.every((t) => t.status === "pass");
  const ranCount = tests.filter((t) => t.status !== "idle").length;
  const passCount = tests.filter((t) => t.status === "pass").length;
  const failCount = tests.filter((t) => t.status === "fail").length;

  function formatJson(raw: string): string {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  const methodColor: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    POST: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Backend Test Suite</CardTitle>
            <CardDescription className="mt-1">
              Runs 5 sequential tests to verify your API works correctly.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetAll} disabled={busy}>
              Reset
            </Button>
            <Button size="sm" onClick={runAllTests} disabled={busy}>
              {runningAll ? "Running…" : "▶ Run All"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Base URL */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Base URL</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:4000"
            className="h-8 font-mono text-xs"
            disabled={busy}
          />
        </div>

        {/* Progress bar */}
        {ranCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{passCount + failCount} / {tests.length} completed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  failCount > 0 ? "bg-destructive" : "bg-green-500"
                }`}
                style={{ width: `${((passCount + failCount) / tests.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Test list */}
        <div className="flex flex-col gap-1.5">
          {tests.map((test, i) => {
            const method = test.request?.method || test.name.split(" ")[0];
            return (
              <div key={i}>
                <div
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer
                    ${test.status === "pass"
                      ? "border-green-200 bg-green-50/60 dark:border-green-800/60 dark:bg-green-900/20"
                      : test.status === "fail"
                      ? "border-red-200 bg-red-50/60 dark:border-red-800/60 dark:bg-red-900/20"
                      : test.status === "running"
                      ? "border-blue-200 bg-blue-50/40 dark:border-blue-800/40 dark:bg-blue-900/10"
                      : "border-border bg-card hover:bg-muted/50"
                    }
                    ${expandedIndex === i ? "rounded-b-none border-b-transparent" : ""}`}
                  onClick={() => toggleExpand(i)}
                >
                  {/* Step number */}
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                    ${test.status === "pass"
                      ? "bg-green-500 text-white"
                      : test.status === "fail"
                      ? "bg-red-500 text-white"
                      : test.status === "running"
                      ? "bg-blue-500 text-white animate-pulse"
                      : "bg-muted text-muted-foreground"
                    }`}>
                    {test.status === "pass" ? "✓" : test.status === "fail" ? "✗" : i + 1}
                  </span>

                  {/* Method badge + name */}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${methodColor[method] || "bg-muted text-muted-foreground"}`}>
                      {method}
                    </span>
                    <span className="font-medium truncate">{test.name.replace(/^(GET|POST|PUT|DELETE)\s*/, "")}</span>
                  </div>

                  {/* Detail text */}
                  {test.detail && (
                    <span className={`hidden sm:inline text-xs truncate max-w-[180px] ${
                      test.status === "fail" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {test.detail}
                    </span>
                  )}

                  <span className="text-[10px] text-muted-foreground">
                    {expandedIndex === i ? "▲" : "▼"}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={(e) => { e.stopPropagation(); runSingle(i); }}
                    disabled={busy}
                  >
                    Run
                  </Button>
                </div>

                {/* Expanded panel */}
                {expandedIndex === i && (
                  <div className="rounded-b-lg border border-t-0 border-border bg-muted/30 dark:bg-muted/10 px-4 py-3 space-y-3">
                    {test.status === "idle" ? (
                      <p className="text-xs text-muted-foreground italic">
                        Click &quot;Run&quot; to see request and response details.
                      </p>
                    ) : (
                      <>
                        {/* Request */}
                        {test.request && (
                          <div>
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                REQUEST
                              </span>
                              <code className="text-xs font-mono text-muted-foreground">
                                {test.request.method} {test.request.url}
                              </code>
                            </div>
                            {test.request.body ? (
                              <pre className="rounded-md bg-background border border-border p-3 text-xs font-mono overflow-x-auto leading-relaxed">
                                {formatJson(test.request.body)}
                              </pre>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No request body</p>
                            )}
                          </div>
                        )}

                        {/* Response */}
                        {test.response && (
                          <div>
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold
                                ${test.response.status && test.response.status < 400
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                }`}>
                                RESPONSE
                              </span>
                              <code className="text-xs font-mono text-muted-foreground">
                                Status {test.response.status}
                              </code>
                            </div>
                            <pre className="rounded-md bg-background border border-border p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto leading-relaxed">
                              {formatJson(test.response.body)}
                            </pre>
                          </div>
                        )}

                        {test.status === "running" && (
                          <p className="text-xs text-muted-foreground animate-pulse">Waiting for response…</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {allPassed && (
          <Alert>
            <AlertDescription className="text-center font-semibold">
              🎉 All tests passed! Your backend is working correctly.
            </AlertDescription>
          </Alert>
        )}

        {ranCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Results:</span>
            <Badge variant="default">{passCount} passed</Badge>
            {failCount > 0 && (
              <Badge variant="destructive">{failCount} failed</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
