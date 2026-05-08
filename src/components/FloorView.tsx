import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HelpCircle, MapPin } from 'lucide-react';
import { FloorPlanSVG } from './FloorPlanSVG';
import type { ClassroomStatus } from '@/lib/classroom-status';

interface FloorViewProps {
  building: string;
  floor: number;
  week: number;
  day: string;
  timeSlots: string[];
  classrooms: string[];
  statuses: Record<string, ClassroomStatus>;
  freeCount: number;
  occupiedCount: number;
}

export function FloorView({
  building,
  floor,
  week,
  day,
  timeSlots,
  classrooms,
  statuses,
  freeCount,
  occupiedCount,
}: FloorViewProps) {
  const handleClassroomClick = (classroom: string) => {
    const status = statuses[classroom];
    if (status === 'free') {
      toast.success(`${classroom} 教室空闲`, {
        description: `第${week}周 ${day} ${timeSlots.join('/')}`,
      });
    } else if (status === 'occupied') {
      toast.error(`${classroom} 教室占用`, {
        description: `第${week}周 ${day} ${timeSlots.join('/')}`,
      });
    } else {
      toast.info(`${classroom} 状态未知`);
    }
  };

  if (classrooms.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-12">
          <div className="text-center text-slate-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>该楼层暂无教室数据</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-800">
            {building}座 {floor}楼 教室分布图
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            空闲 {freeCount}间
          </Badge>
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1">
            <XCircle className="w-4 h-4 mr-1" />
            占用 {occupiedCount}间
          </Badge>
        </div>
      </div>

      {/* SVG Floor Plan */}
      <Card className="w-full overflow-hidden border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <div
            className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white"
            style={{ cursor: 'default' }}
          >
            <FloorPlanSVG
              building={building}
              floor={floor}
              statuses={statuses}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick List View */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">教室列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {classrooms.map((classroom) => {
              const status = statuses[classroom] || 'unknown';
              return (
                <button
                  key={classroom}
                  onClick={() => handleClassroomClick(classroom)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${status === 'free'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : status === 'occupied'
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-slate-100 text-slate-500'
                    }
                  `}
                >
                  {classroom}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">图例说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald-500 shadow-sm flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">空闲教室</p>
                <p className="text-xs text-slate-500">当前时间段可用</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-rose-500 shadow-sm flex items-center justify-center">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">占用教室</p>
                <p className="text-xs text-slate-500">当前时间段有课</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-300 shadow-sm flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">状态未知</p>
                <p className="text-xs text-slate-500">暂无数据</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
