from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os

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

from flask import request  # 确保 request 已导入，若已有则可忽略



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
