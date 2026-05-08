import { useState, useEffect, useMemo, useRef } from 'react';
import type { Building, Classroom } from './types/classroom';
import { Sidebar } from './components/Sidebar';
import { FloorView } from './components/FloorView';
import { SearchBar } from './components/SearchBar';
import { StatsPanel } from './components/StatsPanel';
import { buildFloorStatuses, calculateStatsFromStatuses } from '@/lib/classroom-status';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const BASE_URL = import.meta.env.BASE_URL || '/';

function withBase(relativePath: string): string {
  return `${BASE_URL}${relativePath.replace(/^\/+/, '')}`;
}

// 安全读取 localStorage
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// 从 URL 参数读取偏好
function getUrlPrefs() {
  const params = new URLSearchParams(window.location.search);
  const b = params.get('b');
  const f = params.get('f');
  const w = params.get('w');
  const d = params.get('d');
  const s = params.get('s');
  if (!b && !f && !w && !d && !s) return null;
  return {
    building: b || undefined,
    floor: f ? Number(f) : undefined,
    week: w ? Number(w) : undefined,
    day: d || undefined,
    slots: s ? s.split(',').filter(Boolean) : undefined,
  };
}

interface UserPrefs {
  building: string;
  floor: number;
  week: number;
  day: string;
  slots: string[];
}

