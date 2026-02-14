export interface Building {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "mansion" | "apartment" | "tower";
  floors: number;
  yearBuilt: number;
  units: RentalUnit[];
}

export interface RentalUnit {
  layout: string; // 1K, 1LDK, 2LDK, etc.
  area: number; // m²
  floor: number;
  rent: number; // 万円
  managementFee: number; // 管理費（円）
}

const LAYOUT_BASE_AREA: Record<string, number> = {
  "1R": 18,
  "1K": 22,
  "1DK": 28,
  "1LDK": 38,
  "2K": 32,
  "2DK": 42,
  "2LDK": 55,
  "3LDK": 68,
  "3SLDK": 75,
};

const BUILDING_NAMES_MANSION = [
  "グランドメゾン",
  "プラウド",
  "パークハウス",
  "ブリリア",
  "シティタワー",
  "レジデンシャル",
  "ライオンズマンション",
  "パークホームズ",
  "ザ・パークハウス",
  "クレヴィア",
  "リビオ",
  "オーベル",
  "イニシア",
  "ルフォン",
  "サーパス",
  "アルファステイツ",
  "ポレスター",
  "バウス",
  "ルネ",
  "コスモ",
];

const BUILDING_NAMES_APT = [
  "コーポ",
  "ハイツ",
  "メゾン",
  "カーサ",
  "フラット",
  "ヴィラ",
  "レジデンス",
  "パレス",
  "シャトー",
  "プチ",
];

const LOCATION_SUFFIXES = [
  "桜ヶ丘",
  "緑が丘",
  "青葉台",
  "中央",
  "本町",
  "栄",
  "富士見",
  "若葉",
  "日の出",
  "光が丘",
  "松原",
  "柏",
  "大和",
  "旭",
  "希望ヶ丘",
];

// エリアごとの家賃基準（1m²あたり万円）
// 東京23区内の主要エリアの基準値
const AREA_RENT_RATES: Record<
  string,
  { baseRate: number; label: string }
