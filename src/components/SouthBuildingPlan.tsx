// SouthBuildingPlan.tsx
import { toast } from 'sonner';
import { SOUTH_FLOOR_DATA } from '../data/floorPlanData';
import type { RoomRect } from '../data/floorPlanData';

interface Props {
    floor: number;
    statuses: Record<string, 'free' | 'occupied' | 'unknown'>;
}

export function SouthBuildingPlan({ floor, statuses }: Props) {
    const rooms = SOUTH_FLOOR_DATA[floor];

    if (!rooms) return (
        <div className="flex items-center justify-center h-48 text-slate-400
                    border-2 border-dashed rounded-lg">
            暂无南楼 {floor} 层数据
        </div>
    );

    if (rooms.length === 0) return (
        <div className="flex items-center justify-center h-48 text-slate-400
                    border-2 border-dashed rounded-lg">
            {floor} 层南楼无普通教室
        </div>
    );

    const handleClick = (id: string) => {
        const s = statuses[id];
        if (s === 'free') toast.success(`${id} 空闲`);
        else if (s === 'occupied') toast.error(`${id} 占用`);
        else toast.info(`${id} 状态未知`);
    };

    return (
        <svg viewBox="0 0 760 300"
            className="w-full bg-slate-50 rounded-lg border border-slate-200">

            <text x="380" y="18" textAnchor="middle"
                className="fill-slate-700 font-bold text-sm">
                科教楼南楼 {floor} 层
            </text>

            {rooms.map((room: RoomRect) => {
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
            <g transform="translate(20, 278)">
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