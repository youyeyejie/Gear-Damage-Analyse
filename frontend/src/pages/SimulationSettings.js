import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Upload, Checkbox } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import '../App.css';

const { Option } = Select;

function SimulationSettings({ updateProjectStatus, modelingResult }) {
  const [form] = Form.useForm();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [meshDensity, setMeshDensity] = useState('medium');
  const [boundaryConditions, setBoundaryConditions] = useState({});
  const [loadSettings, setLoadSettings] = useState({ force: 0, pressure: 0, current: 0 });
  const [fileList, setFileList] = useState([]);

  // 材料库数据
  const materials = [
    { id: 1, name: '齿轮钢', density: 7.85, elasticModulus: 210000, poissonRatio: 0.3, yieldStrength: 950 },
    { id: 2, name: '铝合金', density: 2.7, elasticModulus: 70000, poissonRatio: 0.33, yieldStrength: 300 },
    { id: 3, name: '不锈钢', density: 7.9, elasticModulus: 193000, poissonRatio: 0.3, yieldStrength: 500 },
    { id: 4, name: '铸铁', density: 7.2, elasticModulus: 110000, poissonRatio: 0.25, yieldStrength: 250 },
  ];

  // 边界条件选项
  const boundaryOptions = [
    { id: 'fixed', name: '固定边' },
    { id: 'loaded', name: '加载面' },
    { id: 'symmetry', name: '对称面' },
    { id: 'free', name: '自由边界' },
  ];

  // 当建模结果更新时，自动设置文件列表
  useEffect(() => {
    if (modelingResult && modelingResult.modelFile) {
      setFileList([{
        name: modelingResult.modelFile,
        status: 'done',
        url: `/download/${modelingResult.modelFile}`,
        isModelFile: true
      }]);
    }
  }, [modelingResult]);

  const handleMaterialChange = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    setSelectedMaterial(material);
  };

  const handleMeshDensityChange = (density) => {
    setMeshDensity(density);
  };

  const handleBoundaryChange = (e) => {
    const { name, checked } = e.target;
    setBoundaryConditions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleLoadChange = (field, value) => {
    setLoadSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const handleStartSimulation = async () => {
    // 验证是否已上传模型文件
    if (fileList.length === 0) {
      message.error('请先上传几何模型文件');
      return;
    }

    // 验证是否已选择材料
    if (!selectedMaterial) {
      message.error('请先选择材料类型');
      return;
    }

    // 验证是否已选择边界条件
    const hasBoundary = Object.values(boundaryConditions).some(Boolean);
    if (!hasBoundary) {
      message.error('请至少选择一个边界条件');
      return;
    }

    // 验证是否已设置载荷
    const hasLoad = Object.values(loadSettings).some(v => v > 0);
    if (!hasLoad) {
      message.error('请至少设置一个载荷参数');
      return;
    }

    try {
      setIsSimulating(true);
      updateProjectStatus('仿真中');
      message.info('开始仿真计算，请稍候...');

      // 模拟仿真过程
      await new Promise(resolve => setTimeout(resolve, 6000));

      // 生成模拟结果
      const result = {
        material: selectedMaterial.name,
        meshDensity: {
          low: '低密度',
          medium: '中密度',
          high: '高密度'
        }[meshDensity],
        boundaryConditions: Object.entries(boundaryConditions)
          .filter(([_, value]) => value)
          .map(([key]) => boundaryOptions.find(option => option.id === key)?.name || key),
        loadSettings: loadSettings,
        reportFile: 'simulation_report.pdf',
        stressImageUrl: '/preview/stress.png',
        simulatedAt: new Date().toLocaleString(),
      };

      setSimulationResult(result);
      setIsSimulating(false);
      updateProjectStatus('仿真完成');
      message.success('仿真计算完成！');
    } catch (error) {
      setIsSimulating(false);
      updateProjectStatus('待仿真');
      message.error('仿真计算失败：' + error.message);
    }
  };

  const handleDownloadReport = () => {
    if (!simulationResult) {
      message.error('请先完成仿真计算');
      return;
    }

    message.success(`开始下载仿真报告：${simulationResult.reportFile}`);
  };

  const handleDownloadStressImage = () => {
    if (!simulationResult) {
      message.error('请先完成仿真计算');
      return;
    }

    message.success('开始下载应力云图');
  };

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '24px' }}>仿真设置</h1>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>几何模型上传</h2>
        <Upload
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={() => false} // 阻止自动上传
          accept=".step,.stl,.obj"
        >
          <Button icon={<UploadOutlined />}>点击上传几何模型</Button>
        </Upload>
        <p style={{ marginTop: '8px', color: '#666' }}>支持格式：.step, .stl, .obj</p>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>材料类型选择</h2>
        <Form form={form} layout="vertical">
          <Form.Item name="material" label="选择材料" rules={[{ required: true, message: '请选择材料' }]}>
            <Select placeholder="请选择材料" onChange={handleMaterialChange}>
              {materials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name} (密度: {material.density}g/cm³, 弹性模量: {material.elasticModulus}MPa)
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedMaterial && (
            <Card title="材料属性" bordered={true} style={{ marginTop: '16px' }}>
              <p><strong>密度：</strong>{selectedMaterial.density} g/cm³</p>
              <p><strong>弹性模量：</strong>{selectedMaterial.elasticModulus} MPa</p>
              <p><strong>泊松比：</strong>{selectedMaterial.poissonRatio}</p>
              <p><strong>屈服强度：</strong>{selectedMaterial.yieldStrength} MPa</p>
            </Card>
          )}
        </Form>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>网格密度设置</h2>
        <Select
          defaultValue="medium"
          style={{ width: '100%' }}
          onChange={handleMeshDensityChange}
        >
          <Option value="low">低密度</Option>
          <Option value="medium">中密度</Option>
          <Option value="high">高密度</Option>
        </Select>
        <p style={{ marginTop: '8px', color: '#666' }}>低密度: 计算速度快，精度较低 | 高密度: 计算速度慢，精度高</p>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>边界条件设置</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {boundaryOptions.map(option => (
            <Checkbox
              key={option.id}
              name={option.id}
              onChange={handleBoundaryChange}
            >
              {option.name}
            </Checkbox>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>载荷设置</h2>
        <Form form={form} layout="vertical">
          <Form.Item name="force" label="力 (N)">
            <Input
              type="number"
              onChange={(e) => handleLoadChange('force', e.target.value)}
              placeholder="输入力的值"
            />
          </Form.Item>
          <Form.Item name="pressure" label="压力 (MPa)">
            <Input
              type="number"
              onChange={(e) => handleLoadChange('pressure', e.target.value)}
              placeholder="输入压力的值"
            />
          </Form.Item>
          <Form.Item name="current" label="电流 (A)">
            <Input
              type="number"
              onChange={(e) => handleLoadChange('current', e.target.value)}
              placeholder="输入电流的值"
            />
          </Form.Item>
        </Form>
      </div>

      <div className="button-group" style={{ justifyContent: 'flex-start' }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartSimulation}
          loading={isSimulating}
          disabled={isSimulating}
        >
          开始仿真
        </Button>
      </div>

      {simulationResult && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>仿真结果</h2>
          <p><strong>材料：</strong>{simulationResult.material}</p>
          <p><strong>网格密度：</strong>{simulationResult.meshDensity}</p>
          <p><strong>边界条件：</strong>{simulationResult.boundaryConditions.join(', ')}</p>
          <p><strong>载荷设置：</strong>
            力: {simulationResult.loadSettings.force}N, 
            压力: {simulationResult.loadSettings.pressure}MPa, 
            电流: {simulationResult.loadSettings.current}A
          </p>
          <p><strong>仿真时间：</strong>{simulationResult.simulatedAt}</p>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px', textAlign: 'center' }}>
            <h3>应力云图</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
              <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <p style={{ marginLeft: '16px' }}>应力分布云图预览</p>
            </div>
          </div>

          <div className="button-group" style={{ justifyContent: 'flex-start', marginTop: '24px' }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadReport} style={{ marginRight: '16px' }}>
              下载仿真报告
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadStressImage}>
              下载应力云图
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationSettings;