import torch
import os
import sys
import subprocess
import matplotlib.pyplot as plt
import cv2
import numpy as np
import glob
import shutil

# 定义类型名
class_names = ['Abrasion', 'Peeling', 'Scuffing', 'Pitting']

def predict(weight_dir, img_dir):

    '''使用保存的参数进行探测'''
    yolo_detect_dir = './gear_fault_yolo/yolov5/detect.py'

    print("=" * 25, '\tin','\033[3;34mpredict.py\033[0m\t', '=' * 25,'\n')

    cmd = f'python "{yolo_detect_dir}" --weights "{weight_dir}" --source "{img_dir}" --save-txt '
    os.system(cmd)

def find_latest_exp_folder():
    exp_folders = sorted(glob.glob("./gear_fault_yolo/yolov5/runs/detect/exp*"))
    if not exp_folders:
        print("未找到实验文件夹")
        return None
    
    return exp_folders[-1]

def move_files_to_cache(exp_folder):
    cache_folder = "./gear_fault_yolo/cache"
    if not os.path.exists(cache_folder):
        os.makedirs(cache_folder)
    
    # 移动图片文件
    image_files = glob.glob(f"{exp_folder}/*.jpg") + glob.glob(f"{exp_folder}/*.png")
    for img_file in image_files:
        shutil.copy(img_file, cache_folder)
    
    # 移动标签文件
    label_folder = os.path.join(exp_folder, "labels")
    if os.path.exists(label_folder):
        label_files = glob.glob(f"{label_folder}/*.txt")
        for label_file in label_files:
            shutil.copy(label_file, cache_folder)
    
    return cache_folder

def move_files_to_data(cache_folder, project_folder):

    if not os.path.exists(project_folder):
        os.makedirs(project_folder)
        
    for file in os.listdir(cache_folder):
        src = os.path.join(cache_folder, file)
        dst = os.path.join(project_folder, file)
        shutil.copy(src, dst)
        
    return project_folder

