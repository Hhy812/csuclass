export interface ClassroomSchedule {
  [week: number]: {
    [day: string]: {
      [timeSlot: string]: 'free' | 'occupied';
    };
  };
}

export interface Classroom {
  building: string;
  floor: number;
  schedule: ClassroomSchedule;
}

export interface Building {
  [floor: number]: string[];
}

export interface FloorPlan {
  building: string;
  floor: number;
  classrooms: string[];
}

export const DAYS = ['周一', '周二', '周三', '周四', '周五'];
export const TIME_SLOTS = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节'];
export const WEEKS = Array.from({ length: 16 }, (_, i) => i + 1);
