"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TestStatus = "idle" | "running" | "pass" | "fail";

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
  request: { method: string; url: string; body?: string } | null;
  response: { status: number | null; body: string } | null;
}

// ── Random test data ───────────────────────────────────────────────

const RANDOM_TITLES = [
  "Buy groceries 🛒",
  "Walk the dog 🐕",
  "Read a book 📖",
  "Clean the house 🏠",
  "Call the dentist 🦷",
  "Fix the bike 🚲",
  "Write a report 📝",
  "Cook dinner 🍳",
  "Water the plants 🌱",
  "Learn TypeScript 💻",
  "Go for a run 🏃",
  "Send the email ✉️",
  "Organize desk 🗂️",
  "Pay the bills 💳",
  "Take out trash 🗑️",
];

const RANDOM_UPDATES = [
  "Buy organic groceries 🥦",
  "Walk in the park 🌳",
  "Finish the novel 📚",
  "Deep clean kitchen 🧹",
  "Schedule check-up 🏥",
  "Tune up the bike 🔧",
  "Submit final report 📊",
  "Meal prep for the week 🥗",
  "Repot the cactus 🌵",
  "Build a side project 🚀",
  "Run 5K 🏅",
  "Follow up on email 📨",
  "Reorganize bookshelf 📕",
  "Set up auto-pay 🏦",
  "Recycling day ♻️",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Test definitions ───────────────────────────────────────────────

const TEST_NAMES = [
  "GET /todos — check initial list",
  "POST /todos — create todo",
  "GET /todos — verify created",
  "PUT /todos/:id — update todo",
  "GET /todos — verify updated",
  "DELETE /todos/:id — remove todo",
  "GET /todos — verify deleted",
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Refs for cross-test data (avoids stale closures)
  const createdIdRef = useRef<number | null>(null);
  const titleRef = useRef("");
  const updatedTitleRef = useRef("");
  const initialCountRef = useRef(0);

  function update(index: number, patch: Partial<TestResult>) {
    setTests((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  function resetAll() {
    setTests(makeInitial());
    createdIdRef.current = null;
    setExpandedIndex(null);
  }

  function toggleExpand(i: number) {
    setExpandedIndex((prev) => (prev === i ? null : i));
  }

  // ── Individual test runners ──────────────────────────────────────

  /** Step 1: GET /todos — record initial count */
  async function runStep0(): Promise<boolean> {
    const url = `${baseUrl}/todos`;
    update(0, { status: "running", detail: "", request: { method: "GET", url }, response: null });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(0, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      initialCountRef.current = data.length;
      update(0, { status: "pass", detail: `List has ${data.length} todo(s)` });
      return true;
    } catch (e: unknown) {
      update(0, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /** Step 2: POST /todos — create with random title */
  async function runStep1(): Promise<{ ok: boolean; id: number | null }> {
    const title = pickRandom(RANDOM_TITLES);
    titleRef.current = title;
    const url = `${baseUrl}/todos`;
    const reqBody = JSON.stringify({ title });
    update(1, { status: "running", detail: "", request: { method: "POST", url, body: reqBody }, response: null });
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
      if (data.title !== title)
        throw new Error(`Expected title "${title}", got "${data.title}"`);
      if (data.completed !== false)
        throw new Error(`Expected completed=false, got ${data.completed}`);
      createdIdRef.current = data.id;
      update(1, { status: "pass", detail: `Created id=${data.id} "${title}"` });
      return { ok: true, id: data.id };
    } catch (e: unknown) {
      update(1, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return { ok: false, id: null };
    }
  }

  /** Step 3: GET /todos — verify the new todo exists */
  async function runStep2(id: number | null): Promise<boolean> {
    if (id == null) { update(2, { status: "fail", detail: "No id — run POST first", request: null, response: null }); return false; }
    const url = `${baseUrl}/todos`;
    update(2, { status: "running", detail: "", request: { method: "GET", url }, response: null });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(2, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      const found = data.find((t: { id: number }) => t.id === id);
      if (!found) throw new Error(`Todo id=${id} not found in list`);
      if (found.title !== titleRef.current)
        throw new Error(`Expected title "${titleRef.current}", got "${found.title}"`);
      if (data.length !== initialCountRef.current + 1)
        throw new Error(`Expected ${initialCountRef.current + 1} todos, got ${data.length}`);
      update(2, { status: "pass", detail: `Todo id=${id} found, count=${data.length}` });
      return true;
    } catch (e: unknown) {
      update(2, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /** Step 4: PUT /todos/:id — update with random title + completed=true */
  async function runStep3(id: number | null): Promise<boolean> {
    if (id == null) { update(3, { status: "fail", detail: "No id — run POST first", request: null, response: null }); return false; }
    const newTitle = pickRandom(RANDOM_UPDATES);
    updatedTitleRef.current = newTitle;
    const url = `${baseUrl}/todos/${id}`;
    const reqBody = JSON.stringify({ title: newTitle, completed: true });
    update(3, { status: "running", detail: "", request: { method: "PUT", url, body: reqBody }, response: null });
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: reqBody,
      });
      const text = await res.text();
      update(3, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (data.title !== newTitle)
        throw new Error(`Expected title "${newTitle}", got "${data.title}"`);
      if (data.completed !== true)
        throw new Error(`Expected completed=true, got ${data.completed}`);
      update(3, { status: "pass", detail: `Updated id=${id} → "${newTitle}"` });
      return true;
    } catch (e: unknown) {
      update(3, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /** Step 5: GET /todos — verify the update persisted */
  async function runStep4(id: number | null): Promise<boolean> {
    if (id == null) { update(4, { status: "fail", detail: "No id — run POST first", request: null, response: null }); return false; }
    const url = `${baseUrl}/todos`;
    update(4, { status: "running", detail: "", request: { method: "GET", url }, response: null });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(4, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      const found = data.find((t: { id: number }) => t.id === id);
      if (!found) throw new Error(`Todo id=${id} not found after update`);
      if (found.title !== updatedTitleRef.current)
        throw new Error(`Expected title "${updatedTitleRef.current}", got "${found.title}"`);
      if (found.completed !== true)
        throw new Error(`Expected completed=true, got ${found.completed}`);
      update(4, { status: "pass", detail: `Verified update: "${updatedTitleRef.current}", completed=true` });
      return true;
    } catch (e: unknown) {
      update(4, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /** Step 6: DELETE /todos/:id */
  async function runStep5(id: number | null): Promise<boolean> {
    if (id == null) { update(5, { status: "fail", detail: "No id — run POST first", request: null, response: null }); return false; }
    const url = `${baseUrl}/todos/${id}`;
    update(5, { status: "running", detail: "", request: { method: "DELETE", url }, response: null });
    try {
      const res = await fetch(url, { method: "DELETE" });
      const text = await res.text();
      update(5, { response: { status: res.status, body: text || "(empty)" } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      update(5, { status: "pass", detail: `Deleted id=${id}` });
      return true;
    } catch (e: unknown) {
      update(5, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /** Step 7: GET /todos — verify todo is gone & count restored */
  async function runStep6(id: number | null): Promise<boolean> {
    if (id == null) { update(6, { status: "fail", detail: "No id — run POST & DELETE first", request: null, response: null }); return false; }
    const url = `${baseUrl}/todos`;
    update(6, { status: "running", detail: "", request: { method: "GET", url }, response: null });
    try {
      const res = await fetch(url);
      const text = await res.text();
      update(6, { response: { status: res.status, body: text } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      const found = data.find((t: { id: number }) => t.id === id);
      if (found) throw new Error(`Todo id=${id} still exists after deletion`);
      if (data.length !== initialCountRef.current)
        throw new Error(`Expected ${initialCountRef.current} todos, got ${data.length}`);
      update(6, { status: "pass", detail: `Deleted todo gone, count back to ${data.length}` });
      return true;
    } catch (e: unknown) {
      update(6, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  // ── Run single test ──────────────────────────────────────────────

  async function runSingle(index: number) {
    setRunningIndex(index);
    setExpandedIndex(index);
    const id = createdIdRef.current;
    if (index === 0) await runStep0();
    else if (index === 1) await runStep1();
    else if (index === 2) await runStep2(id);
    else if (index === 3) await runStep3(id);
    else if (index === 4) await runStep4(id);
    else if (index === 5) await runStep5(id);
    else if (index === 6) await runStep6(id);
    setRunningIndex(null);
  }

  // ── Run all tests sequentially ───────────────────────────────────

  async function runAllTests() {
    setRunningAll(true);
    resetAll();
    await new Promise((r) => setTimeout(r, 50));

    if (!(await runStep0())) { setRunningAll(false); return; }
    const post = await runStep1();
    if (!post.ok) { setRunningAll(false); return; }
    const id = post.id;
    if (!(await runStep2(id))) { setRunningAll(false); return; }
    if (!(await runStep3(id))) { setRunningAll(false); return; }
    if (!(await runStep4(id))) { setRunningAll(false); return; }
    if (!(await runStep5(id))) { setRunningAll(false); return; }
    await runStep6(id);
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
              Runs 7 sequential tests with random data to verify your API.
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
            const label = test.name.replace(/^(GET|POST|PUT|DELETE)\s+\S+\s*—?\s*/, "");
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
                    <span className="font-medium truncate">{label}</span>
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
