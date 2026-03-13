"use client";

import { useEffect, useState, useCallback } from "react";
import { Todo } from "@/types/todo";
import { getTodos, createTodo, updateTodo, deleteTodo } from "@/api/todos";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import ApiSpec from "@/components/ApiSpec";
import ApiTester from "@/components/ApiTester";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
        "Could not connect to the backend. Make sure the API server is running."
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight">
        ✅ Todo List
      </h1>

      <Tabs defaultValue="todos">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="todos">Todo App</TabsTrigger>
          <TabsTrigger value="api">API Spec</TabsTrigger>
          <TabsTrigger value="test">Test Backend</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
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
                <p className="py-8 text-center text-muted-foreground">
                  Loading…
                </p>
              ) : (
                <TodoList
                  todos={todos}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <ApiSpec />
        </TabsContent>

        <TabsContent value="test">
          <ApiTester />
        </TabsContent>
      </Tabs>
    </main>
  );
}
