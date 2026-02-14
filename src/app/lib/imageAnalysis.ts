import { Building } from "./rentEstimator";

export interface PhotoEstimate {
  buildingType: Building["type"];
  floorsEstimate: number;
  ageCategory: "new" | "medium" | "old";
  confidence: number; // 0-1
}

/**
 * Canvas API で画像のピクセルデータを分析し、
 * 建物の種類・規模・築年数を推定する
 */
export function analyzeImage(imageData: ImageData): PhotoEstimate {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  let rSum = 0,
    gSum = 0,
    bSum = 0;
  let brightnessSum = 0;
  let saturationSum = 0;
  let skyPixels = 0;
  let darkPixels = 0;
  let warmPixels = 0;

  // 上部1/3をスキャン（空の面積でビル高さを推定）
  const skyRegionEnd = Math.floor(height / 3);
  let skyRegionBlue = 0;
  let skyRegionPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    rSum += r;
    gSum += g;
    bSum += b;

    const brightness = (r + g + b) / 3;
    brightnessSum += brightness;

    // 彩度の簡易計算
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    saturationSum += sat;

    // 空っぽいピクセル（青系＆明るい）
    if (b > 150 && b > r * 1.1 && brightness > 130) {
      skyPixels++;
    }

    // 暗いピクセル（古い建物の特徴）
    if (brightness < 80) {
      darkPixels++;
    }

    // 暖色系（新しい建物・タイルの特徴）
    if (r > b * 1.2 && r > 120) {
      warmPixels++;
    }

    // 上部1/3の青さ
    const pixelIndex = i / 4;
    const y = Math.floor(pixelIndex / width);
    if (y < skyRegionEnd) {
      skyRegionBlue += b > r && b > g ? 1 : 0;
      skyRegionPixels++;
    }
  }

  const avgR = rSum / totalPixels;
  const avgG = gSum / totalPixels;
  const avgB = bSum / totalPixels;
  const avgBrightness = brightnessSum / totalPixels;
  const avgSaturation = saturationSum / totalPixels;
  const skyRatio = skyPixels / totalPixels;
  const darkRatio = darkPixels / totalPixels;
  const warmRatio = warmPixels / totalPixels;
  const skyBlueRatio = skyRegionPixels > 0 ? skyRegionBlue / skyRegionPixels : 0;

  // --- 建物タイプの推定 ---
  let buildingType: Building["type"];
  let typeConfidence = 0.5;

  if (skyBlueRatio > 0.3 && avgBrightness > 140 && avgSaturation < 0.3) {
    // 空が多く見える＋明るい＋彩度低い → タワマン（ガラスカーテンウォール）
    buildingType = "tower";
    typeConfidence = 0.7;
  } else if (darkRatio > 0.3 || (avgBrightness < 100 && avgSaturation < 0.2)) {
    // 暗め・彩度低い → 古いアパート
    buildingType = "apartment";
    typeConfidence = 0.6;
  } else if (warmRatio > 0.25 && avgBrightness > 120) {
    // 暖色系タイル → マンション
    buildingType = "mansion";
    typeConfidence = 0.65;
  } else if (avgBrightness > 160 && avgSaturation < 0.15) {
    // とても明るい・無彩色 → タワマン
    buildingType = "tower";
    typeConfidence = 0.55;
  } else if (avgBrightness < 120) {
    buildingType = "apartment";
    typeConfidence = 0.5;
  } else {
    buildingType = "mansion";
    typeConfidence = 0.45;
  }

  // --- 階数の推定 ---
  // 空の割合が少ない（=建物が大きい）→ 高層
  let floorsEstimate: number;
  if (skyRatio > 0.3) {
    // 空が多い → 低層（引きで撮っている or 低い建物）
    floorsEstimate = buildingType === "tower" ? 20 : 3;
  } else if (skyRatio > 0.15) {
    floorsEstimate = buildingType === "tower" ? 25 : 5;
  } else {
    // 空がほとんどない → 近くで撮っている or 高い建物
    floorsEstimate = buildingType === "tower" ? 35 : 8;
  }

  // --- 築年数カテゴリの推定 ---
  let ageCategory: "new" | "medium" | "old";
  if (avgBrightness > 150 && darkRatio < 0.1 && avgSaturation < 0.25) {
    ageCategory = "new"; // 明るい・きれい → 新築
  } else if (darkRatio > 0.25 || avgBrightness < 100) {
    ageCategory = "old"; // 暗い → 古い
  } else {
    ageCategory = "medium";
  }

  const confidence = Math.min(typeConfidence + (1 - skyRatio) * 0.1, 0.85);

  return {
    buildingType,
    floorsEstimate,
    ageCategory,
    confidence,
  };
}

/**
 * PhotoEstimateに基づいて建物リストからマッチするものをスコアリング
 */
export function scoreBuildingMatch(
  building: Building,
  estimate: PhotoEstimate
): number {
  let score = 0;

  // タイプ一致
  if (building.type === estimate.buildingType) {
    score += 40;
  } else if (
    (building.type === "mansion" && estimate.buildingType === "tower") ||
    (building.type === "tower" && estimate.buildingType === "mansion")
  ) {
    score += 15; // 近い
  }

  // 階数の近さ
  const floorDiff = Math.abs(building.floors - estimate.floorsEstimate);
  if (floorDiff <= 2) score += 30;
  else if (floorDiff <= 5) score += 20;
  else if (floorDiff <= 10) score += 10;

  // 築年数カテゴリ
  const currentYear = new Date().getFullYear();
  const age = currentYear - building.yearBuilt;
  if (estimate.ageCategory === "new" && age <= 10) score += 30;
  else if (estimate.ageCategory === "medium" && age > 10 && age <= 25) score += 30;
  else if (estimate.ageCategory === "old" && age > 25) score += 30;
  else score += 10;

  return score;
}

export function getAgeCategoryLabel(cat: "new" | "medium" | "old"): string {
  switch (cat) {
    case "new":
      return "築浅（〜10年）";
    case "medium":
      return "築中（11〜25年）";
    case "old":
      return "築古（25年超）";
  }
}

export function getBuildingTypeFromEstimate(type: Building["type"]): string {
  switch (type) {
    case "tower":
      return "タワーマンション";
    case "mansion":
      return "マンション";
    case "apartment":
      return "アパート";
  }
}
