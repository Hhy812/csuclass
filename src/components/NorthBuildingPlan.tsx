// NorthBuildingPlan.tsx

import { toast } from 'sonner';
import { NORTH_FLOOR_DATA } from '../data/floorPlanData';

interface Props {
    floor: number;
    statuses: Record<string, 'free' | 'occupied' | 'unknown'>;
}
// NorthBuildingPlan.tsx 
export function NorthBuildingPlan({ floor, statuses }: Props) {
    const data = NORTH_FLOOR_DATA[floor];
    if (!data) return (
        <div className="flex items-center justify-center h-48 text-slate-400
                    border-2 border-dashed rounded-lg">
            暂无北楼 {floor} 层数据
        </div>
    );

    const handleClick = (id: string) => {
        const s = statuses[id];
        if (s === 'free') toast.success(`${id} 空闲`);
        else if (s === 'occupied') toast.error(`${id} 占用`);
        else toast.info(`${id} 状态未知`);
    };

    const allRooms = [...data.northRow, ...data.southRow];

    return (
        <svg viewBox="0 0 720 260"
            className="w-full bg-slate-50 rounded-lg border border-slate-200">

            <text x="360" y="18" textAnchor="middle"
                className="fill-slate-700 font-bold text-sm">
                科教楼北楼 {floor} 层
            </text>

            {/* 走廊 */}
            <rect x="15" y="100" width="690" height="50"
                fill="#e2e8f0" opacity="0.5" rx="3" />
            <text x="360" y="130" textAnchor="middle"
                className="fill-slate-400" fontSize="11">走廊</text>

            {/* 方向标 */}
            <text x="360" y="45" textAnchor="middle" className="fill-slate-300" fontSize="10">北</text>
            <text x="360" y="235" textAnchor="middle" className="fill-slate-300" fontSize="10">南</text>

            {allRooms.map((room) => {
                const isFree = statuses[room.id] === 'free';
                const isOcc = statuses[room.id] === 'occupied';
                return (
                    <g key={room.id}
                        transform={`translate(${room.x}, ${room.y})`}
                        onClick={() => handleClick(room.id)}
                        style={{ cursor: 'pointer' }}>
                        <rect width={room.w} height={room.h} rx="4"
                            className={`
                ${isFree ? 'fill-emerald-500' : isOcc ? 'fill-rose-500' : 'fill-slate-400'}
                hover:opacity-75 transition-opacity
              `}
                            stroke="white" strokeWidth="2" />
                        <text x={room.w / 2} y={room.h / 2 + 4}
                            textAnchor="middle"
                            className="fill-white font-bold"
                            fontSize="11">
                            {room.id}
                        </text>
                    </g>
                );
            })}

            {/* 图例 */}
            <g transform="translate(20, 240)">
                <rect width="12" height="12" className="fill-emerald-500" rx="2" />
                <text x="17" y="10" className="fill-slate-500" fontSize="10">空闲</text>
                <rect x="55" width="12" height="12" className="fill-rose-500" rx="2" />
                <text x="72" y="10" className="fill-slate-500" fontSize="10">占用</text>
                <rect x="110" width="12" height="12" className="fill-slate-400" rx="2" />
                <text x="127" y="10" className="fill-slate-500" fontSize="10">未知</text>
            </g>
        </svg>
    );
}