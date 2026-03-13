"use client";

import { useEffect, useState, useCallback } from "react";
import { Todo } from "@/types/todo";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/api/todos";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
        ✅ Todo List
      </h1>

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
    </main>
  );
}
