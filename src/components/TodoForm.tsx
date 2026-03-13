"use client";

import { useState } from "react";

interface TodoFormProps {
  onAdd: (title: string) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base
                   focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                   dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-800"
      />
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white
                   hover:bg-blue-700 active:bg-blue-800 transition-colors
                   disabled:opacity-50"
        disabled={!title.trim()}
      >
        Add
      </button>
    </form>
  );
}
