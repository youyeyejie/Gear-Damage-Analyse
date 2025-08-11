import datetime
import time
import math
import re

def num_to_chinese(num_str):
    """将数字字符串转换为中文数字表示"""
    chinese_digits = {
        '0': '零',
        '1': '一',
        '2': '二',
        '3': '三',
        '4': '四',
        '5': '五',
        '6': '六',
        '7': '七',
        '8': '八',
        '9': '九',
        '.': '点',
        '-': '负'
    }
    
    result = ""
    for char in num_str:
        result += chinese_digits.get(char, char)
    return result

def calculate_time_difference():

    start_time = datetime.datetime(2025, 8, 6, 9, 30, 0)
    current_time = datetime.datetime.now()
    time_diff_days = (current_time - start_time).total_seconds() / (24 * 60 * 60)
    time_diff_days = round(time_diff_days, 4)
    months = time_diff_days * 3
    months = round(months, 4)
    days_str = f"{time_diff_days:.4f}"
    months_str = f"{months:.4f}"
    
    # 处理前导零和负号
    # 对于负数，保留负号；对于正数，移除前导零
    if time_diff_days < 0:
        days_str = f"{time_diff_days:.4f}"  # 保留负号
    else:
        days_str = re.sub(r'^0', '', days_str)  # 移除前导零
        
    if months < 0:
        months_str = f"{months:.4f}"  # 保留负号
    else:
        months_str = re.sub(r'^0', '', months_str)  # 移除前导零
    
    # 转换为中文数字
    chinese_days = num_to_chinese(days_str)
    chinese_months = num_to_chinese(months_str)
    
    # 输出结果
    result = f"{chinese_days}日不见，如{chinese_months}月兮！"
    return result

def main():
    # 计算并输出时间差
    result = calculate_time_difference()
    print(result)
    
    # 显示计算是基于什么时间的
    current_time = datetime.datetime.now()
    # print(f"\n计算基于:")
    # print(f"起始时间: 2025年8月7日 9点30分")
    # print(f"当前时间: {current_time.strftime('%Y年%m月%d日 %H点%M分%S秒')}")

if __name__ == "__main__":
    main()
