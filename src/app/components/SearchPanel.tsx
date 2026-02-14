"use client";

import { useState } from "react";
import { SearchCondition } from "../lib/rentEstimator";

interface SearchPanelProps {
  condition: SearchCondition;
  onChange: (cond: SearchCondition) => void;
  matchCount: number;
  totalCount: number;
}

export default function SearchPanel({
  condition,
  onChange,
  matchCount,
  totalCount,
}: SearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFiltering =
    condition.minArea !== null ||
    condition.maxTotalCost !== null ||
    condition.separateBathToilet ||
    condition.goodSunlight;

  return (
    <div className="flex-shrink-0 z-20">
      {/* 検索トグルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
          isFiltering
            ? "bg-orange-50 text-orange-700 border-b border-orange-200"
            : "bg-white/95 text-gray-700 border-b"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>条件検索</span>
          {isFiltering && (
            <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
              {matchCount}/{totalCount}件
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 検索パネル本体 */}
      {isOpen && (
        <div className="bg-white border-b shadow-lg px-4 py-3 space-y-3">
          {/* 面積 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              面積（m²以上）
            </label>
            <div className="flex gap-2">
              {[null, 25, 30, 35, 40, 50].map((val) => (
                <button
                  key={val ?? "any"}
                  onClick={() => onChange({ ...condition, minArea: val })}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    condition.minArea === val
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {val === null ? "指定なし" : `${val}~`}
                </button>
              ))}
            </div>
          </div>

          {/* 家賃上限（共益費込み） */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              家賃+管理費（万円以内）
            </label>
            <div className="flex gap-2 flex-wrap">
              {[null, 8, 10, 12, 14, 16, 20, 25].map((val) => (
                <button
                  key={val ?? "any"}
                  onClick={() =>
                    onChange({ ...condition, maxTotalCost: val })
                  }
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    condition.maxTotalCost === val
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {val === null ? "指定なし" : `~${val}万`}
                </button>
              ))}
            </div>
          </div>

          {/* トグル条件 */}
          <div className="flex gap-3">
            <button
              onClick={() =>
                onChange({
                  ...condition,
                  separateBathToilet: !condition.separateBathToilet,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                condition.separateBathToilet
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {condition.separateBathToilet ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              バストイレ別
            </button>

            <button
              onClick={() =>
                onChange({
                  ...condition,
                  goodSunlight: !condition.goodSunlight,
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                condition.goodSunlight
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {condition.goodSunlight ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              日当たり良好
            </button>
          </div>

          {/* リセット */}
          {isFiltering && (
            <button
              onClick={() =>
                onChange({
                  minArea: null,
                  maxTotalCost: null,
                  separateBathToilet: false,
                  goodSunlight: false,
                })
              }
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              条件をリセット
            </button>
          )}
        </div>
      )}
    </div>
  );
}
