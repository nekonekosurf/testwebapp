"use client";

import {
  Building,
  SearchCondition,
  getBuildingTypeLabel,
  formatRent,
  unitMatchesCondition,
  DEFAULT_CONDITION,
} from "../lib/rentEstimator";

interface BuildingPopupProps {
  building: Building;
  condition?: SearchCondition;
}

export default function BuildingPopup({ building, condition }: BuildingPopupProps) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - building.yearBuilt;
  const cond = condition ?? DEFAULT_CONDITION;
  const isFiltering =
    cond.minArea !== null ||
    cond.maxTotalCost !== null ||
    cond.separateBathToilet ||
    cond.goodSunlight;

  return (
    <div className="min-w-[240px]">
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
        {building.units.map((unit, i) => {
          const matches = unitMatchesCondition(unit, cond);
          const totalCost = unit.rent + unit.managementFee / 10000;
          return (
            <div
              key={i}
              className={`py-1.5 border-b border-gray-100 last:border-0 ${
                isFiltering && !matches ? "opacity-30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
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
              <div className="flex items-center justify-between mt-0.5">
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
            </div>
          );
        })}
      </div>
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
