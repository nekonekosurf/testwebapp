"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Building,
  SearchCondition,
  DEFAULT_CONDITION,
  generateNearbyBuildings,
  formatRent,
  buildingHasMatchingUnit,
  getMatchingUnits,
} from "../lib/rentEstimator";
import {
  RouteResult,
  fetchWalkingRoute,
  formatDistance,
  formatDuration,
} from "../lib/routing";
import BuildingPopup from "./BuildingPopup";
import SearchPanel from "./SearchPanel";
import PhotoSearch from "./PhotoSearch";

// Leafletのデフォルトアイコン問題を修正
let iconsFixed = false;
function fixLeafletIcons() {
  if (iconsFixed) return;
  iconsFixed = true;
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

// アイコンキャッシュ
const iconCache = new Map<string, L.DivIcon>();

function createBuildingIcon(type: Building["type"], rentMin: number, dimmed: boolean) {
  const key = `${type}-${rentMin}-${dimmed}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const colors = {
    tower: { bg: "#7c3aed", border: "#6d28d9" },
    mansion: { bg: "#2563eb", border: "#1d4ed8" },
    apartment: { bg: "#16a34a", border: "#15803d" },
  };
  const { bg, border } = colors[type];
  const rentLabel = formatRent(rentMin);

  const icon = L.divIcon({
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
        opacity: ${dimmed ? "0.3" : "1"};
      ">
        ${rentLabel}~
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
  });
  iconCache.set(key, icon);
  return icon;
}

let userIconInstance: L.DivIcon | null = null;
function createUserIcon() {
  if (userIconInstance) return userIconInstance;
  userIconInstance = L.divIcon({
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
  return userIconInstance;
}

let destIconInstance: L.DivIcon | null = null;
function createDestIcon() {
  if (destIconInstance) return destIconInstance;
  destIconInstance = L.divIcon({
    className: "dest-marker",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #ef4444, 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3" fill="#ef4444" stroke="white" stroke-width="2"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  return destIconInstance;
}

// 座標をグリッドにスナップ（約100m単位）
function snapToGrid(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// ユーザーの位置に追従するコンポーネント（スロットル付き）
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
  const lastMoveRef = useRef(0);

  useEffect(() => {
    if (!shouldFollow) return;
    const now = Date.now();
    if (now - lastMoveRef.current < 2000) return;
    lastMoveRef.current = now;
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.5 });
  }, [lat, lng, shouldFollow, map]);

  return null;
}

// ルート表示時にルート全体が見えるようにフィット
function RouteFitter({ route }: { route: RouteResult }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    const bounds = L.latLngBounds(route.coordinates.map((c) => [c[0], c[1]]));
    map.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [route, map]);

  return null;
}

function isConditionActive(cond: SearchCondition): boolean {
  return (
    cond.minArea !== null ||
    cond.maxTotalCost !== null ||
    cond.separateBathToilet ||
    cond.goodSunlight
  );
}

interface RentMapProps {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function RentMap({ latitude, longitude, accuracy }: RentMapProps) {
  const [followUser, setFollowUser] = useState(true);
  const [condition, setCondition] = useState<SearchCondition>(DEFAULT_CONDITION);

  // 写真検索の状態
  const [photoMatchIds, setPhotoMatchIds] = useState<Set<string> | null>(null);

  // 道案内の状態
  const [navTarget, setNavTarget] = useState<Building | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // 座標をグリッドにスナップして、微小な移動では建物を再生成しない
  const snappedLat = useMemo(() => snapToGrid(latitude), [latitude]);
  const snappedLng = useMemo(() => snapToGrid(longitude), [longitude]);

  const buildings = useMemo(
    () => generateNearbyBuildings(snappedLat, snappedLng, 0.005, 20),
    [snappedLat, snappedLng]
  );

  const filtering = isConditionActive(condition);

  const matchedBuildingIds = useMemo(() => {
    if (!filtering) return null;
    const ids = new Set<string>();
    for (const b of buildings) {
      if (buildingHasMatchingUnit(b, condition)) {
        ids.add(b.id);
      }
    }
    return ids;
  }, [buildings, condition, filtering]);

  const matchCount = matchedBuildingIds?.size ?? buildings.length;

  const buildingIcons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const b of buildings) {
      const dimmedByFilter = filtering && !(matchedBuildingIds?.has(b.id));
      const dimmedByPhoto = photoMatchIds !== null && !photoMatchIds.has(b.id);
      const dimmed = dimmedByFilter || dimmedByPhoto;
      if (filtering && matchedBuildingIds?.has(b.id)) {
        const matchingUnits = getMatchingUnits(b, condition);
        const minRent = Math.min(...matchingUnits.map((u) => u.rent));
        map.set(b.id, createBuildingIcon(b.type, minRent, dimmedByPhoto));
      } else {
        const minRent = Math.min(...b.units.map((u) => u.rent));
        map.set(b.id, createBuildingIcon(b.type, minRent, dimmed));
      }
    }
    return map;
  }, [buildings, filtering, matchedBuildingIds, condition, photoMatchIds]);

  const stats = useMemo(() => {
    if (buildings.length === 0) return null;
    if (filtering && matchedBuildingIds) {
      const matchedBuildings = buildings.filter((b) => matchedBuildingIds.has(b.id));
      if (matchedBuildings.length === 0) return null;
      const matchedRents = matchedBuildings.flatMap((b) =>
        getMatchingUnits(b, condition).map((u) => u.rent)
      );
      if (matchedRents.length === 0) return null;
      return {
        min: Math.min(...matchedRents),
        max: Math.max(...matchedRents),
        avg: matchedRents.reduce((a, b) => a + b, 0) / matchedRents.length,
      };
    }
    const allRents = buildings.flatMap((b) => b.units.map((u) => u.rent));
    return {
      min: Math.min(...allRents),
      max: Math.max(...allRents),
      avg: allRents.reduce((a, b) => a + b, 0) / allRents.length,
    };
  }, [buildings, filtering, matchedBuildingIds, condition]);

  const userIcon = useMemo(() => createUserIcon(), []);
  const destIcon = useMemo(() => createDestIcon(), []);

  // 道案内を開始
  const handleNavigate = useCallback(
    async (building: Building) => {
      setNavTarget(building);
      setNavLoading(true);
      setNavError(null);
      setRoute(null);
      setFollowUser(false);

      try {
        const result = await fetchWalkingRoute(
          latitude,
          longitude,
          building.lat,
          building.lng
        );
        setRoute(result);
      } catch {
        setNavError("ルートを取得できませんでした");
      } finally {
        setNavLoading(false);
      }
    },
    [latitude, longitude]
  );

  // 道案内を終了
  const handleCancelNav = useCallback(() => {
    setNavTarget(null);
    setRoute(null);
    setNavError(null);
    setFollowUser(true);
  }, []);

  const navigating = navTarget !== null;

  return (
    <div className="flex flex-col h-full">
      {/* ナビゲーションバー（道案内中） */}
      {navigating && (
        <div className="bg-blue-600 text-white px-4 py-3 flex-shrink-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-200">道案内中</p>
              <p className="font-bold text-sm truncate">{navTarget.name}</p>
              {navLoading && (
                <p className="text-xs text-blue-200 mt-0.5">ルートを検索中...</p>
              )}
              {navError && (
                <p className="text-xs text-red-200 mt-0.5">{navError}</p>
              )}
              {route && (
                <div className="flex gap-3 mt-1">
                  <span className="text-sm font-medium">
                    {formatDistance(route.distanceMeters)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatDuration(route.durationSeconds)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleCancelNav}
              className="ml-3 px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium hover:bg-white/30 transition-colors"
            >
              終了
            </button>
          </div>
        </div>
      )}

      {/* 検索パネル（道案内中は非表示） */}
      {!navigating && (
        <>
          <SearchPanel
            condition={condition}
            onChange={setCondition}
            matchCount={matchCount}
            totalCount={buildings.length}
          />
          <div className="bg-white/95 backdrop-blur-sm border-b px-3 py-2 flex gap-2 overflow-x-auto flex-shrink-0 z-10">
            <button
              onClick={() => setFollowUser(!followUser)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                followUser
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {followUser ? "追従中" : "追従OFF"}
            </button>
            <PhotoSearch
              buildings={buildings}
              onResults={setPhotoMatchIds}
              onClear={() => setPhotoMatchIds(null)}
            />
            {filtering && (
              <span className="px-3 py-1 text-xs text-orange-600 font-medium">
                {matchCount}件ヒット / {buildings.length}件中
              </span>
            )}
            {photoMatchIds && (
              <span className="px-3 py-1 text-xs text-purple-600 font-medium">
                写真: {photoMatchIds.size}件
              </span>
            )}
          </div>
        </>
      )}

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
            shouldFollow={followUser && !navigating}
          />

          {/* ルート全体をフィット */}
          {route && <RouteFitter route={route} />}

          {/* ルート線 */}
          {route && (
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
                opacity: 0.8,
                dashArray: "10, 6",
              }}
            />
          )}

          {/* 目的地マーカー */}
          {navTarget && (
            <Marker position={[navTarget.lat, navTarget.lng]} icon={destIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-sm">{navTarget.name}</p>
                  {route && (
                    <p className="text-xs text-gray-500">
                      {formatDistance(route.distanceMeters)} / {formatDuration(route.durationSeconds)}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

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
          <Marker position={[latitude, longitude]} icon={userIcon}>
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
          {buildings.map((building) => (
            <Marker
              key={building.id}
              position={[building.lat, building.lng]}
              icon={buildingIcons.get(building.id)!}
            >
              <Popup maxWidth={320} minWidth={260}>
                <BuildingPopup
                  building={building}
                  condition={condition}
                  onNavigate={handleNavigate}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 統計バー（道案内中は非表示） */}
      {!navigating && stats && (
        <div className="bg-white/95 backdrop-blur-sm border-t px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="text-center">
              <p className="text-gray-400">{filtering ? "該当物件" : "周辺物件"}</p>
              <p className="font-bold text-gray-800 text-sm">
                {matchCount}件
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

      {/* 条件に合致する物件がない場合 */}
      {!navigating && filtering && matchCount === 0 && (
        <div className="bg-orange-50 border-t border-orange-200 px-4 py-2 flex-shrink-0">
          <p className="text-xs text-orange-700 text-center">
            この条件に合致する物件が周辺にありません。条件を緩めてみてください。
          </p>
        </div>
      )}
    </div>
  );
}
