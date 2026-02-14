"use client";

interface FloorPlanProps {
  layout: string;
  area: number;
  separateBathToilet: boolean;
  direction: string;
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fontSize?: number;
  fill: string;
}

function getFloorPlanRooms(
  layout: string,
  separateBT: boolean
): Room[] {
  // 全体を 160x120 のキャンバスに配置
  switch (layout) {
    case "1R":
      return [
        { x: 0, y: 0, w: 160, h: 90, label: "洋室", fill: "#fef3c7" },
        { x: 0, y: 90, w: 80, h: 30, label: separateBT ? "浴室" : "UB", fontSize: 9, fill: "#dbeafe" },
        { x: 80, y: 90, w: 80, h: 30, label: "玄関", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "1K":
      return [
        { x: 0, y: 0, w: 160, h: 72, label: "洋室", fill: "#fef3c7" },
        { x: 0, y: 72, w: 80, h: 28, label: "K", fontSize: 10, fill: "#fce7f3" },
        { x: 80, y: 72, w: 40, h: 28, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 120, y: 72, w: 40, h: 28, label: separateBT ? "トイレ" : "玄関", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#f3f4f6" },
        { x: 0, y: 100, w: 160, h: 20, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "1DK":
      return [
        { x: 0, y: 0, w: 160, h: 60, label: "洋室", fill: "#fef3c7" },
        { x: 0, y: 60, w: 100, h: 36, label: "DK", fontSize: 11, fill: "#fce7f3" },
        { x: 100, y: 60, w: 60, h: 18, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 100, y: 78, w: 60, h: 18, label: separateBT ? "トイレ" : "収納", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#f5f5f4" },
        { x: 0, y: 96, w: 160, h: 24, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "1LDK":
      return [
        { x: 0, y: 0, w: 80, h: 60, label: "洋室", fill: "#fef3c7" },
        { x: 80, y: 0, w: 80, h: 60, label: "LDK", fontSize: 12, fill: "#fce7f3" },
        { x: 0, y: 60, w: 50, h: 30, label: "収納", fontSize: 9, fill: "#f5f5f4" },
        { x: 50, y: 60, w: 50, h: 30, label: separateBT ? "浴室" : "UB", fontSize: 9, fill: "#dbeafe" },
        { x: 100, y: 60, w: 60, h: 30, label: separateBT ? "トイレ" : "洗面", fontSize: 9, fill: separateBT ? "#e0e7ff" : "#dbeafe" },
        { x: 0, y: 90, w: 160, h: 30, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "2K":
      return [
        { x: 0, y: 0, w: 80, h: 60, label: "洋室1", fontSize: 10, fill: "#fef3c7" },
        { x: 80, y: 0, w: 80, h: 60, label: "洋室2", fontSize: 10, fill: "#fef9c3" },
        { x: 0, y: 60, w: 80, h: 36, label: "K", fontSize: 11, fill: "#fce7f3" },
        { x: 80, y: 60, w: 40, h: 36, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 120, y: 60, w: 40, h: 36, label: separateBT ? "トイレ" : "収納", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#f5f5f4" },
        { x: 0, y: 96, w: 160, h: 24, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "2DK":
      return [
        { x: 0, y: 0, w: 80, h: 55, label: "洋室1", fontSize: 10, fill: "#fef3c7" },
        { x: 80, y: 0, w: 80, h: 55, label: "洋室2", fontSize: 10, fill: "#fef9c3" },
        { x: 0, y: 55, w: 100, h: 40, label: "DK", fontSize: 12, fill: "#fce7f3" },
        { x: 100, y: 55, w: 60, h: 20, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 100, y: 75, w: 60, h: 20, label: separateBT ? "トイレ" : "洗面", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#dbeafe" },
        { x: 0, y: 95, w: 160, h: 25, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "2LDK":
      return [
        { x: 0, y: 0, w: 70, h: 50, label: "洋室1", fontSize: 10, fill: "#fef3c7" },
        { x: 70, y: 0, w: 90, h: 50, label: "LDK", fontSize: 12, fill: "#fce7f3" },
        { x: 0, y: 50, w: 70, h: 40, label: "洋室2", fontSize: 10, fill: "#fef9c3" },
        { x: 70, y: 50, w: 45, h: 20, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 115, y: 50, w: 45, h: 20, label: separateBT ? "トイレ" : "洗面", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#dbeafe" },
        { x: 70, y: 70, w: 90, h: 20, label: "収納", fontSize: 9, fill: "#f5f5f4" },
        { x: 0, y: 90, w: 160, h: 30, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "3LDK":
      return [
        { x: 0, y: 0, w: 55, h: 45, label: "洋室1", fontSize: 9, fill: "#fef3c7" },
        { x: 55, y: 0, w: 50, h: 45, label: "洋室2", fontSize: 9, fill: "#fef9c3" },
        { x: 105, y: 0, w: 55, h: 45, label: "洋室3", fontSize: 9, fill: "#ecfccb" },
        { x: 0, y: 45, w: 105, h: 40, label: "LDK", fontSize: 12, fill: "#fce7f3" },
        { x: 105, y: 45, w: 55, h: 20, label: separateBT ? "浴室" : "UB", fontSize: 8, fill: "#dbeafe" },
        { x: 105, y: 65, w: 55, h: 20, label: separateBT ? "トイレ" : "洗面", fontSize: 8, fill: separateBT ? "#e0e7ff" : "#dbeafe" },
        { x: 0, y: 85, w: 160, h: 35, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    case "3SLDK":
      return [
        { x: 0, y: 0, w: 50, h: 40, label: "洋室1", fontSize: 9, fill: "#fef3c7" },
        { x: 50, y: 0, w: 50, h: 40, label: "洋室2", fontSize: 9, fill: "#fef9c3" },
        { x: 100, y: 0, w: 60, h: 40, label: "洋室3", fontSize: 9, fill: "#ecfccb" },
        { x: 0, y: 40, w: 100, h: 38, label: "LDK", fontSize: 12, fill: "#fce7f3" },
        { x: 100, y: 40, w: 60, h: 19, label: "S", fontSize: 9, fill: "#f5f5f4" },
        { x: 100, y: 59, w: 30, h: 19, label: separateBT ? "浴室" : "UB", fontSize: 7, fill: "#dbeafe" },
        { x: 130, y: 59, w: 30, h: 19, label: separateBT ? "WC" : "洗", fontSize: 7, fill: separateBT ? "#e0e7ff" : "#dbeafe" },
        { x: 0, y: 78, w: 160, h: 42, label: "玄関・廊下", fontSize: 9, fill: "#f3f4f6" },
      ];
    default:
      return [
        { x: 0, y: 0, w: 160, h: 90, label: layout, fill: "#fef3c7" },
        { x: 0, y: 90, w: 160, h: 30, label: "玄関", fontSize: 9, fill: "#f3f4f6" },
      ];
  }
}

const DIRECTION_ARROW: Record<string, { rotation: number }> = {
  "北": { rotation: 0 },
  "北東": { rotation: 45 },
  "東": { rotation: 90 },
  "南東": { rotation: 135 },
  "南": { rotation: 180 },
  "南西": { rotation: 225 },
  "西": { rotation: 270 },
  "北西": { rotation: 315 },
};

export default function FloorPlan({
  layout,
  area,
  separateBathToilet,
  direction,
}: FloorPlanProps) {
  const rooms = getFloorPlanRooms(layout, separateBathToilet);
  const arrow = DIRECTION_ARROW[direction] ?? { rotation: 180 };

  return (
    <div className="relative">
      <svg
        viewBox="0 0 200 140"
        className="w-full"
        style={{ maxHeight: "160px" }}
      >
        {/* 外枠 */}
        <rect
          x="0"
          y="0"
          width="160"
          height="120"
          fill="white"
          stroke="#94a3b8"
          strokeWidth="2"
          rx="2"
        />

        {/* 各部屋 */}
        {rooms.map((room, i) => (
          <g key={i}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              fill={room.fill}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + (room.fontSize ?? 11) * 0.35}
              textAnchor="middle"
              fontSize={room.fontSize ?? 11}
              fill="#475569"
              fontWeight="500"
            >
              {room.label}
            </text>
          </g>
        ))}

        {/* バルコニー（上部に表示） */}
        <rect
          x="10"
          y="-12"
          width="140"
          height="12"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4,2"
          rx="1"
        />
        <text
          x="80"
          y="-3"
          textAnchor="middle"
          fontSize="8"
          fill="#94a3b8"
        >
          バルコニー
        </text>

        {/* 方角コンパス */}
        <g transform="translate(180, 20)">
          <circle cx="0" cy="0" r="16" fill="white" stroke="#cbd5e1" strokeWidth="1" />
          <g transform={`rotate(${arrow.rotation}, 0, 0)`}>
            <polygon
              points="0,-12 -4,-2 0,-5 4,-2"
              fill="#ef4444"
            />
            <polygon
              points="0,12 -4,2 0,5 4,2"
              fill="#cbd5e1"
            />
          </g>
          <text x="0" y="-17" textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="600">
            N
          </text>
        </g>

        {/* 面積表示 */}
        <text
          x="180"
          y="55"
          textAnchor="middle"
          fontSize="9"
          fill="#64748b"
        >
          {area}m²
        </text>

        {/* 間取りタイプ */}
        <text
          x="180"
          y="70"
          textAnchor="middle"
          fontSize="10"
          fill="#334155"
          fontWeight="bold"
        >
          {layout}
        </text>
      </svg>
    </div>
  );
}
