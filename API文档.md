# API接口文档

本文档详细列出了齿轮损伤识别和剩余寿命预测系统的所有API接口，包括请求参数、响应结构和示例。

## 基础信息
- 服务器地址: `http://localhost:5000`
- 所有请求和响应均使用JSON格式
- 响应统一包含`code`、`msg`和`data`字段

## 接口列表

### 1. 创建项目
- **路径**: `/api/createProject`
- **方法**: `POST`
- **描述**: 创建新的项目文件夹

#### 请求参数
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| projectName | string | 是 | 项目名称 |
| projectPath | string | 是 | 项目路径 |

#### 响应结构
```json
{
  "code": "200",
  "msg": "项目创建成功",
  "data": {
    "projectName": "齿轮项目1",
    "projectPath": "D:\\Projects"
  }
}
```

### 2. 下载文件
- **路径**: `/api/downloadFile`
- **方法**: `GET`
- **描述**: 下载项目中的文件

#### 请求参数
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| fileName | string | 是 | 文件名 |

#### 响应结构
- 成功: 文件流
- 失败:
```json
{
  "code": "404",
  "msg": "文件不存在",
  "data": {}
}
```

### 3. 上传文件
- **路径**: `/api/uploadFile`
- **方法**: `POST`
- **描述**: 上传文件到项目中

#### 请求参数
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| file | file | 是 | 要上传的文件 |

#### 响应结构
```json
{
  "code": "200",
  "msg": "文件上传成功",
  "data": {
    "fileName": "image1623456789.jpg",
    "filePath": "D:\\Projects\\齿轮项目1\\image1623456789.jpg"
  }
}
```

### 4. 删除文件
- **路径**: `/api/deleteFile`
- **方法**: `POST`
- **描述**: 删除项目中的文件

#### 请求参数
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| fileName | string | 是 | 要删除的文件名 |

#### 响应结构
```json
{
  "code": "200",
  "msg": "文件删除成功",
  "data": {}
}
```

### 5. AI识别
- **路径**: `/api/aiDetection`
- **方法**: `POST`
- **描述**: 对上传的图片进行齿轮损伤识别

#### 请求参数
```json
{
  "input": {
    "precision": "high"  // 可选值: high, medium, low
  },
  "images": ["image1.jpg", "image2.jpg"]  // 图片文件名列表
}
```

#### 响应结构
```json
{
  "code": "200",
  "msg": "AI识别成功",
  "data": {
    "input": {
      "precision": "high"
    },
    "output": {
      "damageType": "齿面磨损",  // 损伤类型
      "damageSeverity": "65%",   // 损伤严重程度
      "damageArea": "45%",      // 损伤面积
      "damageLocation": "30%",  // 损伤位置
      "damageDescription": "这是一个模拟的损伤识别结果"
    },
    "heatmap": {
      "name": "image1.jpg",
      "size": "2.34KB"
    },
    "report": {
      "name": "AI预测报告_20230615143025.txt",
      "size": "1.23KB"
    }
  }
}
```

### 6. 几何建模
- **路径**: `/api/geometryModeling`
- **方法**: `POST`
- **描述**: 根据选择的齿轮参数组进行几何建模

#### 请求参数
```json
{
  "groupNumber": 1,  // 齿轮参数组编号
  "input": {         // 其他输入参数
    // ...
  }
}
```

#### 响应结构
```json
{
  "code": "200",
  "msg": "几何建模成功",
  "data": {
    "model": {
      "name": "Model_20230615143512.STEP",
      "size": "12.34KB"
    }
  }
}
```

### 7. 仿真计算
- **路径**: `/api/simulation`
- **方法**: `POST`
- **描述**: 对几何模型进行仿真计算

#### 请求参数
```json
{
  "groupNumber": 1,  // 齿轮参数组编号
  "model": "Model_20230615143512.STEP",  // 模型文件名
  "input": {         // 仿真输入参数
    // ...
  }
}
```

#### 响应结构
```json
{
  "code": "200",
  "msg": "仿真成功",
  "data": {
    "input": {         // 输入参数原样返回
      // ...
    },
    "output": {
      "simulationDescription": "这是一个模拟的仿真结果"
    },
    "cloudmap": {
      "name": "Model_20230615143512.STEP",
      "size": "12.34KB"
    },
    "report": {
      "name": "仿真报告_20230615144005.txt",
      "size": "1.56KB"
    }
  }
}
```

## 错误代码说明
| 代码 | 描述 |
|------|------|
| 200 | 操作成功 |
| 400 | 无效请求（参数错误等） |
| 404 | 资源不存在 |
| 409 | 冲突（如项目已存在） |
| 500 | 服务器内部错误 |