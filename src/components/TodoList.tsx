"use client";

import { Todo } from "@/types/todo";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No todos yet. Add one above!
      </p>
    );
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        {remaining} item{remaining !== 1 ? "s" : ""} remaining
      </p>
    </div>
  );
}
