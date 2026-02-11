import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todoアプリ",
  description: "Next.jsで作ったシンプルなTodoアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
