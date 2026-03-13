"use client";

import { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white
                    px-4 py-3 shadow-sm transition-all hover:shadow-md
                    dark:border-gray-700 dark:bg-gray-800">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600
                   focus:ring-2 focus:ring-blue-500 cursor-pointer accent-blue-600"
      />
      <span
        className={`flex-1 text-base transition-all ${
          todo.completed
            ? "text-gray-400 line-through dark:text-gray-500"
            : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50
                   hover:text-red-700 transition-colors dark:hover:bg-red-900/30"
        aria-label={`Delete "${todo.title}"`}
      >
        ✕
      </button>
    </li>
  );
}