function App() {
  const [buildings, setBuildings] = useState<Record<string, Building>>({});
  const [classroomData, setClassroomData] = useState<Record<string, Classroom>>({});
  const [selectedBuilding, setSelectedBuilding] = useState<string>('A');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<string>('周一');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>(['1-2节']);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initialized = useRef(false);

  // 防扒代码
  useEffect(() => {
    const preventDevTools = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof MouseEvent && e.type === 'contextmenu') {
        e.preventDefault();
      }
      if (e instanceof KeyboardEvent) {
        if (
          e.keyCode === 123 ||
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
          (e.ctrlKey && e.keyCode === 85)
        ) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('contextmenu', preventDevTools);
    document.addEventListener('keydown', preventDevTools);
    return () => {
      document.removeEventListener('contextmenu', preventDevTools);
      document.removeEventListener('keydown', preventDevTools);
    };
  }, []);

  // 状态改变时：localStorage + URL 参数双重保存（静态版）
  useEffect(() => {
    if (!initialized.current) return;

    // 1. 写 localStorage
    safeSetItem('csu_selected_building', selectedBuilding);
    safeSetItem('csu_selected_floor', selectedFloor.toString());
    safeSetItem('csu_selected_week', selectedWeek.toString());
    safeSetItem('csu_selected_day', selectedDay);
    safeSetItem('csu_selected_slots', JSON.stringify(selectedTimeSlots));

    // 2. 更新 URL 参数（不触发页面刷新，QQ WebView 会记住最后的 URL）
    const params = new URLSearchParams();
    params.set('b', selectedBuilding);
    params.set('f', selectedFloor.toString());
    params.set('w', selectedWeek.toString());
    params.set('d', selectedDay);
    params.set('s', selectedTimeSlots.join(','));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedBuilding, selectedFloor, selectedWeek, selectedDay, selectedTimeSlots]);

  // 加载数据 + 恢复偏好
  useEffect(() => {
    fetch(withBase('classroom_data.json'))
      .then((r) => r.json())
      .then((data) => {
      setBuildings(data.buildings);
      setClassroomData(data.classrooms || {});

      // 读取 URL 参数（最高优先级）
      const urlPrefs = getUrlPrefs();

      // 读取 localStorage
      const localPrefs: UserPrefs = {
        building: safeGetItem('csu_selected_building') || 'A',
        floor: Number(safeGetItem('csu_selected_floor')) || 1,
        week: Number(safeGetItem('csu_selected_week')) || 1,
        day: safeGetItem('csu_selected_day') || '周一',
        slots: (() => { try { const s = safeGetItem('csu_selected_slots'); return s ? JSON.parse(s) : ['1-2节']; } catch { return ['1-2节']; } })(),
      };

      // 优先级：URL 参数 > localStorage > 默认值
      const prefs: UserPrefs = {
        building: urlPrefs?.building || localPrefs.building,
        floor: urlPrefs?.floor || localPrefs.floor,
        week: urlPrefs?.week || localPrefs.week,
        day: urlPrefs?.day || localPrefs.day,
        slots: urlPrefs?.slots || localPrefs.slots,
      };

      const buildingKeys = Object.keys(data.buildings);
      if (buildingKeys.length > 0) {
        if (prefs.building && data.buildings[prefs.building]) {
          setSelectedBuilding(prefs.building);
          const floors = Object.keys(data.buildings[prefs.building]).map(Number);
          if (prefs.floor && floors.includes(prefs.floor)) {
            setSelectedFloor(prefs.floor);
          } else {
            setSelectedFloor(floors.sort((a, b) => a - b)[0]);
          }
        } else {
          const firstBuilding = buildingKeys.sort()[0];
          setSelectedBuilding(firstBuilding);
          const floors = Object.keys(data.buildings[firstBuilding]).map(Number).sort((a, b) => a - b);
          if (floors.length > 0) setSelectedFloor(floors[0]);
        }
        setSelectedWeek(prefs.week || 1);
        setSelectedDay(prefs.day || '周一');
        const normalizedSlots = prefs.slots && prefs.slots.length > 0 ? prefs.slots : ['1-2节'];
        setSelectedTimeSlots(normalizedSlots);
      }

      initialized.current = true;
      setLoading(false);
    })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  const currentClassrooms = useMemo(
    () => buildings[selectedBuilding]?.[selectedFloor] || [],
    [buildings, selectedBuilding, selectedFloor],
  );

  const floorStatuses = useMemo(
    () => buildFloorStatuses(currentClassrooms, classroomData, selectedWeek, selectedDay, selectedTimeSlots),
    [currentClassrooms, classroomData, selectedWeek, selectedDay, selectedTimeSlots],
  );

  const floorStats = useMemo(
    () => calculateStatsFromStatuses(floorStatuses),
    [floorStatuses],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">加载教室数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <Toaster />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          selectedWeek={selectedWeek}
          selectedDay={selectedDay}
          selectedTimeSlots={selectedTimeSlots}
          onBuildingChange={(building) => {
            setSelectedBuilding(building);
            const floors = buildings[building]
              ? Object.keys(buildings[building]).map(Number).sort((a, b) => a - b)
              : [];
            if (floors.length > 0) setSelectedFloor(floors[0]);
          }}
          onFloorChange={setSelectedFloor}
          onWeekChange={setSelectedWeek}
          onDayChange={setSelectedDay}
          onTimeSlotsChange={setSelectedTimeSlots}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 max-h-screen overflow-hidden">
          <Sidebar
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            selectedTimeSlots={selectedTimeSlots}
            onBuildingChange={(building) => {
              setSelectedBuilding(building);
              setSidebarOpen(false);
            }}
            onFloorChange={(floor) => {
              setSelectedFloor(floor);
              setSidebarOpen(false);
            }}
            onWeekChange={setSelectedWeek}
            onDayChange={setSelectedDay}
            onTimeSlotsChange={setSelectedTimeSlots}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              <div>
                <h1 className="text-2xl font-bold text-slate-800">中南大学空闲教室查询系统</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedBuilding}座 {selectedFloor}楼 | 第{selectedWeek}周 {selectedDay} {selectedTimeSlots.join('/')}
                </p>
              </div>
            </div>
            <SearchBar
              selectedWeek={selectedWeek}
              selectedDay={selectedDay}
              selectedTimeSlots={selectedTimeSlots}
              classroomData={classroomData}
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <FloorView
              building={selectedBuilding}
              floor={selectedFloor}
              week={selectedWeek}
              day={selectedDay}
              timeSlots={selectedTimeSlots}
              classrooms={currentClassrooms}
              statuses={floorStatuses}
              freeCount={floorStats.free}
              occupiedCount={floorStats.occupied}
            />
          </div>
        </main>

        <StatsPanel
          stats={floorStats}
        />
      </div>
    </div>
  );
}

export default App;
