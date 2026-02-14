"use client";

import { useRef, useState, useCallback } from "react";
import { Building } from "../lib/rentEstimator";
import {
  PhotoEstimate,
  analyzeImage,
  scoreBuildingMatch,
  getAgeCategoryLabel,
  getBuildingTypeFromEstimate,
} from "../lib/imageAnalysis";

interface PhotoSearchProps {
  buildings: Building[];
  onResults: (matchedIds: Set<string>) => void;
  onClear: () => void;
}

export default function PhotoSearch({
  buildings,
  onResults,
  onClear,
}: PhotoSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PhotoEstimate | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processImage = useCallback(
    (file: File) => {
      setAnalyzing(true);
      const url = URL.createObjectURL(file);
      setImageUrl(url);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 分析用に縮小（パフォーマンス向上）
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const result = analyzeImage(imageData);
        setEstimate(result);
        setAnalyzing(false);

        // スコアリングして上位をマッチとする
        const scored = buildings.map((b) => ({
          id: b.id,
          score: scoreBuildingMatch(b, result),
        }));
        scored.sort((a, b) => b.score - a.score);

        // スコア60以上 or 上位5件
        const threshold = 60;
        const topMatches = scored.filter(
          (s, i) => s.score >= threshold || i < 5
        );
        onResults(new Set(topMatches.map((m) => m.id)));
      };
      img.src = url;
    },
    [buildings, onResults]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleClear = useCallback(() => {
    setImageUrl(null);
    setEstimate(null);
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
  }, [onClear]);

  // 推定値をユーザーが修正した場合
  const handleTypeChange = useCallback(
    (type: Building["type"]) => {
      if (!estimate) return;
      const updated = { ...estimate, buildingType: type };
      setEstimate(updated);
      // 再スコアリング
      const scored = buildings.map((b) => ({
        id: b.id,
        score: scoreBuildingMatch(b, updated),
      }));
      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.filter((s, i) => s.score >= 60 || i < 5);
      onResults(new Set(topMatches.map((m) => m.id)));
    },
    [estimate, buildings, onResults]
  );

  const handleAgeChange = useCallback(
    (age: "new" | "medium" | "old") => {
      if (!estimate) return;
      const updated = { ...estimate, ageCategory: age };
      setEstimate(updated);
      const scored = buildings.map((b) => ({
        id: b.id,
        score: scoreBuildingMatch(b, updated),
      }));
      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.filter((s, i) => s.score >= 60 || i < 5);
      onResults(new Set(topMatches.map((m) => m.id)));
    },
    [estimate, buildings, onResults]
  );

  if (!isOpen && !imageUrl) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all bg-purple-100 text-purple-700 hover:bg-purple-200"
      >
        写真で検索
      </button>
    );
  }

  if (isOpen && !imageUrl) {
    return (
      <div className="bg-white border rounded-xl shadow-lg p-4 absolute top-14 left-3 right-3 z-30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-800">写真で物件検索</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          建物の写真を撮影またはアルバムから選択すると、似た物件を地図上でハイライトします
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
              }
            }}
            className="flex-1 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            撮影
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            アルバム
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // 結果表示
  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 absolute top-14 left-3 right-3 z-30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-gray-800">写真分析結果</h3>
        <button
          onClick={handleClear}
          className="text-xs text-blue-600 font-medium"
        >
          クリア
        </button>
      </div>

      <div className="flex gap-3">
        {/* サムネイル */}
        {imageUrl && (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="撮影した建物"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 分析結果 */}
        <div className="flex-1 min-w-0">
          {analyzing ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">分析中...</span>
            </div>
          ) : estimate ? (
            <div className="space-y-1.5">
              {/* 建物タイプ */}
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">推定タイプ</p>
                <div className="flex gap-1">
                  {(["apartment", "mansion", "tower"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTypeChange(t)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        estimate.buildingType === t
                          ? t === "tower"
                            ? "bg-purple-600 text-white"
                            : t === "mansion"
                            ? "bg-blue-600 text-white"
                            : "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {getBuildingTypeFromEstimate(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 築年数 */}
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">推定築年数</p>
                <div className="flex gap-1">
                  {(["new", "medium", "old"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => handleAgeChange(a)}
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                        estimate.ageCategory === a
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {getAgeCategoryLabel(a)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-gray-400">
                ※タップで修正できます。類似物件をハイライト中
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
