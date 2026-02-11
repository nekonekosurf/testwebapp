"use client";

import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: trimmed, completed: false },
    ]);
    setInput("");
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTodo();
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* 入力エリア */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="タスクを入力..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-400"
        />
        <button
          onClick={addTodo}
          disabled={!input.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white
                     hover:bg-blue-700 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          追加
        </button>
      </div>

      {/* タスクリスト */}
      {todos.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-zinc-500 py-8">
          タスクがありません
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3
                         dark:border-zinc-700 group"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600
                           focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <span
                className={`flex-1 text-sm ${
                  todo.completed
                    ? "line-through text-gray-400 dark:text-zinc-500"
                    : "text-gray-800 dark:text-zinc-200"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-400 hover:text-red-500 transition-colors
                           opacity-0 group-hover:opacity-100 text-lg leading-none"
                aria-label="削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* フッター情報 */}
      {todos.length > 0 && (
        <p className="mt-4 text-xs text-gray-400 dark:text-zinc-500 text-center">
          全 {todos.length} 件 ／ 完了 {todos.filter((t) => t.completed).length} 件
        </p>
      )}
    </div>
  );
}
