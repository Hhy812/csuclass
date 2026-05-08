import { useEffect, useState } from 'react';
import { Building2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DAYS, TIME_SLOTS, WEEKS } from '@/types/classroom';

interface SidebarProps {
  buildings: Record<string, { [floor: number]: string[] }>;
  selectedBuilding: string;
  selectedFloor: number;
  selectedWeek: number;
  selectedDay: string;
  selectedTimeSlots: string[];
  onBuildingChange: (building: string) => void;
  onFloorChange: (floor: number) => void;
  onWeekChange: (week: number) => void;
  onDayChange: (day: string) => void;
  onTimeSlotsChange: (timeSlots: string[]) => void;
}

export function Sidebar({
  buildings,
  selectedBuilding,
  selectedFloor,
  selectedWeek,
  selectedDay,
  selectedTimeSlots,
  onBuildingChange,
  onFloorChange,
  onWeekChange,
  onDayChange,
  onTimeSlotsChange,
}: SidebarProps) {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [todayUv, setTodayUv] = useState<number>(0);

  useEffect(() => {
    // 静态版：使用本地浏览器计数（仅当前浏览器）
    const totalKey = 'csu_static_total_pv';
    const dailyKey = 'csu_static_daily_pv_map';
    const today = new Date().toISOString().slice(0, 10);

    let total = 0;
    let dailyMap: Record<string, number> = {};

    try {
      total = Number(localStorage.getItem(totalKey) || 0);
      const raw = localStorage.getItem(dailyKey);
      dailyMap = raw ? JSON.parse(raw) : {};
    } catch {
      total = 0;
      dailyMap = {};
    }

    total += 1;
    dailyMap[today] = (dailyMap[today] || 0) + 1;

    try {
      localStorage.setItem(totalKey, String(total));
      localStorage.setItem(dailyKey, JSON.stringify(dailyMap));
    } catch {
      // ignore
    }

    setVisitorCount(total);
    setTodayUv(dailyMap[today]);
  }, []);

  const buildingList = Object.keys(buildings).sort();
  const floors = buildings[selectedBuilding]
    ? Object.keys(buildings[selectedBuilding]).map(Number).sort((a, b) => a - b)
    : [];

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg h-full">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">教室查询</h2>
            <p className="text-xs text-emerald-100">中南大学</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Building Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              选择教学楼
            </label>
            <Select value={selectedBuilding} onValueChange={(value) => {
              onBuildingChange(value);
            }}>
              <SelectTrigger className="w-full border-slate-200 focus:ring-emerald-500">
                <SelectValue placeholder="选择教学楼" />
              </SelectTrigger>
              <SelectContent>
                {buildingList.map((building) => (
                  <SelectItem key={building} value={building}>
                    {building}座
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Floor Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              选择楼层
            </label>
            <div className="flex flex-wrap gap-2">
              {floors.map((floor) => (
                <Button
                  key={floor}
                  variant={selectedFloor === floor ? 'default' : 'outline'}
                  className={`h-10 ${selectedFloor === floor
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  onClick={() => onFloorChange(floor)}
                >
                  {floor}F
                </Button>
              ))}
            </div>
          </div>

          {/* Week Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              选择周数
            </label>
            <Select
              value={selectedWeek.toString()}
              onValueChange={(value) => onWeekChange(Number(value))}
            >
              <SelectTrigger className="w-full border-slate-200 focus:ring-emerald-500">
                <SelectValue placeholder="选择周数" />
              </SelectTrigger>
              <SelectContent>
                {WEEKS.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    第{week}周
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              选择星期
            </label>
            <div className="grid grid-cols-5 gap-1">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  size="sm"
                  className={`text-xs ${selectedDay === day
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  onClick={() => onDayChange(day)}
                >
                  {day.slice(0, 2)}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              选择节次（可多选）
            </label>
            <div className="space-y-2">
              {TIME_SLOTS.map((timeSlot) => (
                <Button
                  key={timeSlot}
                  variant={selectedTimeSlots.includes(timeSlot) ? 'default' : 'outline'}
                  className={`w-full justify-start ${selectedTimeSlots.includes(timeSlot)
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    }`}
                  onClick={() => {
                    if (selectedTimeSlots.includes(timeSlot)) {
                      if (selectedTimeSlots.length <= 1) {
                        toast.info('至少保留一个节次');
                        return;
                      }
                      onTimeSlotsChange(selectedTimeSlots.filter(t => t !== timeSlot));
                    } else {
                      onTimeSlotsChange([...selectedTimeSlots, timeSlot]);
                    }
                  }}
                >
                  {timeSlot}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>空闲</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-rose-500"></div>
            <span>占用</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-300"></div>
            <span>无数据</span>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
          <div>
            本机累计访问：
            <span className="font-medium text-slate-700">{visitorCount}</span>
          </div>
          <div>
            本机今日访问：
            <span className="font-medium text-slate-700">{todayUv}</span>
          </div>
          <div className="text-xs leading-tight">
            联系方式：
            <a
              href="mailto:your@email.com"
              className="text-emerald-600 hover:underline block sm:inline"
            >
              Breakvex@gmail.com
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