> = {
  default: { baseRate: 0.35, label: "郊外エリア" },
  tokyo_center: { baseRate: 0.55, label: "都心エリア" },
  tokyo_sub: { baseRate: 0.42, label: "副都心エリア" },
  yokohama: { baseRate: 0.32, label: "横浜エリア" },
  osaka_center: { baseRate: 0.38, label: "大阪中心部" },
  nagoya: { baseRate: 0.3, label: "名古屋エリア" },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getAreaRate(lat: number, lng: number): number {
  // 東京都心（皇居周辺）
  if (
    lat > 35.65 && lat < 35.7 &&
    lng > 139.72 && lng < 139.8
  ) {
    return AREA_RENT_RATES.tokyo_center.baseRate;
  }
  // 東京副都心（新宿・渋谷・池袋周辺）
  if (
    lat > 35.68 && lat < 35.74 &&
    lng > 139.68 && lng < 139.73
  ) {
    return AREA_RENT_RATES.tokyo_sub.baseRate;
  }
  // 東京23区内
  if (
    lat > 35.55 && lat < 35.82 &&
    lng > 139.55 && lng < 139.92
  ) {
    return 0.38;
  }
  // 横浜
  if (
    lat > 35.4 && lat < 35.5 &&
    lng > 139.58 && lng < 139.7
  ) {
    return AREA_RENT_RATES.yokohama.baseRate;
  }
  // 大阪中心部
  if (
    lat > 34.64 && lat < 34.72 &&
    lng > 135.47 && lng < 135.55
  ) {
    return AREA_RENT_RATES.osaka_center.baseRate;
  }
  // 名古屋
  if (
    lat > 35.14 && lat < 35.2 &&
    lng > 136.88 && lng < 136.95
  ) {
    return AREA_RENT_RATES.nagoya.baseRate;
  }
  return AREA_RENT_RATES.default.baseRate;
}

function estimateRent(
  area: number,
  floor: number,
  totalFloors: number,
  yearBuilt: number,
  buildingType: Building["type"],
  baseRate: number
): number {
  let rate = baseRate;

  // 築年数による調整（新しいほど高い）
  const age = new Date().getFullYear() - yearBuilt;
  if (age <= 3) rate *= 1.15;
  else if (age <= 10) rate *= 1.05;
  else if (age <= 20) rate *= 0.95;
  else if (age <= 30) rate *= 0.85;
  else rate *= 0.75;

  // 階数による調整（高層階ほど高い）
  const floorRatio = floor / totalFloors;
  rate *= 1 + floorRatio * 0.15;

  // 建物タイプによる調整
  if (buildingType === "tower") rate *= 1.2;
  else if (buildingType === "mansion") rate *= 1.0;
  else rate *= 0.85; // apartment

  const rent = area * rate;
  return Math.round(rent * 10) / 10;
}

export function generateNearbyBuildings(
  centerLat: number,
  centerLng: number,
  radius: number = 0.005, // ~500m
  count: number = 15
): Building[] {
  const seed = Math.round((centerLat * 10000 + centerLng * 10000) * 100);
  const random = seededRandom(seed);

  const buildings: Building[] = [];
  const baseRate = getAreaRate(centerLat, centerLng);

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const dist = (random() * 0.8 + 0.2) * radius;
    const lat = centerLat + Math.sin(angle) * dist;
    const lng = centerLng + Math.cos(angle) * dist * 1.2;

    const typeRoll = random();
    const type: Building["type"] =
      typeRoll < 0.15 ? "tower" : typeRoll < 0.55 ? "mansion" : "apartment";

    const floors =
      type === "tower"
        ? Math.floor(random() * 25) + 15
        : type === "mansion"
        ? Math.floor(random() * 8) + 3
        : Math.floor(random() * 3) + 2;

    const yearBuilt =
      type === "tower"
        ? 2010 + Math.floor(random() * 16)
        : 1985 + Math.floor(random() * 41);

    const namePool =
      type === "apartment" ? BUILDING_NAMES_APT : BUILDING_NAMES_MANSION;
    const nameIndex = Math.floor(random() * namePool.length);
    const suffixIndex = Math.floor(random() * LOCATION_SUFFIXES.length);
    const name = `${namePool[nameIndex]}${LOCATION_SUFFIXES[suffixIndex]}`;

    const layouts = Object.keys(LAYOUT_BASE_AREA);
    const unitCount = type === "tower" ? 4 : type === "mansion" ? 3 : 2;
    const units: RentalUnit[] = [];

    for (let u = 0; u < unitCount; u++) {
      const layoutIndex = Math.floor(random() * layouts.length);
      const layout = layouts[layoutIndex];
      const baseArea = LAYOUT_BASE_AREA[layout];
      const area = Math.round(baseArea + (random() - 0.5) * 8);
      const floor = Math.min(Math.floor(random() * floors) + 1, floors);
      const rent = estimateRent(area, floor, floors, yearBuilt, type, baseRate);
      const managementFee =
        type === "tower"
          ? Math.round((8000 + random() * 12000) / 100) * 100
          : type === "mansion"
          ? Math.round((3000 + random() * 7000) / 100) * 100
          : Math.round((1000 + random() * 4000) / 100) * 100;

      units.push({ layout, area, floor, rent, managementFee });
    }

    units.sort((a, b) => a.rent - b.rent);

    buildings.push({
      id: `bld-${seed}-${i}`,
      name,
      lat,
      lng,
      type,
      floors,
      yearBuilt,
      units,
    });
  }

  return buildings;
}

export function getBuildingTypeLabel(type: Building["type"]): string {
  switch (type) {
    case "tower":
      return "タワーマンション";
    case "mansion":
      return "マンション";
    case "apartment":
      return "アパート";
  }
}

export function formatRent(rent: number): string {
  if (rent >= 10) {
    return `${rent.toFixed(1)}万円`;
  }
  return `${(rent * 10000).toLocaleString()}円`;
}
