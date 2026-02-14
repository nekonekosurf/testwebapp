"use client";

import {
  Building,
  getBuildingTypeLabel,
  formatRent,
} from "../lib/rentEstimator";

interface BuildingPopupProps {
  building: Building;
}

export default function BuildingPopup({ building }: BuildingPopupProps) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - building.yearBuilt;

  return (
    <div className="min-w-[220px]">
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
        <p className="text-xs text-gray-500 mb-1">推定家賃</p>
        {building.units.map((unit, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-2">
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
              <span className="text-xs text-gray-400 block">
                管理費 {unit.managementFee.toLocaleString()}円
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 italic">
        ※推定値です。実際の家賃とは異なる場合があります
      </p>
    </div>
  );
}
