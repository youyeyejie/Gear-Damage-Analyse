import React, { useState } from 'react';
import { Button, Upload, message, Card, Row, Col } from 'antd';
import { UploadOutlined, DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../App.css';

// 模拟损伤类型数据
const damageTypes = [
  { name: '齿面磨损', value: 45 },
  { name: '齿根裂纹', value: 30 },
  { name: '齿面胶合', value: 15 },
  { name: '齿面点蚀', value: 10 },
];

// 模拟热力图数据（简化版）
const heatmapData = Array(10).fill().map(() => Array(10).fill().map(() => Math.random() * 100));

function AIDetection({ updateProjectStatus }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleUploadChange = ({ fileList }) => {
    setUploadedFiles(fileList);
  };

  const handleStartDetection = async () => {
    if (uploadedFiles.length === 0) {
      message.error('请先上传损伤图片');
      return;
    }

    try {
      setIsDetecting(true);
      updateProjectStatus('识别中');
      message.info('开始AI识别，请稍候...');

      // 模拟AI识别过程
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 生成模拟结果
      const result = {
        damageType: '齿面磨损',
        damageArea: '25.3%',
        correlation: '0.87',
        confidence: '92%',
        heatmapData: heatmapData,
        detectedAt: new Date().toLocaleString(),
      };

      setDetectionResult(result);
      setIsDetecting(false);
      updateProjectStatus('待建模');
      message.success('AI识别完成！');
    } catch (error) {
      setIsDetecting(false);
      updateProjectStatus('待建模');
      message.error('AI识别失败：' + error.message);
    }
  };

  const handleDownloadReport = () => {
    if (!detectionResult) {
      message.error('请先完成AI识别');
      return;
    }

    message.success('开始下载AI预测报告...');
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>点击上传</div>
    </div>
  );

  // 渲染热力图（简化版）
  const renderHeatmap = () => {
    if (!detectionResult) return null;

    return (
      <div className="card" style={{ marginTop: '24px' }}>
        <h3>损伤热力图</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px', marginTop: '16px' }}>
          {detectionResult.heatmapData.map((row, i) => (
            row.map((value, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  height: '20px',
                  backgroundColor: `rgba(255, 0, 0, ${value / 100})`,
                  border: '1px solid #ddd'
                }}
                title={`(${i},${j}): ${value.toFixed(2)}`}
              />
            ))
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '24px' }}>AI识别</h1>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>损伤图片上传</h2>
        <Upload
          listType="picture-card"
          fileList={uploadedFiles}
          onChange={handleUploadChange}
          multiple
          accept="image/*"
        >
          {uploadButton}
        </Upload>
      </div>

      <div className="button-group" style={{ justifyContent: 'flex-start' }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartDetection}
          loading={isDetecting}
          disabled={isDetecting}
        >
          开始识别
        </Button>
      </div>

      {detectionResult && (
        <>
          <div className="card" style={{ marginTop: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="损伤信息" bordered={true}>
                  <p><strong>损伤类型：</strong>{detectionResult.damageType}</p>
                  <p><strong>损伤面积：</strong>{detectionResult.damageArea}</p>
                  <p><strong>关联性：</strong>{detectionResult.correlation}</p>
                  <p><strong>置信度：</strong>{detectionResult.confidence}</p>
                  <p><strong>识别时间：</strong>{detectionResult.detectedAt}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="损伤类型分布" bordered={true} style={{ height: '100%' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={damageTypes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#1890ff" name="占比(%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>

          {renderHeatmap()}

          <div className="button-group" style={{ justifyContent: 'flex-start', marginTop: '24px' }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadReport}>
              下载AI预测报告
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default AIDetection;