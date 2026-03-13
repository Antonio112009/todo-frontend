"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type TestStatus = "idle" | "running" | "pass" | "fail";

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
}

const initialTests: TestResult[] = [
  { name: "GET /todos", status: "idle", detail: "" },
  { name: "POST /todos", status: "idle", detail: "" },
  { name: "PUT /todos/:id", status: "idle", detail: "" },
  { name: "DELETE /todos/:id", status: "idle", detail: "" },
  { name: "Verify deletion", status: "idle", detail: "" },
];

export default function ApiTester() {
  const [tests, setTests] = useState<TestResult[]>(initialTests);
  const [running, setRunning] = useState(false);

  function update(index: number, patch: Partial<TestResult>) {
    setTests((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  async function runAllTests() {
    setRunning(true);
    setTests(initialTests.map((t) => ({ ...t, status: "running", detail: "" })));

    let createdId: number | null = null;

    // 1) GET /todos — should return an array
    try {
      const res = await fetch(`${API_BASE_URL}/todos`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Expected JSON array");
      update(0, { status: "pass", detail: `Returned ${data.length} todo(s)` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(0, { status: "fail", detail: msg });
      setRunning(false);
      return;
    }

    // 2) POST /todos — create a test todo
    try {
      const res = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "__test_todo__" }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.id) throw new Error("Response missing 'id' field");
      if (data.title !== "__test_todo__") throw new Error(`Expected title "__test_todo__", got "${data.title}"`);
      if (data.completed !== false) throw new Error(`Expected completed=false, got ${data.completed}`);
      createdId = data.id;
      update(1, { status: "pass", detail: `Created todo id=${data.id}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(1, { status: "fail", detail: msg });
      setRunning(false);
      return;
    }

    // 3) PUT /todos/:id — update the test todo
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "__test_updated__", completed: true }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.title !== "__test_updated__") throw new Error(`Expected title "__test_updated__", got "${data.title}"`);
      if (data.completed !== true) throw new Error(`Expected completed=true, got ${data.completed}`);
      update(2, { status: "pass", detail: `Updated todo id=${createdId}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(2, { status: "fail", detail: msg });
      setRunning(false);
      return;
    }

    // 4) DELETE /todos/:id — delete the test todo
    try {
      const res = await fetch(`${API_BASE_URL}/todos/${createdId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      update(3, { status: "pass", detail: `Deleted todo id=${createdId}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(3, { status: "fail", detail: msg });
      setRunning(false);
      return;
    }

    // 5) Verify deletion — GET /todos should no longer contain the test todo
    try {
      const res = await fetch(`${API_BASE_URL}/todos`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const found = data.find((t: { id: number }) => t.id === createdId);
      if (found) throw new Error(`Todo id=${createdId} still exists after deletion`);
      update(4, { status: "pass", detail: "Confirmed todo was deleted" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      update(4, { status: "fail", detail: msg });
    }

    setRunning(false);
  }

  const statusIcon: Record<TestStatus, string> = {
    idle: "⚪",
    running: "🔄",
    pass: "✅",
    fail: "❌",
  };

  const allPassed = tests.every((t) => t.status === "pass");

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🧪 Backend Test
        </h2>
        <button
          onClick={runAllTests}
          disabled={running}
          className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white
                     hover:bg-purple-700 active:bg-purple-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? "Running…" : "Run Tests"}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Creates a test todo, updates it, deletes it, and verifies each step.
        Testing against: <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">{API_BASE_URL}</code>
      </p>

      <div className="flex flex-col gap-2">
        {tests.map((test, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm
              ${test.status === "pass"
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : test.status === "fail"
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              }`}
          >
            <span className="mt-0.5 text-base">{statusIcon[test.status]}</span>
            <div className="flex-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {test.name}
              </span>
              {test.detail && (
                <p className={`mt-0.5 text-xs ${
                  test.status === "fail"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {test.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {allPassed && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-100 p-3 text-center text-sm font-semibold text-green-800
                        dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">
          🎉 All tests passed! Your backend is working correctly.
        </div>
      )}
    </div>
  );
}
