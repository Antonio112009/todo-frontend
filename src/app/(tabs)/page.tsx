"use client";

import { useEffect, useState, useCallback } from "react";
import { Todo } from "@/types/todo";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { useLoggedFetch } from "@/hooks/useLoggedFetch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loggedFetch = useLoggedFetch("app");

  const fetchTodos = useCallback(async () => {
    try {
      setError(null);
      const res = await loggedFetch(`${API_BASE_URL}/todos`);
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
    } catch {
      setError(
        "Could not connect to the backend. Make sure the API server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [loggedFetch]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function handleAdd(title: string) {
    try {
      const res = await loggedFetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      const newTodo = await res.json();
      setTodos((prev) => [...prev, newTodo]);
    } catch {
      setError("Failed to add todo. Check backend connection.");
    }
  }

  async function handleToggle(id: number, completed: boolean) {
    try {
      const res = await loggedFetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to update todo. Check backend connection.");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await loggedFetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo. Check backend connection.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <TodoForm onAdd={handleAdd} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="link" size="sm" onClick={fetchTodos}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading…</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </CardContent>
    </Card>
  );
}
