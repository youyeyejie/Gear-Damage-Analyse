from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

###### for detection part utils ######################################################################
from gear_fault_yolo.predict import process_detection
from gear_fault_yolo.predict import move_files_to_data
######################################################################################################

import os
import time
import shutil
import zipfile
import json

app = Flask(__name__)
CORS(app)  # 解决跨域问题


full_path = ''

@app.route('/api/createProject', methods=['POST'])
def create_project():
    global full_path
    try:
        data = request.get_json()
        if not data or 'projectName' not in data or 'projectPath' not in data:
            return jsonify({"code": "400", "msg": "无效的项目数据", "data": {}}), 400
        
        project_name = data['projectName']
        project_path = data['projectPath']
        full_path = os.path.join(project_path, project_name)

        if os.path.exists(full_path):
            return jsonify({"code": "409", "msg": "项目已存在", "data": {}}), 409
        try:
            # 创建项目文件夹
            os.makedirs(full_path)
        except OSError as e:
            return jsonify({"code": "500", "msg": f"创建项目文件夹失败: {str(e)}", "data": {}}), 500
        
        return jsonify({
            "code": "200",
            "msg": "项目创建成功",
            "data": {
                "projectName": project_name,
                "projectPath": project_path
            }
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": str(e), "data": {}}), 500

@app.route('/api/downloadFile', methods=['GET'])
def download_file():
    global full_path
    try:
        file_name = request.args.get('fileName')
        if not file_name:
            return jsonify({"code": "400", "msg": "未提供文件名", "data": {}}), 400
        
        base_path = full_path
        file_path = os.path.join(base_path, file_name)
        
        if not os.path.exists(file_path):
            return jsonify({"code": "404", "msg": "文件不存在", "data": {}}), 404
        
        return send_file(file_path, as_attachment=True)
    
    except Exception as e:
        return jsonify({"code": "500", "msg": str(e), "data": {}}), 500

@app.route('/api/uploadFile', methods=['POST'])
def upload_file():
    global full_path
    if 'file' not in request.files:
        return jsonify({"code": "400", "msg": "未提供文件", "data": {}}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"code": "400", "msg": "未提供文件名", "data": {}}), 400

    # 确保项目路径已设置
    if not full_path:
        return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400

    # 保存文件
    filename = file.filename.split('.')[0] + '_' + time.strftime('%Y%m%d%H%M%S') + '.' + file.filename.split('.')[1]
    file_path = os.path.join(full_path, filename)
    try:
        file.save(file_path)
        return jsonify({
            "code": "200",
            "msg": "文件上传成功",
            "data": {
                "fileName": filename,
                "filePath": file_path
            }
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": f"文件上传失败: {str(e)}", "data": {}}), 500

@app.route('/api/deleteFile', methods=['POST'])
def delete_file():
    global full_path
    try:
        data = request.get_json()
        if not data or 'fileName' not in data:
            return jsonify({"code": "400", "msg": "未提供文件名", "data": {}}), 400
        
        file_name = data['fileName']
        file_path = os.path.join(full_path, file_name)
        
        if not os.path.exists(file_path):
            return jsonify({"code": "404", "msg": "文件不存在", "data": {}}), 404
        
        try:
            os.remove(file_path)
            return jsonify({
                "code": "200",
                "msg": "文件删除成功",
                "data": {}
            }), 200
        except OSError as e:
            return jsonify({"code": "500", "msg": f"文件删除失败: {str(e)}", "data": {}}), 500
    except Exception as e:
        return jsonify({"code": "500", "msg": str(e), "data": {}}), 500

@app.route('/api/aiDetection', methods=['POST'])
def ai_detection():
    global full_path
    try:
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({"code": "400", "msg": "无效的请求数据，缺少必要参数", "data": {}}), 400
        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400
  
        input = data['input']
        image = input['gear_image']
        file_path = os.path.join(full_path, image)

        fatigue_array = [0, 0, 0, 0, 0] # 目前的逻辑只考虑输入一张图片

        cache_path = './gear_fault_yolo/cache'

        if os.path.exists(cache_path):
            shutil.rmtree(cache_path)
        os.mkdir(cache_path)

        if os.path.exists("./gear_fault_yolo/yolov5/runs/detect/"):
            shutil.rmtree('./gear_fault_yolo/yolov5/runs/detect/')
            os.mkdir('./gear_fault_yolo/yolov5/runs/detect/')
        

        fatigue_array = process_detection(file_path)
        move_files_to_data(cache_path, full_path)

        # 生成结果
        result = {}
        result['input'] = data['input']
        is_damage = bool(fatigue_array[0] == 1 and (fatigue_array[1] > 0 or fatigue_array[2] > 0 or fatigue_array[3] > 0 or fatigue_array[4] > 0))
        
        output = {
            "isDamage" : is_damage,
            "isValid" : fatigue_array[0],
            "abrasionRate" : fatigue_array[1],
            "peelingRate" : fatigue_array[2],
            "scuffingRate" : fatigue_array[3],
            "pittingRate" : fatigue_array[4],
        }
        result['output'] = output

        # 损伤方框图
        blockmap_filename = fatigue_array[5]
        blockmap_path = os.path.join(full_path, blockmap_filename)
        result['blockmap'] = {
            'name': blockmap_filename,
            'size': "{:.2f}KB".format(os.path.getsize(blockmap_path) / 1024),
        }

        # 报告
        report_name = f"AI损伤识别报告_{time.strftime('%Y%m%d%H%M%S')}.txt"
        report_path = os.path.join(full_path, report_name)
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("=== 齿轮损伤智能分析报告 ===\n\n")
            
            # 检测有效性评估
            f.write("【检测状态评估】\n")
            if fatigue_array[0] == 1:
                f.write("✓ 检测状态: 有效\n")
                f.write("✓ 结果可信度: 高\n")
                f.write("\n")
            
                # 详细损伤分析
                f.write("【损伤类型分析】\n")
                
                # 磨损分析
                abrasion = float(fatigue_array[1])
                f.write(f"1. 磨损状况: {abrasion:.1f}%\n")
                if abrasion > 80:
                    f.write("   严重程度: 严重磨损 (需立即干预)\n")
                    f.write("   特征: 大面积材料损失，接触面不平整\n")
                    f.write("   可能原因: 润滑不足、异物磨损、长期过载\n")
                    f.write("   建议: 立即停机检修，更换齿轮，检查润滑系统\n")
                elif abrasion > 60:
                    f.write("   严重程度: 中度磨损 (需定期监测)\n")
                    f.write("   特征: 接触面局部粗糙度增加\n")
                    f.write("   可能原因: 润滑效率下降、负载波动\n")
                    f.write("   建议: 缩短检修周期，考虑更换润滑油\n")
                else:
                    f.write("   严重程度: 轻微磨损 (在可接受范围内)\n")
                    f.write("   特征: 正常磨合痕迹\n")
                    f.write("   建议: 按常规维护计划进行\n")
                f.write("\n")
                
                # 剥落分析
                peeling = float(fatigue_array[2])
                f.write(f"2. 齿面剥落: {peeling:.1f}%\n")
                if peeling > 30:
                    f.write("   严重程度: 严重剥落 (高风险)\n")
                    f.write("   特征: 大面积材料脱落，齿面完整性受损\n")
                    f.write("   可能原因: 材料疲劳、冲击载荷、材料缺陷\n")
                    f.write("   建议: 立即更换齿轮，分析失效根本原因\n")
                elif peeling > 10:
                    f.write("   严重程度: 中度剥落 (需注意)\n")
                    f.write("   特征: 局部区域出现片状剥落\n")
                    f.write("   可能原因: 早期疲劳迹象，过载运行\n")
                    f.write("   建议: 加强监测，准备备件\n")
                else:
                    f.write("   严重程度: 轻微/无剥落 (状态良好)\n")
                    f.write("   建议: 常规检查即可\n")
                f.write("\n")
                
                # 压伤分析
                scuffing = float(fatigue_array[3])
                f.write(f"3. 压伤程度: {scuffing:.1f}%\n")
                if scuffing > 80:
                    f.write("   严重程度: 严重压伤 (需立即干预)\n")
                    f.write("   特征: 显著的表面形变和粘着性损伤\n")
                    f.write("   可能原因: 热负荷过高，润滑膜破裂\n")
                    f.write("   建议: 立即检修，更换齿轮，检查运行条件\n")
                elif scuffing > 60:
                    f.write("   严重程度: 中度压伤 (需密切关注)\n")
                    f.write("   特征: 齿面出现明显划痕和热损伤\n")
                    f.write("   可能原因: 间歇性润滑不足，负载过高\n")
                    f.write("   建议: 检查润滑系统，考虑调整工作参数\n")
                else:
                    f.write("   严重程度: 轻微/无压伤 (状态可接受)\n")
                    f.write("   建议: 保持当前润滑状态\n")
                f.write("\n")
                
                # 点蚀分析
                pitting = float(fatigue_array[4])
                f.write(f"4. 点蚀分布: {pitting:.1f}%\n")
                if pitting > 60:
                    f.write("   严重程度: 广泛点蚀 (高风险)\n")
                    f.write("   特征: 齿面大面积出现点状凹坑\n")
                    f.write("   可能原因: 接触应力过高，疲劳损伤严重\n")
                    f.write("   建议: 考虑更换齿轮，检查设计参数是否合理\n")
                elif pitting > 30:
                    f.write("   严重程度: 局部点蚀 (需注意)\n")
                    f.write("   特征: 啮合线附近出现点状凹坑\n")
                    f.write("   可能原因: 局部应力集中，润滑不足\n")
                    f.write("   建议: 加强监测，优化润滑\n")
                else:
                    f.write("   严重程度: 初期/无点蚀 (状态良好)\n")
                    f.write("   建议: 常规检查即可\n")
                f.write("\n")
                
                # 综合风险评估
                max_damage = max(abrasion, peeling * 1.5, scuffing, pitting)
                f.write("【综合风险评估】\n")
                if max_damage > 80:
                    f.write("⚠ 整体评级: 高风险\n")
                    f.write("• 预计剩余使用寿命: 严重缩短 (建议立即更换)\n")
                    f.write("• 失效风险: 高 (可能导致突发故障)\n")
                elif max_damage > 60:
                    f.write("! 整体评级: 中等风险\n")
                    f.write("• 预计剩余使用寿命: 中度缩短 (密切监控)\n")
                    f.write("• 失效风险: 中等 (可能影响正常运行)\n")
                else:
                    f.write("✓ 整体评级: 低风险\n")
                    f.write("• 预计剩余使用寿命: 接近设计寿命\n")
                    f.write("• 失效风险: 低 (正常使用范围内)\n")
                f.write("\n")
                
                # 使用的检测模型信息
                f.write("【检测信息】\n")
                f.write(f"• 使用模型: {input['model']}\n")
                f.write(f"• 检测时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"• 检测图像: {os.path.basename(file_path)}\n")
                f.write(f"• 报告ID: {time.strftime('%Y%m%d%H%M%S')}\n")
                f.write("\n")
            
            elif fatigue_array[0] == -1:
                f.write("✗ 检测状态: 无效\n")
                f.write("! 注意: 图像质量不足或未检测到明确损伤特征，建议重新采集图像。请确保齿面平行于镜头，且画面中仅包含单个齿面，光照均匀无强反光。\n")
            else:
                f.write(f"? 检测状态: {fatigue_array}\n")
            
        result['report'] = {
            'name': report_name,
            'size': "{:.2f}KB".format(os.path.getsize(report_path) / 1024),
        }

        return jsonify({
            "code": "200",
            "msg": "AI识别成功",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": f"AI识别失败: {str(e)}", "data": {}}), 500

@app.route('/api/geometryModeling', methods=['POST'])
def geometry_modeling():
    global full_path
    try:
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({"code": "400", "msg": "无效的建模数据，缺少必要参数", "data": {}}), 400
        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400

        input = data['input']
        gear_group_number = input['gearGroupNumber']
        is_damage = input['isDamage']

        # 建模
        if is_damage:
            source_path = f"../data/model/damaged/{gear_group_number}_damage.stp"
        else:
            source_path = f"../data/model/undamaged/{gear_group_number}.STEP"

        filename = f"Model_{time.strftime('%Y%m%d%H%M%S')}.STEP"
        destination_path = os.path.join(full_path, filename)
        shutil.copy2(source_path, destination_path)

        result = {}
        result['input'] = input
        result['model'] = {
            'name': filename,
            'size': "{:.2f}KB".format(os.path.getsize(destination_path) / 1024),
        }

        return jsonify({
            "code": "200",
            "msg": "几何建模成功",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": f"请求处理失败: {str(e)}", "data": {}}), 500

@app.route('/api/simulation', methods=['POST'])
def simulation():
    global full_path
    try:
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({"code": "400", "msg": "无效的仿真数据，缺少必要参数", "data": {}}), 400
        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400

        input = data['input']
        gear_group_number = input['gearGroupNumber']
        is_damage = input['isDamage']
        # model_name = input['model']['name']
        # model_path = os.path.join(full_path, model_name)

        remain_life_json = json.load(open('../data/remain_life.json', 'r'))['remain_life']

        # 根据是否有损选择不同的云图数据源
        if is_damage:
            stress_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/damaged/stress/{gear_group_number}.png')
            remain_life_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/damaged/life/{gear_group_number}.png')
            remain_life = f'{remain_life_json["damaged"][str(gear_group_number)]}转'
        else:
            stress_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/undamaged/stress/{gear_group_number}.png')
            remain_life_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/undamaged/life/{gear_group_number}.png')
            remain_life = f'{remain_life_json["undamaged"][str(gear_group_number)]}转'

        # 结果
        result = {}
        result['input'] = input
        result['output'] = {
            'remainLife': remain_life,
        }

        # 模拟应力云图
        stress_cloudmap_filename = f"stress_cloudmap_{time.strftime('%Y%m%d%H%M%S')}.png"
        stress_cloudmap_destination_path = os.path.join(full_path, stress_cloudmap_filename)
        shutil.copy2(stress_cloudmap_source_path, stress_cloudmap_destination_path)
        result['stress_cloudmap'] = {
            'name': stress_cloudmap_filename,
            'size': "{:.2f}KB".format(os.path.getsize(stress_cloudmap_destination_path) / 1024),
        }

        # 模拟剩余寿命云图
        remain_life_cloudmap_filename = f"remain_life_cloudmap_{time.strftime('%Y%m%d%H%M%S')}.png"
        remain_life_cloudmap_destination_path = os.path.join(full_path, remain_life_cloudmap_filename)
        shutil.copy2(remain_life_cloudmap_source_path, remain_life_cloudmap_destination_path)
        result['remain_life_cloudmap'] = {
            'name': remain_life_cloudmap_filename,
            'size': "{:.2f}KB".format(os.path.getsize(remain_life_cloudmap_destination_path) / 1024),
        }

        return jsonify({
            "code": "200",
            "msg": "仿真成功",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": f"仿真失败: {str(e)}", "data": {}}), 500


@app.route('/api/generateReport', methods=['POST'])
def generate_report():
    global full_path
    try:
        data = request.get_json()
        if not data or 'project' not in data:
            return jsonify({"code": "400", "msg": "无效的项目数据，缺少必要参数", "data": {}}), 400
        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400
        
        # 提取报告数据
        project = data['project']
        projectInfo = project['projectInfo']
        
        detectionResult = project['detectionResult']
        ai_detection_output = detectionResult['output']
        ai_detection_result = ""
        if detectionResult['output']['isValid']:
            if ai_detection_output['isDamage']:
                ai_detection_result += f"\t - 损伤情况：有损\n"
                abrasionRate = float(ai_detection_output['abrasionRate'])
                ai_detection_result += f"\t - 磨损状况: {abrasionRate:.1f}%\n"
                if abrasionRate > 80:
                    ai_detection_result += "\t\t - 严重程度: 严重磨损 (需立即干预)\n"
                    ai_detection_result += "\t\t - 特征: 大面积材料损失，接触面不平整\n"
                    ai_detection_result += "\t\t - 可能原因: 润滑不足、异物磨损、长期过载\n"
                    ai_detection_result += "\t\t - 建议: 立即停机检修，更换齿轮，检查润滑系统\n"
                elif abrasionRate > 60:
                    ai_detection_result += "\t\t - 严重程度: 中度磨损 (需定期监测)\n"
                    ai_detection_result += "\t\t - 特征: 接触面局部粗糙度增加\n"
                    ai_detection_result += "\t\t - 可能原因: 润滑效率下降、负载波动\n"
                    ai_detection_result += "\t\t - 建议: 缩短检修周期，考虑更换润滑油\n"
                else:
                    ai_detection_result += "\t\t - 严重程度: 轻微磨损 (在可接受范围内)\n"
                    ai_detection_result += "\t\t - 特征: 正常磨合痕迹\n"
                    ai_detection_result += "\t\t - 建议: 按常规维护计划进行\n"
                peelingRate = float(ai_detection_output['peelingRate'])
                ai_detection_result += f"\t - 齿面剥落: {peelingRate:.1f}%\n"
                if peelingRate > 30:
                    ai_detection_result += "\t\t - 严重程度: 严重剥落 (高风险)\n"
                    ai_detection_result += "\t\t - 特征: 大面积材料脱落，齿面完整性受损\n"
                    ai_detection_result += "\t\t - 可能原因: 材料疲劳、冲击载荷、材料缺陷\n"
                    ai_detection_result += "\t\t - 建议: 立即更换齿轮，分析失效根本原因\n"
                elif peelingRate > 10:
                    ai_detection_result += "\t\t - 严重程度: 中度剥落 (需注意)\n"
                    ai_detection_result += "\t\t - 特征: 局部区域出现片状剥落\n"
                    ai_detection_result += "\t\t - 可能原因: 早期疲劳迹象，过载运行\n"
                    ai_detection_result += "\t\t - 建议: 加强监测，准备备件\n"
                else:
                    ai_detection_result += "\t\t - 严重程度: 轻微/无剥落 (状态良好)\n"
                    ai_detection_result += "\t\t - 建议: 常规检查即可\n"
                scuffingRate = float(ai_detection_output['scuffingRate'])
                ai_detection_result += f"\t - 压伤程度: {scuffingRate:.1f}%\n"
                if scuffingRate > 80:
                    ai_detection_result += "\t\t - 严重程度: 严重压伤 (需立即干预)\n"
                    ai_detection_result += "\t\t - 特征: 显著的表面形变和粘着性损伤\n"
                    ai_detection_result += "\t\t - 可能原因: 热负荷过高，润滑膜破裂\n"
                    ai_detection_result += "\t\t - 建议: 立即检修，更换齿轮，检查运行条件\n"
                elif scuffingRate > 60:
                    ai_detection_result += "\t\t - 严重程度: 中度压伤 (需密切关注)\n"
                    ai_detection_result += "\t\t - 特征: 齿面出现明显划痕和热损伤\n"
                    ai_detection_result += "\t\t - 可能原因: 间歇性润滑不足，负载过高\n"
                    ai_detection_result += "\t\t - 建议: 检查润滑系统，考虑调整工作参数\n"
                else:
                    ai_detection_result += "\t\t - 严重程度: 轻微/无压伤 (状态可接受)\n"
                    ai_detection_result += "\t\t - 建议: 保持当前润滑状态\n"
                pittingRate = float(ai_detection_output['pittingRate'])
                ai_detection_result += f"\t - 点蚀分布: {pittingRate:.1f}%\n"
                if pittingRate > 60:
                    ai_detection_result += "\t\t - 严重程度: 广泛点蚀 (高风险)\n"
                    ai_detection_result += "\t\t - 特征: 齿面大面积出现点状凹坑\n"
                    ai_detection_result += "\t\t - 可能原因: 接触应力过高，疲劳损伤严重\n"
                    ai_detection_result += "\t\t - 建议: 考虑更换齿轮，检查设计参数是否合理\n"
                elif pittingRate > 30:
                    ai_detection_result += "\t\t - 严重程度: 局部点蚀 (需注意)\n"
                    ai_detection_result += "\t\t - 特征: 啮合线附近出现点状凹坑\n"
                    ai_detection_result += "\t\t - 可能原因: 局部应力集中，润滑不足\n"
                    ai_detection_result += "\t\t - 建议: 加强监测，优化润滑\n"
                else:
                    ai_detection_result += "\t\t - 严重程度: 初期/无点蚀 (状态良好)\n"
                    ai_detection_result += "\t\t - 建议: 常规检查即可\n"
                ai_detection_result += "\n"
                
                # 综合风险评估
                max_damage = max(abrasionRate, peelingRate * 1.5, scuffingRate, pittingRate)
                ai_detection_result += f"\t - 综合风险评估：\n"
                if max_damage > 80:
                    ai_detection_result += "\t\t - 严重程度: 高风险\n"
                    ai_detection_result += "\t\t - 整体评级: 高风险\n"
                    ai_detection_result += "\t\t - 预计剩余使用寿命: 严重缩短 (建议立即更换)\n"
                    ai_detection_result += "\t\t - 失效风险: 高 (可能导致突发故障)\n"
                elif max_damage > 60:
                    ai_detection_result += "\t\t - 严重程度: 中等风险\n"
                    ai_detection_result += "\t\t - 整体评级: 中等风险\n"
                    ai_detection_result += "\t\t - 预计剩余使用寿命: 中度缩短 (密切监控)\n"
                    ai_detection_result += "\t\t - 失效风险: 中等 (可能影响正常运行)\n"
                else:
                    ai_detection_result += "\t\t - 严重程度: 低风险\n"
                    ai_detection_result += "\t\t - 整体评级: 低风险\n"
                    ai_detection_result += "\t\t - 预计剩余使用寿命: 接近设计寿命\n"
                    ai_detection_result += "\t\t - 失效风险: 低 (正常使用范围内)\n"
            else:
                ai_detection_result += f"\t - 损伤情况：无损\n"
        else:
            ai_detection_report += f"\t - 识别结果：无效\n"
            ai_detection_report += f"\t\t - 注意: 图像质量不足或未检测到明确损伤特征，建议重新采集图像。请确保齿面平行于镜头，且画面中仅包含单个齿面，光照均匀无强反光。\n"



        selectedGearGroup = project['selectedGearGroup']
        parameter = "\t|齿轮参数|主齿轮|从齿轮|\n\t|:-|:-|:-|\n"
        # 处理主齿轮参数
        for key, value in selectedGearGroup['masterGear']['parameters'].items():
            parameter += f"\t|{key}|{value}|"
            # 处理从齿轮对应参数
            if key in selectedGearGroup['slaveGear']['parameters']:
                parameter += f"{selectedGearGroup['slaveGear']['parameters'][key]}|\n"
            else:
                parameter += "|\n"
        material = "\t|材料属性|主齿轮|从齿轮|\n\t|:-|:-|:-|\n"
        for key, value in selectedGearGroup['masterGear']['materialProperties'].items():
            material += f"\t|{key}|{value}|"
            if key in selectedGearGroup['slaveGear']['materialProperties']:
                material += f"{selectedGearGroup['slaveGear']['materialProperties'][key]}|\n"
            else:
                material += "|\n"
        load = "\t|载荷数据|主齿轮|从齿轮|\n\t|:-|:-|:-|\n"
        for key, value in selectedGearGroup['masterGear']['loadData'].items():
            load += f"\t|{key}|{value}|"
            if key in selectedGearGroup['slaveGear']['loadData']:
                load += f"{selectedGearGroup['slaveGear']['loadData'][key]}|\n"
            else:
                load += "|\n"
        
        modelingResult = project['modelingResult']
        simulationResult = project['simulationResult']
        
        # 删除full_path下的压缩文件
        for file in os.listdir(full_path):
            if file.endswith('.zip') or file.endswith('.md'):
                os.remove(os.path.join(full_path, file))
        

        # 生成报告
        report_filename = "齿轮损伤识别与剩余寿命预测报告.md"
        report_path = os.path.join(full_path, report_filename)
        report_content = f"""
# 齿轮损伤识别与剩余寿命预测报告
## 项目基本信息
- **项目名称：** {projectInfo['name']}
- **项目路径：** {projectInfo['path']}
- **项目状态：** {projectInfo['status']}
- **项目编号：** {projectInfo['id']}
- **项目创建时间：** {projectInfo['createTime']}

## 智能识别
- **输入图片：**
    - ![输入图片]({detectionResult['input']['gear_image']})
- **识别模型：** {detectionResult['input']['model']}
- **识别结果：** 
{ai_detection_result}
- **损伤方框图：**
     - ![损伤方框图]({detectionResult['blockmap']['name']})

## 几何建模
- **齿轮配置：** 第{selectedGearGroup['groupNumber']}组
    - 主齿轮：{selectedGearGroup['masterGear']['model']}
    - 从齿轮：{selectedGearGroup['slaveGear']['model']}
- **齿轮参数：**
{parameter}
- **几何模型：** [模型链接]({modelingResult['model']['name']})

## 仿真计算
- **材料属性：**
{material}
- **载荷数据：**
{load}
- **仿真结果：**
    - **压力云图：** ![stress_cloudmap]({simulationResult['stress_cloudmap']['name']})
    - **剩余寿命云图：** 
        - 剩余寿命：{simulationResult['output']['remainLife']}
        - ![remain_life_cloudmap]({simulationResult['remain_life_cloudmap']['name']})
"""


        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)

        # 生成压缩包文件名
        zip_filename = "齿轮损伤识别与剩余寿命预测报告.zip"
        zip_path = os.path.join(full_path, zip_filename)
        # 创建压缩文件
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(full_path):
                for file in files:
                    if file != zip_filename:  # 避免将压缩包自身添加到压缩包中
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, full_path)
                        zipf.write(file_path, arcname)

        result = {}
        result['project'] = {
            'name': zip_filename,
            'size': "{:.2f}KB".format(os.path.getsize(zip_path) / 1024),
        }

        return jsonify({
            "code": "200",
            "msg": "生成报告成功",
            "data": result
        }), 200
    except Exception as e:
        return jsonify({"code": "500", "msg": f"生成报告失败: {str(e)}", "data": {}}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
