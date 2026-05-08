import type { Classroom } from '@/types/classroom';

export type ClassroomStatus = 'free' | 'occupied' | 'unknown';

export interface FloorStats {
  total: number;
  free: number;
  occupied: number;
  freeRate: number;
}

export function resolveClassroomStatus(
  classroom: Classroom | undefined,
  week: number,
  day: string,
  timeSlots: string[],
): ClassroomStatus {
  if (!classroom) return 'unknown';
  const isFree = timeSlots.every((slot) => classroom.schedule?.[week]?.[day]?.[slot] === 'free');
  return isFree ? 'free' : 'occupied';
}

export function buildFloorStatuses(
  classrooms: string[],
  classroomData: Record<string, Classroom>,
  week: number,
  day: string,
  timeSlots: string[],
): Record<string, ClassroomStatus> {
  const statuses: Record<string, ClassroomStatus> = {};
  for (const classroom of classrooms) {
    statuses[classroom] = resolveClassroomStatus(classroomData[classroom], week, day, timeSlots);
  }
  return statuses;
}

export function calculateStatsFromStatuses(statuses: Record<string, ClassroomStatus>): FloorStats {
  const values = Object.values(statuses);
  if (values.length === 0) {
    return { total: 0, free: 0, occupied: 0, freeRate: 0 };
  }

  let free = 0;
  for (const status of values) {
    if (status === 'free') free++;
  }

  const total = values.length;
  const occupied = total - free;
  return {
    total,
    free,
    occupied,
    freeRate: Math.round((free / total) * 100),
  };
}
