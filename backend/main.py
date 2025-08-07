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
        image = input['image']
        file_paths = [] # 输入的图片的路径列表
        for file in image:
            file_path = os.path.join(full_path, file)
            file_paths.append(file_path)

        # 调用
        time.sleep(1)
        # 调用在这里实现

        # 生成模拟结果
        is_damage = random.choice([True, False]) # 输出的是否损伤

        result = {}
        result['input'] = input

        output = {
            "isDamage": is_damage,
        }
        result['output'] = output

        # 模拟热力图
        heatmap = []
        for file_path in file_paths:
            heatmap.append({
                'name': os.path.basename(file_path),
                'size': "{:.2f}KB".format(os.path.getsize(file_path) / 1024),
            })

        result['heatmap'] = heatmap

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

        # 根据是否有损选择不同的云图数据源
        if is_damage:
            stress_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/damaged/stress/{gear_group_number}.png')
            remain_life_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/damaged/life/{gear_group_number}.png')
        else:
            stress_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/undamaged/stress/{gear_group_number}.png')
            remain_life_cloudmap_source_path = os.path.join(os.path.dirname(__file__), f'../data/cloudmap/undamaged/life/{gear_group_number}.png')

        # 结果
        result = {}
        result['input'] = input

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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
