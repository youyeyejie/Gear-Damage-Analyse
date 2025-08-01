import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Divider } from 'antd';
import { FileTextOutlined, BarChartOutlined, HeatMapOutlined, AlertOutlined } from '@ant-design/icons';
import '../App.css';

function DataVisualization({ projectInfo, modelingResult, simulationResult, aiResult }) {
  const [activeTabKey, setActiveTabKey] = useState('project');

  // 监听projectInfo变化，更新项目状态
  useEffect(() => {
    if (projectInfo) {
      console.log('项目状态更新:', projectInfo.status);
    }
  }, [projectInfo]);

  // 格式化日期时间
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '24px' }}>综合数据展示</h1>

      {/* 项目状态概览卡片 */}
      <Card className="status-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{projectInfo?.name || '未命名项目'}</h2>
            <p style={{ color: '#666' }}>{projectInfo?.path || '未设置路径'}</p>
          </div>
          <div className={`status-badge ${get_status_class(projectInfo?.status)}`}>
            <AlertOutlined style={{ marginRight: '8px' }} />
            {getStatusText(projectInfo?.status)}
          </div>
        </div>
      </Card>

      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} style={{ marginBottom: '24px' }}>
          <Tabs.Tab key="project" tab="项目信息" />
          <Tabs.Tab key="modeling" tab="几何建模" />
          <Tabs.Tab key="simulation" tab="仿真结果" />
          <Tabs.Tab key="ai" tab="AI识别" />
          <Tabs.Tab key="visualization" tab="数据可视化" />
        </Tabs>

      {/* 项目信息面板 */}
      {activeTabKey === 'project' && (
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>项目基本信息</h2>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <p><strong>项目名称：</strong>{projectInfo?.name || 'N/A'}</p>
              <p><strong>项目路径：</strong>{projectInfo?.path || 'N/A'}</p>
              <p><strong>创建时间：</strong>{formatDateTime(projectInfo?.createdAt)}</p>
            </Col>
            <Col span={12}>
              <p><strong>当前状态：</strong>{getStatusText(projectInfo?.status)}</p>
              <p><strong>上次更新：</strong>{formatDateTime(projectInfo?.updatedAt)}</p>
              <p><strong>项目ID：</strong>{projectInfo?.id || 'N/A'}</p>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          <h2 style={{ marginBottom: '16px' }}>项目操作日志</h2>
          <div className="log-container">
            {projectInfo?.logs?.map((log, index) => (
              <div key={index} className="log-item">
                <span className="log-time">{formatDateTime(log.timestamp)}</span>
                <span className="log-content">{log.message}</span>
              </div>
            )) || <p>暂无日志记录</p>}
          </div>
        </div>
      )}

      {/* 几何建模面板 */}
      {activeTabKey === 'modeling' && (
        <div className="card">
          {modelingResult ? (
            <>
              <h2 style={{ marginBottom: '16px' }}>建模参数</h2>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <p><strong>配置组：</strong>第{modelingResult.groupNumber}组</p>
                  <p><strong>主齿轮模型：</strong>{modelingResult.masterGearModel}</p>
                  <p><strong>从齿轮模型：</strong>{modelingResult.slaveGearModel}</p>
                </Col>
                <Col span={12}>
                  <p><strong>损伤类型：</strong>{modelingResult.damageType}</p>
                  <p><strong>建模时间：</strong>{formatDateTime(modelingResult.modeledAt)}</p>
                  <p><strong>模型文件：</strong>{modelingResult.modelFile}</p>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <h2 style={{ marginBottom: '16px' }}>模型预览</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', background: '#f0f2f5', borderRadius: '8px' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <p style={{ marginLeft: '16px' }}>齿轮3D模型预览图</p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>暂无几何建模数据</p>
              <p style={{ marginTop: '8px', color: '#999' }}>请先完成几何建模步骤</p>
            </div>
          )}
        </div>
      )}

      {/* 仿真结果面板 */}
      {activeTabKey === 'simulation' && (
        <div className="card">
          {simulationResult ? (
            <>
              <h2 style={{ marginBottom: '16px' }}>仿真参数</h2>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <p><strong>材料：</strong>{simulationResult.material}</p>
                  <p><strong>网格密度：</strong>{simulationResult.meshDensity}</p>
                  <p><strong>边界条件：</strong>{simulationResult.boundaryConditions.join(', ')}</p>
                </Col>
                <Col span={12}>
                  <p><strong>力：</strong>{simulationResult.loadSettings.force} N</p>
                  <p><strong>压力：</strong>{simulationResult.loadSettings.pressure} MPa</p>
                  <p><strong>电流：</strong>{simulationResult.loadSettings.current} A</p>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <h2 style={{ marginBottom: '16px' }}>应力云图</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', background: '#f0f2f5', borderRadius: '8px' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <p style={{ marginLeft: '16px' }}>应力分布云图预览</p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>暂无仿真数据</p>
              <p style={{ marginTop: '8px', color: '#999' }}>请先完成仿真计算步骤</p>
            </div>
          )}
        </div>
      )}

      {/* AI识别面板 */}
      {activeTabKey === 'ai' && (
        <div className="card">
          {aiResult ? (
            <>
              <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <p><strong>损伤类型：</strong>{aiResult.damageType}</p>
                  <p><strong>损伤面积：</strong>{aiResult.damageArea} mm²</p>
                  <p><strong>置信度：</strong>{aiResult.confidence}%</p>
                </Col>
                <Col span={12}>
                  <p><strong>关联性：</strong>{aiResult.relevance}</p>
                  <p><strong>识别时间：</strong>{formatDateTime(aiResult.recognizedAt)}</p>
                  <p><strong>报告文件：</strong>{aiResult.reportFile}</p>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <h2 style={{ marginBottom: '16px' }}>热力图分析</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', background: '#f0f2f5', borderRadius: '8px' }}>
                <HeatMapOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                <p style={{ marginLeft: '16px' }}>损伤热力图预览</p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>暂无AI识别数据</p>
              <p style={{ marginTop: '8px', color: '#999' }}>请先完成AI识别步骤</p>
            </div>
          )}
        </div>
      )}

      {/* 数据可视化面板 */}
      {activeTabKey === 'visualization' && (
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>损伤分析图表</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#f0f2f5', borderRadius: '8px', marginBottom: '24px' }}>
            <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <p style={{ marginLeft: '16px' }}>损伤类型分布柱状图</p>
          </div>

          <h2 style={{ marginBottom: '16px' }}>应力分布3D图</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', background: '#f0f2f5', borderRadius: '8px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <p style={{ marginLeft: '16px' }}>3D应力分布云图</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助函数：获取状态文本
function getStatusText(status) {
  const statusMap = {
    'init': '初始化',
    'modeling': '建模中',
    'waiting_simulation': '待仿真',
    'simulating': '仿真中',
    'completed': '仿真完成',
    'error': '出错'
  };
  return statusMap[status] || '未知状态';
}

// 辅助函数：获取状态样式类
function get_status_class(status) {
  const statusClasses = {
    'init': 'status-init',
    'modeling': 'status-processing',
    'waiting_simulation': 'status-waiting',
    'simulating': 'status-processing',
    'completed': 'status-success',
    'error': 'status-error'
  };
  return statusClasses[status] || 'status-default';
}

export default DataVisualization;