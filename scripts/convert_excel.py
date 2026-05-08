#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中南大学空闲教室数据转换脚本
将Excel格式的空闲教室数据转换为JSON格式

使用方法:
    python convert_excel.py <输入Excel文件> [输出JSON文件]
    
示例:
    python convert_excel.py 2025春季空闲教室.xlsx classroom_data.json
"""

import pandas as pd
import json
import sys
from collections import defaultdict


def convert_excel_to_json(excel_path: str, output_path: str = 'classroom_data.json') -> dict:
    """
    将空闲教室Excel转换为JSON格式

    Excel格式要求：
    - 每个周一个Sheet，命名为"第1周"、"第2周"等
    - 每行是一个时间段（1-2节、3-4节、5-6节、7-8节、9-10节）
    - 每列是一个星期（周一、周二、周三、周四、周五）
    - 单元格内容是空闲教室列表，空格分隔
    """

    print(f"正在读取Excel文件: {excel_path}")
    xl = pd.ExcelFile(excel_path)

    classroom_data = {
        'classrooms': defaultdict(lambda: {
            'building': '',
            'floor': 0,
            'schedule': defaultdict(lambda: defaultdict(dict))
        }),
        'buildings': defaultdict(lambda: defaultdict(list))
    }

    days = ['周一', '周二', '周三', '周四', '周五']
    time_slots = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节']

    total_weeks = len(xl.sheet_names)
    print(f"发现 {total_weeks} 个周的数据")

    for sheet_idx, sheet_name in enumerate(xl.sheet_names, 1):
        print(f"处理 {sheet_name}... ({sheet_idx}/{total_weeks})")

        try:
            week_num = int(sheet_name.replace('第', '').replace('周', ''))
        except ValueError:
            print(f"  跳过Sheet: {sheet_name} (名称格式不正确)")
            continue

        df = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)

        for col_idx in range(1, 6):  # 周一到周五
            day = days[col_idx - 1]
            for row_idx in range(2, 7):  # 5个时间段
                time_slot = time_slots[row_idx - 2]

                try:
                    cell_value = df.iloc[row_idx, col_idx]
                except IndexError:
                    continue

                if pd.notna(cell_value):
                    classrooms = str(cell_value).strip().split()

                    for classroom in classrooms:
                        classroom = classroom.strip().upper()
                        if len(classroom) >= 3:
                            # 解析教学楼和楼层
                            building = classroom[0] if classroom[0] in 'ABCD' else 'other'
                            try:
                                floor = int(classroom[1])
                            except (ValueError, IndexError):
                                floor = 1

                            # 更新数据
                            classroom_data['classrooms'][classroom]['building'] = building
                            classroom_data['classrooms'][classroom]['floor'] = floor
                            classroom_data['classrooms'][classroom]['schedule'][str(
                                week_num)][day][time_slot] = 'free'

                            # 更新楼层索引
                            if classroom not in classroom_data['buildings'][building][str(floor)]:
                                classroom_data['buildings'][building][str(
                                    floor)].append(classroom)

    # 转换为普通dict
    result = {
        'classrooms': dict(classroom_data['classrooms']),
        'buildings': {k: dict(v) for k, v in classroom_data['buildings'].items()}
    }

    # 排序教室列表
    for building in result['buildings']:
        for floor in result['buildings'][building]:
            result['buildings'][building][floor] = sorted(
                result['buildings'][building][floor])

    # 保存JSON文件
    print(f"\n正在保存到: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # 统计信息
    total_classrooms = len(result['classrooms'])
    building_stats = {b: len(v) for b, v in result['buildings'].items()}

    print(f"\n✅ 转换完成!")
    print(f"   - 总教室数: {total_classrooms}")
    print(f"   - 教学楼分布:")
    for building, count in sorted(building_stats.items()):
        floors = len(result['buildings'][building])
        print(f"     {building}座: {count}间教室 ({floors}个楼层)")

    return result


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\n❌ 错误: 请提供输入Excel文件路径")
        sys.exit(1)

    excel_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'classroom_data.json'

    try:
        convert_excel_to_json(excel_path, output_path)
    except FileNotFoundError:
        print(f"\n❌ 错误: 找不到文件 '{excel_path}'")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
