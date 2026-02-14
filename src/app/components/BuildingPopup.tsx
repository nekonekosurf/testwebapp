"use client";

import { useState } from "react";
import {
  Building,
  SearchCondition,
  getBuildingTypeLabel,
  formatRent,
  unitMatchesCondition,
  DEFAULT_CONDITION,
} from "../lib/rentEstimator";
import FloorPlan from "./FloorPlan";

interface BuildingPopupProps {
  building: Building;
  condition?: SearchCondition;
  onNavigate?: (building: Building) => void;
}

export default function BuildingPopup({ building, condition, onNavigate }: BuildingPopupProps) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - building.yearBuilt;
  const cond = condition ?? DEFAULT_CONDITION;
  const isFiltering =
    cond.minArea !== null ||
    cond.maxTotalCost !== null ||
    cond.separateBathToilet ||
    cond.goodSunlight;

  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);

  return (
    <div className="min-w-[260px]">
      <h3 className="font-bold text-base mb-1 text-gray-900">
        {building.name}
      </h3>
      <div className="flex gap-2 mb-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          building.type === "tower"
            ? "bg-purple-100 text-purple-700"
            : building.type === "mansion"
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700"
        }`}>
          {getBuildingTypeLabel(building.type)}
        </span>
        <span className="text-xs text-gray-500">
          {building.floors}階建 / 築{age}年
        </span>
      </div>

      <div className="border-t pt-2">
        <p className="text-xs text-gray-500 mb-1">
          推定家賃
          <span className="text-gray-400 ml-1">（タップで間取り図）</span>
        </p>
        {building.units.map((unit, i) => {
          const matches = unitMatchesCondition(unit, cond);
          const totalCost = unit.rent + unit.managementFee / 10000;
          const isExpanded = expandedUnit === i;
          return (
            <div
              key={i}
              className={`border-b border-gray-100 last:border-0 ${
                isFiltering && !matches ? "opacity-30" : ""
              }`}
            >
              <button
                type="button"
                className="w-full text-left py-1.5 cursor-pointer hover:bg-gray-50 transition-colors rounded"
                onClick={() => setExpandedUnit(isExpanded ? null : i)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {unit.layout}
                    </span>
                    <span className="text-xs text-gray-400">
                      {unit.area}m² / {unit.floor}F
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-orange-600">
                      {formatRent(unit.rent)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5 pl-4">
                  <div className="flex gap-1 flex-wrap">
                    <UnitBadge
                      label={unit.direction + "向き"}
                      active={["南", "南東", "南西"].includes(unit.direction)}
                      color="yellow"
                    />
                    <UnitBadge
                      label={unit.separateBathToilet ? "BT別" : "ユニット"}
                      active={unit.separateBathToilet}
                      color="cyan"
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    計 {totalCost.toFixed(1)}万
                  </span>
                </div>
              </button>

              {/* 間取り図（展開時） */}
              {isExpanded && (
                <div className="pb-2 pt-1 px-1">
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <FloorPlan
                      layout={unit.layout}
                      area={unit.area}
                      separateBathToilet={unit.separateBathToilet}
                      direction={unit.direction}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* 道案内ボタン */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate(building)}
          className="w-full mt-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          ここへ道案内
        </button>
      )}
      <p className="text-xs text-gray-400 mt-2 italic">
        ※推定値です。実際の家賃とは異なる場合があります
      </p>
    </div>
  );
}

function UnitBadge({
  label,
  active,
  color,
}: {
  label: string;
  active: boolean;
  color: "yellow" | "cyan";
}) {
  const styles =
    active
      ? color === "yellow"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-cyan-100 text-cyan-700"
      : "bg-gray-100 text-gray-400";

  return (
    <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${styles}`}>
      {label}
    </span>
  );
}
