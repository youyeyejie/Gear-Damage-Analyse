# Gear Damage Analyse 项目运行指南

## 项目简介
这是一个前后端分离的齿轮损伤识别和剩余寿命预测交互页面，前端基于React+Material-UI构建，后端使用Python开发。

## 环境要求
- Python 3.12
- Node.js v22.17.0
- npm 11.4.2

## 项目结构
```
Gear Damage Analyse
├── .gitignore
├── README.md
├── data\
│   ├── cloudmap\
│   └── model\
├── backend\
│   ├── main.py
│   └── requirements.txt
└── frontend\
    ├── README.md
    ├── package-lock.json
    ├── package.json
    ├── public\
    │   ├── index.html
    │   ├── favicon.ico
    │   ├── logo192.png
    │   ├── logo512.png
    │   ├── manifest.json
    │   ├── robots.txt
    │   └── gear.json
    └── src\
        ├── App.css
        ├── App.js
        ├── App.test.js
        ├── AppContext.js
        ├── index.css
        ├── index.js
        ├── logo.svg
        ├── reportWebVitals.js
        ├── setupTests.js
        └── pages\
            ├── ProjectSettings.js
            ├── AIDetection.js
            ├── GeometryModeling.js
            ├── SimulationSettings.js
            └── DataVisualization.js
```

## 后端运行步骤
1. 进入后端目录
    ```bash
    cd backend
    ```
2. 创建并激活虚拟环境
    ```bash
    # 创建虚拟环境
    python -m venv venv

    # Windows激活虚拟环境
    venv\Scripts\activate

    # macOS/Linux激活虚拟环境
    # source venv/bin/activate
    ```
3. 安装依赖
    ```bash
    pip install -r requirements.txt
    ```
4. 启动后端服务
    ```bash
    python main.py
    ```

## 前端运行步骤
1. 进入前端目录
    ```bash
    cd frontend
    ```
2. 安装依赖
    ```bash
    npm install
    ```
3. 启动开发服务器
    ```bash
    npm start
    ```
4. 在浏览器中访问
    ```
    http://localhost:3000
    ```

## 参考资料
- 前后端通信 API 参考：
    - [MDN Web Docs](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference)
- React 样式参考
    - [Ant Design](https://ant-design.antgroup.com/components/overview-cn/)