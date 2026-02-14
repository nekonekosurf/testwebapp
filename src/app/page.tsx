"use client";

import dynamic from "next/dynamic";
import { useGeolocation } from "./hooks/useGeolocation";

// Leafletはwindowが必要なのでSSRを無効化
const RentMap = dynamic(() => import("./components/RentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 text-sm">地図を読み込み中...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const { latitude, longitude, accuracy, error, loading, retry } =
    useGeolocation(true);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              周辺家賃チェッカー
            </h1>
            <p className="text-blue-200 text-xs">
              歩きながら周りの家賃がわかる
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                latitude ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-blue-200">
              {latitude ? "GPS" : "取得中"}
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              現在地を取得中...
            </p>
            <p className="text-gray-400 text-sm">
              位置情報の使用を許可してください
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              位置情報を取得できません
            </p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={retry}
              className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              再試行する
            </button>
          </div>
        </div>
      ) : latitude && longitude ? (
        <RentMap
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
        />
      ) : null}
    </div>
  );
}
