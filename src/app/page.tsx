import TodoList from "./components/TodoList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-zinc-100 mb-8">
          Todoリスト
        </h1>
        <TodoList />
      </div>
    </div>
  );
}
