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
}

const TEST_NAMES = [
  "GET /todos",
  "POST /todos",
  "PUT /todos/:id",
  "DELETE /todos/:id",
  "Verify deletion",
];

function makeInitial(): TestResult[] {
  return TEST_NAMES.map((name) => ({ name, status: "idle" as TestStatus, detail: "" }));
}

export default function ApiTester() {
  const [baseUrl, setBaseUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  );
  const [tests, setTests] = useState<TestResult[]>(makeInitial());
  const [runningIndex, setRunningIndex] = useState<number | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  // Track the id created by POST so PUT/DELETE/Verify can use it
  const [lastCreatedId, setLastCreatedId] = useState<number | null>(null);

  function update(index: number, patch: Partial<TestResult>) {
    setTests((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  function resetAll() {
    setTests(makeInitial());
    setLastCreatedId(null);
  }

  // ── Individual test runners ──────────────────────────────────────

  async function runGetTodos(): Promise<boolean> {
    update(0, { status: "running", detail: "" });
    try {
      const res = await fetch(`${baseUrl}/todos`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      update(0, { status: "pass", detail: `Returned ${data.length} todo(s)` });
      return true;
    } catch (e: unknown) {
      update(0, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function runPostTodo(): Promise<boolean> {
    update(1, { status: "running", detail: "" });
    try {
      const res = await fetch(`${baseUrl}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "__test_todo__" }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.id) throw new Error("Response missing 'id' field");
      if (data.title !== "__test_todo__")
        throw new Error(`Expected title "__test_todo__", got "${data.title}"`);
      if (data.completed !== false)
        throw new Error(`Expected completed=false, got ${data.completed}`);
      setLastCreatedId(data.id);
      update(1, { status: "pass", detail: `Created todo id=${data.id}` });
      return true;
    } catch (e: unknown) {
      update(1, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function runPutTodo(id: number | null): Promise<boolean> {
    if (id == null) {
      update(2, { status: "fail", detail: "No todo id — run POST first" });
      return false;
    }
    update(2, { status: "running", detail: "" });
    try {
      const res = await fetch(`${baseUrl}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "__test_updated__", completed: true }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
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
      update(3, { status: "fail", detail: "No todo id — run POST first" });
      return false;
    }
    update(3, { status: "running", detail: "" });
    try {
      const res = await fetch(`${baseUrl}/todos/${id}`, { method: "DELETE" });
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
      update(4, { status: "fail", detail: "No todo id — run POST & DELETE first" });
      return false;
    }
    update(4, { status: "running", detail: "" });
    try {
      const res = await fetch(`${baseUrl}/todos`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
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
    const runners = [
      () => runGetTodos(),
      () => runPostTodo(),
      () => runPutTodo(lastCreatedId),
      () => runDeleteTodo(lastCreatedId),
      () => runVerifyDeletion(lastCreatedId),
    ];
    await runners[index]();
    setRunningIndex(null);
  }

  // ── Run all tests sequentially ───────────────────────────────────

  async function runAllTests() {
    setRunningAll(true);
    resetAll();

    // Small delay so state resets visually
    await new Promise((r) => setTimeout(r, 50));

    let createdId: number | null = null;

    // 1. GET
    if (!(await runGetTodos())) { setRunningAll(false); return; }

    // 2. POST
    {
      update(1, { status: "running", detail: "" });
      try {
        const res = await fetch(`${baseUrl}/todos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "__test_todo__" }),
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.id) throw new Error("Response missing 'id' field");
        if (data.title !== "__test_todo__")
          throw new Error(`Expected title "__test_todo__", got "${data.title}"`);
        if (data.completed !== false)
          throw new Error(`Expected completed=false, got ${data.completed}`);
        createdId = data.id;
        setLastCreatedId(data.id);
        update(1, { status: "pass", detail: `Created todo id=${data.id}` });
      } catch (e: unknown) {
        update(1, { status: "fail", detail: e instanceof Error ? e.message : String(e) });
        setRunningAll(false);
        return;
      }
    }

    // 3. PUT
    if (!(await runPutTodo(createdId))) { setRunningAll(false); return; }

    // 4. DELETE
    if (!(await runDeleteTodo(createdId))) { setRunningAll(false); return; }

    // 5. Verify
    await runVerifyDeletion(createdId);

    setRunningAll(false);
  }

  const busy = runningAll || runningIndex !== null;

  const statusIcon: Record<TestStatus, string> = {
    idle: "⚪",
    running: "🔄",
    pass: "✅",
    fail: "❌",
    skipped: "⏭️",
  };

  const allPassed = tests.every((t) => t.status === "pass");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🧪 Backend Test</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetAll} disabled={busy}>
              Reset
            </Button>
            <Button size="sm" onClick={runAllTests} disabled={busy}>
              {runningAll ? "Running…" : "Run All Tests"}
            </Button>
          </div>
        </div>
        <CardDescription>
          Creates a test todo, updates it, deletes it, and verifies each step.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configurable base URL */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Base URL:</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:4000"
            className="h-8 font-mono text-xs"
            disabled={busy}
          />
        </div>

        <Separator />

        {/* Test rows */}
        <div className="flex flex-col gap-2">
          {tests.map((test, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors
                ${test.status === "pass"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : test.status === "fail"
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  : "border-border bg-card"
                }`}
            >
              <span className="text-base">{statusIcon[test.status]}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{test.name}</span>
                {test.detail && (
                  <p className={`mt-0.5 text-xs truncate ${
                    test.status === "fail" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {test.detail}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => runSingle(i)}
                disabled={busy}
              >
                Run
              </Button>
            </div>
          ))}
        </div>

        {allPassed && (
          <Alert>
            <AlertDescription className="text-center font-semibold">
              🎉 All tests passed! Your backend is working correctly.
            </AlertDescription>
          </Alert>
        )}

        {tests.some((t) => t.status !== "idle") && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Results:</span>
            <Badge variant="default">{tests.filter((t) => t.status === "pass").length} passed</Badge>
            {tests.some((t) => t.status === "fail") && (
              <Badge variant="destructive">{tests.filter((t) => t.status === "fail").length} failed</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
