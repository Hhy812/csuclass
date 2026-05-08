import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Classroom } from '@/types/classroom';
import { resolveClassroomStatus } from '@/lib/classroom-status';

interface SearchBarProps {
  selectedWeek: number;
  selectedDay: string;
  selectedTimeSlots: string[];
  classroomData: Record<string, Classroom>;
}

interface SearchResult {
  classroom: string;
  building: string;
  floor: number;
  status: 'free' | 'occupied';
}

export function SearchBar({
  selectedWeek,
  selectedDay,
  selectedTimeSlots,
  classroomData,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('请输入教室号');
      return;
    }

    const query = searchQuery.trim().toUpperCase();
    const results: SearchResult[] = [];

    // 直接从 props 搜索，不需要 fetch
    Object.entries(classroomData).forEach(([classroom, info]) => {
      if (classroom.includes(query)) {
        const status = resolveClassroomStatus(info, selectedWeek, selectedDay, selectedTimeSlots);
        results.push({
          classroom,
          building: info.building,
          floor: info.floor,
          status: status === 'free' ? 'free' : 'occupied',
        });
      }
    });

    setSearchResults(results);
    setSearchPerformed(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-slate-200 hover:border-emerald-300">
          <Search className="w-4 h-4" />
          搜索教室
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>搜索教室</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="输入教室号（如 A101、B202）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600">
              搜索
            </Button>
          </div>

          {/* Search Context */}
          <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            <span>查询条件:</span>
            <Badge variant="outline" className="text-xs">
              第{selectedWeek}周
            </Badge>
            <Badge variant="outline" className="text-xs">
              {selectedDay}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {selectedTimeSlots.join('/')}
            </Badge>
          </div>

          {/* No results notice */}
          {searchPerformed && searchResults.length === 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              未找到匹配的教室，请检查输入是否正确或更换查询条件。
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0 bg-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">教室号</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">位置</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {searchResults.map((result) => (
                      <tr key={result.classroom} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{result.classroom}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {result.building}座 {result.floor}楼
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              result.status === 'free'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                            }
                          >
                            {result.status === 'free' ? '空闲' : '占用'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Tips */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">搜索提示</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• 输入教室号如 &quot;A101&quot; 可精确搜索</li>
              <li>• 输入 &quot;A&quot; 可搜索 A 座所有教室</li>
              <li>• 输入 &quot;1&quot; 可搜索所有 1 楼教室</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
