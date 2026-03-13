"use client";

import { useEffect, useState, useCallback } from "react";
import { Todo } from "@/types/todo";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/api/todos";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import ApiSpec from "@/components/ApiSpec";
import ApiTester from "@/components/ApiTester";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"todos" | "api" | "test">("todos");

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const data = await getTodos();
      setTodos(data);
    } catch {
      setError(
        "Could not connect to the backend. Make sure the API server is running on the configured URL."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function handleAdd(title: string) {
    try {
      const newTodo = await createTodo({ title });
      setTodos((prev) => [...prev, newTodo]);
    } catch {
      setError("Failed to add todo. Check backend connection.");
    }
  }

  async function handleToggle(id: number, completed: boolean) {
    try {
      const updated = await updateTodo(id, { completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to update todo. Check backend connection.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo. Check backend connection.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
        ✅ Todo List
      </h1>

      {/* Tab navigation */}
      <div className="mb-6 flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {([
          { key: "todos" as const, label: "Todo App" },
          { key: "api" as const, label: "API Spec" },
          { key: "test" as const, label: "Test Backend" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Todo App tab */}
      {activeTab === "todos" && (
        <>
          <div className="mb-6">
            <TodoForm onAdd={handleAdd} />
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700
                            dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              {error}
              <button
                onClick={fetchTodos}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-gray-400">Loading…</p>
          ) : (
            <TodoList
              todos={todos}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* API Spec tab */}
      {activeTab === "api" && <ApiSpec />}

      {/* Test Backend tab */}
      {activeTab === "test" && <ApiTester />}
    </main>
  );
}
