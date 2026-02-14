"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Building, generateNearbyBuildings, formatRent } from "../lib/rentEstimator";
import BuildingPopup from "./BuildingPopup";

// Leafletのデフォルトアイコン問題を修正
function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function createBuildingIcon(type: Building["type"], rentMin: number) {
  const colors = {
    tower: { bg: "#7c3aed", border: "#6d28d9" },
    mansion: { bg: "#2563eb", border: "#1d4ed8" },
    apartment: { bg: "#16a34a", border: "#15803d" },
  };
  const { bg, border } = colors[type];
  const rentLabel = formatRent(rentMin);

  return L.divIcon({
    className: "custom-building-marker",
    html: `
      <div style="
        background: ${bg};
        border: 2px solid ${border};
        color: white;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        text-align: center;
        line-height: 1.3;
      ">
        ${rentLabel}~
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// ユーザーの位置に追従するコンポーネント
function MapFollower({
  lat,
  lng,
  shouldFollow,
}: {
  lat: number;
  lng: number;
  shouldFollow: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (shouldFollow) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, shouldFollow, map]);

  return null;
}

interface RentMapProps {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function RentMap({ latitude, longitude, accuracy }: RentMapProps) {
  const [followUser, setFollowUser] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "all" | "tower" | "mansion" | "apartment"
  >("all");

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const buildings = useMemo(
    () => generateNearbyBuildings(latitude, longitude, 0.005, 20),
    [latitude, longitude]
  );

  const filteredBuildings =
    selectedType === "all"
      ? buildings
      : buildings.filter((b) => b.type === selectedType);

  const stats = useMemo(() => {
    if (buildings.length === 0) return null;
    const allRents = buildings.flatMap((b) => b.units.map((u) => u.rent));
    return {
      min: Math.min(...allRents),
      max: Math.max(...allRents),
      avg: allRents.reduce((a, b) => a + b, 0) / allRents.length,
      count: buildings.length,
    };
  }, [buildings]);

  return (
    <div className="flex flex-col h-full">
      {/* フィルターバー */}
      <div className="bg-white/95 backdrop-blur-sm border-b px-3 py-2 flex gap-2 overflow-x-auto flex-shrink-0 z-10">
        {(
          [
            { key: "all", label: "すべて", color: "gray" },
            { key: "tower", label: "タワマン", color: "purple" },
            { key: "mansion", label: "マンション", color: "blue" },
            { key: "apartment", label: "アパート", color: "green" },
          ] as const
        ).map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedType === key
                ? `bg-${color}-600 text-white shadow-md`
                : `bg-${color}-50 text-${color}-700 hover:bg-${color}-100`
            }`}
            style={
              selectedType === key
                ? {
                    backgroundColor:
                      color === "gray"
                        ? "#4b5563"
                        : color === "purple"
                        ? "#7c3aed"
                        : color === "blue"
                        ? "#2563eb"
                        : "#16a34a",
                    color: "white",
                  }
                : {}
            }
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setFollowUser(!followUser)}
          className={`ml-auto px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            followUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {followUser ? "追従中" : "追従OFF"}
        </button>
      </div>

      {/* 地図 */}
      <div className="flex-1 relative">
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFollower
            lat={latitude}
            lng={longitude}
            shouldFollow={followUser}
          />

          {/* ユーザー位置の精度範囲 */}
          {accuracy && (
            <Circle
              center={[latitude, longitude]}
              radius={accuracy}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          )}

          {/* ユーザー位置マーカー */}
          <Marker position={[latitude, longitude]} icon={createUserIcon()}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">現在地</p>
                {accuracy && (
                  <p className="text-xs text-gray-500">
                    精度: {Math.round(accuracy)}m
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {/* 建物マーカー */}
          {filteredBuildings.map((building) => (
            <Marker
              key={building.id}
              position={[building.lat, building.lng]}
              icon={createBuildingIcon(
                building.type,
                Math.min(...building.units.map((u) => u.rent))
              )}
            >
              <Popup maxWidth={300} minWidth={240}>
                <BuildingPopup building={building} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 統計バー */}
      {stats && (
        <div className="bg-white/95 backdrop-blur-sm border-t px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="text-center">
              <p className="text-gray-400">周辺物件</p>
              <p className="font-bold text-gray-800 text-sm">
                {filteredBuildings.length}件
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">最安</p>
              <p className="font-bold text-green-600 text-sm">
                {formatRent(stats.min)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">平均</p>
              <p className="font-bold text-orange-600 text-sm">
                {formatRent(stats.avg)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">最高</p>
              <p className="font-bold text-red-600 text-sm">
                {formatRent(stats.max)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