def visualize_detection(cache_folder):
    """可视化检测结果"""
    # 定义损伤类别名称
    class_names = ['Abrasion', 'Peeling', 'Scuffing', 'Pitting']
    # 定义颜色映射
    colors = ['red', 'green', 'blue', 'purple']
    
    image_files = [f for f in os.listdir(cache_folder) 
                  if f.endswith(('.jpg', '.jpeg', '.png')) and not f.endswith('_visualized.jpg') 
                  and not f.endswith('_surface.txt')]
    
    for img_file in image_files:
        # 获取对应的标签文件
        base_name = os.path.splitext(img_file)[0]
        label_file = os.path.join(cache_folder, f"{base_name}.txt")
        
        img_path = os.path.join(cache_folder, img_file)
        if not os.path.exists(label_file):
            print(f"未找到标签文件: {label_file}")
            continue
        
        # 读取图像
        img = cv2.imread(img_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        height, width, _ = img.shape
        
        # 创建matplotlib图形
        plt.figure(figsize=(12, 8))
        plt.imshow(img)
        
        # 读取标签并绘制边界框
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        for line in lines:
            data = line.strip().split()
            if len(data) >= 5:
                class_id = int(data[0])
                x_center = float(data[1]) * width
                y_center = float(data[2]) * height
                box_width = float(data[3]) * width
                box_height = float(data[4]) * height
                
                # 计算边界框坐标
                x1 = x_center - box_width / 2
                y1 = y_center - box_height / 2
                
                # 绘制边界框和标签
                rect = plt.Rectangle((x1, y1), box_width, box_height, 
                                     linewidth=2, edgecolor=colors[class_id], facecolor='none')
                plt.gca().add_patch(rect)
                
                # 添加标签
                class_name = class_names[class_id] if class_id < len(class_names) else f"Class {class_id}"
                plt.text(x1, y1-5, class_name, color='white', 
                         bbox=dict(facecolor=colors[class_id], alpha=0.7))
        
        # 保存可视化结果
        plt.axis('off')
        plt.title(f"Detection Results: {img_file}")
        vis_file = os.path.join(cache_folder, f"{base_name}_visualized.jpg")
        plt.savefig(vis_file, bbox_inches='tight')
        plt.close()
        print(f"可视化结果已保存到: {vis_file}")

def calculate_pixel_counts(cache_folder):
    """计算每种损伤类型的像素数量"""
    # 定义损伤类别名称
    
    
    image_files = [f for f in os.listdir(cache_folder) 
                  if f.endswith(('.jpg', '.jpeg', '.png')) and not f.endswith('_visualized.jpg')]
    
    total_pixel_counts = {i: 0 for i in range(len(class_names))}
    
    for img_file in image_files:
        # 获取对应的标签文件
        base_name = os.path.splitext(img_file)[0]
        label_file = os.path.join(cache_folder, f"{base_name}.txt")
        
        img_path = os.path.join(cache_folder, img_file)
        if not os.path.exists(label_file):
            continue
        
        # 读取图像
        img = cv2.imread(img_path)
        height, width, _ = img.shape
        
        # 为每个类别创建掩码
        masks = {i: np.zeros((height, width), dtype=np.uint8) for i in range(len(class_names))}
        
        # 读取标签并创建掩码
        with open(label_file, 'r') as f:
            lines = f.readlines()
        
        for line in lines:
            data = line.strip().split()
            if len(data) >= 5:
                class_id = int(data[0])
                x_center = float(data[1]) * width
                y_center = float(data[2]) * height
                box_width = float(data[3]) * width
                box_height = float(data[4]) * height
                
                # 计算边界框坐标
                x1 = int(max(0, x_center - box_width / 2))
                y1 = int(max(0, y_center - box_height / 2))
                x2 = int(min(width, x_center + box_width / 2))
                y2 = int(min(height, y_center + box_height / 2))
                
                # 更新该类别的掩码 (对于同一类型的损伤，重叠区域不重复计算)
                masks[class_id][y1:y2, x1:x2] = 1
        
        # 计算每个类别的像素数量
        for class_id, mask in masks.items():
            pixel_count = np.sum(mask)
            total_pixel_counts[class_id] += pixel_count
            print(f"图片 {img_file} 中 {class_names[class_id]} 的像素数量: {pixel_count}")
    
    # 输出每种损伤类型的总像素数量
    print("\n总像素数量统计:")
    for class_id, count in total_pixel_counts.items():
        print(f"{class_names[class_id]} (类别 {class_id}): {count} 像素")
    
    return total_pixel_counts

def print_fatigue_percentage(pixel_counts, surface_total_pixel):
    """计算并打印每种损伤类型的像素占比"""
    for class_id, pixel in pixel_counts.items():
        if surface_total_pixel == 0:
            percentage = 0  # 避免除以0
        else:
            percentage = 95 if (pixel / surface_total_pixel) > 1 else (pixel / surface_total_pixel) * 100
        print(f'{class_names[class_id]}占比为: {percentage:.2f}%')
    
    # Create list to store percentages
    percentages = []
    for class_id in range(len(class_names)):
        if surface_total_pixel == 0:
            percentage = 0
        else:
            percentage = min(95, (pixel_counts[class_id] / surface_total_pixel) * 100)
        percentages.append(percentage)
    return percentages

def calculate_surface_pixel_counts(cache_folder):
    """计算表面损伤的像素数量并输出占比"""
    # 定义损伤类别名称
    class_names = ['Surface']

    image_files = [f for f in os.listdir(cache_folder) 
                  if f.endswith(('.jpg', '.jpeg', '.png')) and not f.endswith('_visualized.jpg')]

    total_pixel_counts = {i: 0 for i in range(len(class_names))}
    total_pixels = 0

    for img_file in image_files:
        # 获取对应的标签文件
        base_name = os.path.splitext(img_file)[0]
        label_file = os.path.join(cache_folder, f"{base_name}_surface.txt")

        img_path = os.path.join(cache_folder, img_file)
        if not os.path.exists(label_file):
            continue

        # 读取图像
        img = cv2.imread(img_path)
        height, width, _ = img.shape
        total_pixels += height * width

        # 为每个类别创建掩码
        masks = {i: np.zeros((height, width), dtype=np.uint8) for i in range(len(class_names))}

        # 读取标签并创建掩码
        with open(label_file, 'r') as f:
            lines = f.readlines()

        for line in lines:
            data = line.strip().split()
            if len(data) >= 5:
                class_id = int(data[0])
                x_center = float(data[1]) * width
                y_center = float(data[2]) * height
                box_width = float(data[3]) * width
                box_height = float(data[4]) * height

                # 计算边界框坐标
                x1 = int(max(0, x_center - box_width / 2))
                y1 = int(max(0, y_center - box_height / 2))
                x2 = int(min(width, x_center + box_width / 2))
                y2 = int(min(height, y_center + box_height / 2))

                # 更新该类别的掩码
                masks[class_id][y1:y2, x1:x2] = 1

        # 计算每个类别的像素数量
        for class_id, mask in masks.items():
            pixel_count = np.sum(mask)
            total_pixel_counts[class_id] += pixel_count

    return total_pixel_counts[0]

def ensure_label_files_exist(cache_folder, suffix=""):
    """确保每张图片都有对应的标签文件"""
    image_files = [f for f in os.listdir(cache_folder) if f.endswith(('.jpg', '.jpeg', '.png'))]
    for img_file in image_files:
        base_name = os.path.splitext(img_file)[0]
        label_file = os.path.join(cache_folder, f"{base_name}{suffix}.txt")
        if not os.path.exists(label_file):
            # 创建一个空的标签文件
            with open(label_file, 'w') as f:
                pass

def process_detection(file_path):
    """处理检测结果的主函数。返回结构: 状态码(-1无效，1为有效), 
    损伤1对应比例，损伤2对应比例，损伤3对应比例，损伤4对应比例"""
    predict('./gear_fault_yolo/yolov5s-四种损伤类型.pt', file_path)

    # 查找最新的实验文件夹
    exp_folder = find_latest_exp_folder()
    if not exp_folder:
        return [-1, 0, 0, 0, 0]
    
    print(f"找到最新实验文件夹: {exp_folder}")
    
    # 将文件移动到cache文件夹
    cache_folder = move_files_to_cache(exp_folder)
    print(f"文件已复制到 {cache_folder}")

    predict('./gear_fault_yolo/yolov5s-surface.pt',
            file_path)

    # 查找最新的实验文件夹
    exp_folder = find_latest_exp_folder()
    if not exp_folder:
        return [-1, 0, 0, 0, 0]
    
    print(f"找到最新实验文件夹: {exp_folder}")
    
    # 重命名标签文件为*_surface.txt
    label_folder = os.path.join(exp_folder, "labels")
    if os.path.exists(label_folder):
        for file in glob.glob(f"{label_folder}/*.txt"):
            base = os.path.basename(file)
            name = os.path.splitext(base)[0]
            new_name = os.path.join(label_folder, f"{name}_surface.txt")
            os.rename(file, new_name)
    
    # 将文件移动到cache文件夹
    cache_folder = move_files_to_cache(exp_folder)
    print(f"文件已复制到 {cache_folder}")

    # 确保每张图片都有对应的标签文件
    ensure_label_files_exist(cache_folder)
    ensure_label_files_exist(cache_folder, suffix="_surface")

    # 可视化检测结果
    visualize_detection(cache_folder)

    # 计算每种损伤类型的像素数量
    pixel = calculate_pixel_counts(cache_folder)

    # 计算表面损伤像素数量和占比
    surface_total_pixel = calculate_surface_pixel_counts(cache_folder)

    # 跳过无对应算例的情况
    if surface_total_pixel == 0:
        print("表面总像素为 0，跳过计算。")
        return [-1, 0, 0, 0, 0]

    fatigue_array = print_fatigue_percentage(pixel, surface_total_pixel)
    return [1, fatigue_array[0], fatigue_array[1], 
            fatigue_array[2], fatigue_array[3]]

if __name__ == "__main__":
    if os.path.exists('./gear_fault_yolo/cache'):
        shutil.rmtree('./gear_fault_yolo/cache')
        os.makedirs('./gear_fault_yolo/cache')

    if os.path.exists("./gear_fault_yolo/yolov5/runs/detect/"):
        shutil.rmtree('./gear_fault_yolo/yolov5/runs/detect/')
        os.mkdir('./gear_fault_yolo/yolov5/runs/detect/')

    process_detection('./gear_fault_yolo/validation')
