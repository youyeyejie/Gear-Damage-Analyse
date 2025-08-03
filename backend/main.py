from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import time
import random
import shutil

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
            "code": "0",
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
    filename = file.filename.split('.')[0] + str(int(time.time())) + '.' + file.filename.split('.')[1]
    file_path = os.path.join(full_path, filename)
    try:
        file.save(file_path)
        return jsonify({
            "code": "0",
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
        if not data:
            return jsonify({"code": "400", "msg": "无效的请求数据", "data": {}}), 400

        # 检查图片文件名列表是否存在
        if 'images' not in data:
            return jsonify({"code": "400", "msg": "未提供图片文件名列表", "data": {}}), 400

        images = data['images']
        if not images or not isinstance(images, list):
            return jsonify({"code": "400", "msg": "未提供有效图片文件名列表", "data": {}}), 400

        # 获取识别精度参数
        precision = data.get('precision', 'medium')  # 默认中等精度
        if precision not in ['high', 'medium', 'low']:
            precision = 'medium'

        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400
        
        # 图片路径列表
        file_paths = []
        for file in images:
            file_path = os.path.join(full_path, file)
            file_paths.append(file_path)

        # 根据精度调整处理时间
        if precision == 'high':
            time.sleep(3)  # 高精度需要更长处理时间
        elif precision == 'medium':
            time.sleep(2)  # 中等精度
        else:
            time.sleep(1)  # 低精度

        # 生成模拟结果
        damage_types = ['齿面磨损', '齿根裂纹', '齿面胶合', '齿测点蚀']
        result = {
            "damageType": random.choice(damage_types),
            "damageSeverity": f"{random.randint(10, 90)}%",
            "damageArea": f"{random.randint(10, 90)}%",
            "damageLocation": f"{random.randint(10, 90)}%",
            "damageDescription": "这是一个模拟的损伤识别结果",
            "precision": precision,
        }

        # 模拟热力图：提取第一张图片的文件名作为热力图
        heatmap_filename = os.path.basename(file_paths[0])
        result['heatmap'] = {
            'name': heatmap_filename,
            'size': "{:.2f}KB".format(os.path.getsize(file_paths[0]) / 1024),
        }

        # 创建一个模拟的报告文件
        report_name = f"AI预测报告_{time.strftime('%Y%m%d%H%M%S')}.txt"
        report_path = os.path.join(full_path, report_name)
        with open(report_path, 'w') as f:
            f.write("这是一个模拟的AI预测报告\n")
            f.write("损伤类型："+result['damageType']+"\n")
            f.write("损伤严重程度："+result['damageSeverity']+"\n")
            f.write("损伤面积："+result['damageArea']+"\n")
            f.write("损伤位置："+result['damageLocation']+"\n")
            f.write("损伤描述："+result['damageDescription']+"\n")
        
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
        if not data or 'groupNumber' not in data or 'detectionResult' not in data:
            return jsonify({"code": "400", "msg": "无效的建模数据，缺少必要参数", "data": {}}), 400

        group_number = data['groupNumber']
        detection_result = data['detectionResult']

        # 确保项目路径已设置
        if not full_path:
            return jsonify({"code": "400", "msg": "请先创建项目", "data": {}}), 400

        # 模拟建模
        time.sleep(2)
        filename = f"Model_{time.strftime('%Y%m%d%H%M%S')}.STEP"
        # 复制 ../data/model/1.step 到 full_path 下
        source_path = os.path.join(os.path.dirname(__file__), '../data/model/1.step')
        destination_path = os.path.join(full_path, filename)
        shutil.copy2(source_path, destination_path)

        result = {}
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
