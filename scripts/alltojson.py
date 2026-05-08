import pandas as pd
import re
import json
from collections import defaultdict
from itertools import product

df = pd.read_excel('./hhy.xlsx', header=0)
df = df[df['上课地点'].apply(lambda x: isinstance(x, str) and bool(
    re.search(r'\d{3,}', x)))].reset_index(drop=True)
df['开课时间'] = df['开课时间'].astype(str)

DAYS = ['周一', '周二', '周三', '周四', '周五']
ALL_SLOTS = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节']
CTIME_MAP = {'0102': '1-2节', '0304': '3-4节',
             '0506': '5-6节', '0708': '7-8节', '0910': '9-10节'}


def parse_location(location):
    """
    拆分楼栋名和房间号，返回 (building, room_id, room_key)
    A座102 -> ('A', '102', 'A102')
    科教北301 -> ('科教北', '301', '科教北301')
    101教室 -> ('教室', '101', '教室101')
    """
    # ABCD座 单独处理，去掉"座"，保持 A102 格式
    m_abcd = re.match(r'^([A-D])座(\d+)', location)
    if m_abcd:
        building = m_abcd.group(1)
        room_id = m_abcd.group(2)
        return building, room_id, building + room_id

    # 普通格式：非数字前缀 + 数字房间号
    m = re.match(r'^(.*?)(\d+)', location)
    if not m:
        return None, None, None

    room_id = m.group(2)
    if m.group(1):
        building = m.group(1)
    else:
        # 101教室 这种数字在前的，取后缀汉字作为楼栋名
        suffix = re.search(r'[^\d]+$', location)
        building = suffix.group() if suffix else '未知楼栋'

    return building, room_id, building + room_id


def parse_weeks(week_range, odd_even):
    step = 2 if odd_even in ('单周', '双周') else 1
    result = []
    for part in str(week_range).split(','):
        if '-' in part:
            a, b = part.split('-')
            result.extend(range(int(a), int(b) + 1, step))
        else:
            result.append(int(part))
    return result


def get_slots(time_str):
    t, result = time_str, []
    while len(t) >= 4:
        code = t[:4]
        if code in CTIME_MAP:
            result.append(CTIME_MAP[code])
        t = t[4:]
    return result


# schedule[room_key][week][day][slot] = 'occupied'
schedule = defaultdict(lambda: defaultdict(
    lambda: defaultdict(lambda: defaultdict(lambda: 'free'))))

for _, row in df.iterrows():
    building, room_id, room_key = parse_location(row['上课地点'])
    if not room_key:
        continue

    time_str = row['开课时间']
    day_char = time_str[0]
    if day_char not in '12345':
        continue

    day = DAYS[int(day_char) - 1]
    slots = get_slots(time_str[1:])
    weeks = parse_weeks(row['上课周次'], row['单双周'])

    for week, slot in product(weeks, slots):
        schedule[room_key][week][day][slot] = 'occupied'


def full_schedule(room_schedule):
    return {
        week: {
            day: {slot: room_schedule[week][day][slot] for slot in ALL_SLOTS}
            for day in DAYS
        }
        for week in range(1, 19)
    }


classrooms_sorted = sorted(schedule.keys())
buildings = defaultdict(lambda: defaultdict(list))
result_classrooms = {}

for room_key in classrooms_sorted:
    building, room_id, _ = parse_location(room_key)
    floor = room_id[0] if room_id else '?'
    result_classrooms[room_key] = {
        'building': building,
        'floor': floor,
        'schedule': full_schedule(schedule[room_key])
    }
    buildings[building][floor].append(room_key)

result_buildings = {
    b: dict(sorted(floors.items()))
    for b, floors in sorted(buildings.items())
}

result = {'classrooms': result_classrooms, 'buildings': result_buildings}

with open('./hhy_all.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=4)

print(f'共处理 {len(result_classrooms)} 间教室，{len(result_buildings)} 栋楼')
print('楼栋列表:', list(result_buildings.keys()))
