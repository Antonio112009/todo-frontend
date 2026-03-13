"use client";

import { Todo } from "@/types/todo";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-all hover:shadow-sm">
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id, !todo.completed)}
        className="cursor-pointer"
      />
      <span
        className={`flex-1 text-sm transition-all ${
          todo.completed
            ? "text-muted-foreground line-through"
            : "text-foreground"
        }`}
      >
        {todo.title}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
        className="text-destructive hover:text-destructive"
      >
        ✕
      </Button>
    </li>
  );
}
