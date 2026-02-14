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

export type Direction = "南" | "南東" | "南西" | "東" | "西" | "北東" | "北西" | "北";

export interface RentalUnit {
  layout: string; // 1K, 1LDK, 2LDK, etc.
  area: number; // m²
  floor: number;
  rent: number; // 万円
  managementFee: number; // 管理費（円）
  separateBathToilet: boolean; // バストイレ別
  direction: Direction; // 向き
}

export interface SearchCondition {
  minArea: number | null; // 最小面積 m²
  maxTotalCost: number | null; // 家賃+管理費の上限（万円）
  separateBathToilet: boolean; // バストイレ別必須
  goodSunlight: boolean; // 日当たり良好（南向き系）
}

const GOOD_SUNLIGHT_DIRECTIONS: Direction[] = ["南", "南東", "南西"];

const DIRECTIONS: Direction[] = ["南", "南東", "南西", "東", "西", "北東", "北西", "北"];

export function unitMatchesCondition(unit: RentalUnit, cond: SearchCondition): boolean {
  if (cond.minArea !== null && unit.area < cond.minArea) return false;
  if (cond.maxTotalCost !== null) {
    const totalCost = unit.rent + unit.managementFee / 10000;
    if (totalCost > cond.maxTotalCost) return false;
  }
  if (cond.separateBathToilet && !unit.separateBathToilet) return false;
  if (cond.goodSunlight && !GOOD_SUNLIGHT_DIRECTIONS.includes(unit.direction)) return false;
  return true;
}

export function buildingHasMatchingUnit(building: Building, cond: SearchCondition): boolean {
  return building.units.some((u) => unitMatchesCondition(u, cond));
}

export function getMatchingUnits(building: Building, cond: SearchCondition): RentalUnit[] {
  return building.units.filter((u) => unitMatchesCondition(u, cond));
}

export const DEFAULT_CONDITION: SearchCondition = {
  minArea: null,
  maxTotalCost: null,
  separateBathToilet: false,
  goodSunlight: false,
};

// 間取りごとの面積範囲（min, typical, max）
const LAYOUT_AREA_RANGE: Record<string, { min: number; typical: number; max: number }> = {
  "1R":    { min: 15, typical: 20, max: 25 },
  "1K":    { min: 18, typical: 23, max: 28 },
  "1DK":   { min: 25, typical: 30, max: 35 },
  "1LDK":  { min: 30, typical: 40, max: 50 },
  "2K":    { min: 28, typical: 35, max: 42 },
  "2DK":   { min: 35, typical: 45, max: 55 },
  "2LDK":  { min: 50, typical: 60, max: 75 },
  "3LDK":  { min: 60, typical: 70, max: 85 },
  "3SLDK": { min: 70, typical: 80, max: 95 },
};

// 建物タイプ別に選ばれる間取り
const LAYOUTS_BY_TYPE: Record<Building["type"], string[]> = {
  apartment: ["1R", "1K", "1DK", "2K", "2DK"],
  mansion:   ["1DK", "1LDK", "2DK", "2LDK", "3LDK"],
  tower:     ["1LDK", "2LDK", "3LDK", "3SLDK"],
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

    const availableLayouts = LAYOUTS_BY_TYPE[type];
    const unitCount = type === "tower" ? 4 : type === "mansion" ? 3 : 2;
    const units: RentalUnit[] = [];

    for (let u = 0; u < unitCount; u++) {
      const layoutIndex = Math.floor(random() * availableLayouts.length);
      const layout = availableLayouts[layoutIndex];
      const range = LAYOUT_AREA_RANGE[layout];
      // 面積を範囲内でランダム生成
      const area = Math.round(range.min + random() * (range.max - range.min));
      const floor = Math.min(Math.floor(random() * floors) + 1, floors);
      const rent = estimateRent(area, floor, floors, yearBuilt, type, baseRate);
      const managementFee =
        type === "tower"
          ? Math.round((8000 + random() * 12000) / 100) * 100
          : type === "mansion"
          ? Math.round((3000 + random() * 7000) / 100) * 100
          : Math.round((1000 + random() * 4000) / 100) * 100;

      // バストイレ別: タワマンはほぼ確実、マンションは高確率、アパートは半々
      const separateRate =
        type === "tower" ? 0.95 : type === "mansion" ? 0.75 : 0.4;
      const separateBathToilet = random() < separateRate;

      // 向き: ランダムだが南向き系はやや少なめ（人気で埋まりやすい想定）
      const dirIndex = Math.floor(random() * DIRECTIONS.length);
      const direction = DIRECTIONS[dirIndex];

      units.push({ layout, area, floor, rent, managementFee, separateBathToilet, direction });
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
