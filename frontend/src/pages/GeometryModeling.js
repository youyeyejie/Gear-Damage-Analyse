import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Table } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import '../App.css';

const { Option } = Select;

function GeometryModeling({ updateProjectStatus }) {
  const [form] = Form.useForm();
  const [gearGroups, setGearGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [modelingResult, setModelingResult] = useState(null);
  const [isModeling, setIsModeling] = useState(false);
  const [damageType, setDamageType] = useState('');

  // 从JSON文件加载齿轮组数据
  useEffect(() => {
    const loadGearGroups = async () => {
      try {
        // 实际应用中，这里应该通过API从后端获取数据
        // 为了演示，我们使用模拟数据
        const mockData = {
          groups: Array(13).fill().map((_, index) => ({
            groupNumber: index + 1,
            masterGear: {
              model: `主齿轮模型 ${index + 1}`,
              parameters: {
                '中心距a（mm）': 70 + index * 5,
                '模数mn（mm）': 3 + index * 0.2,
                '齿数z': 18 + index,
                '变位系数x': 0 + index * 0.05,
                '螺旋角β（°）': 0 + index * 2,
                '压力角α（°）': 20 + index * 0.5,
                '齿顶圆da（mm）': `φ${75 + index * 5}`,
                '齿宽b（mm）': 30 + index * 2
              },
              materialProperties: {
                '材料名称': '齿轮钢',
                '密度（g/cm3）': '7.85',
                '弹性模量E（MPa）': '210 * 1000',
                '泊松比v': '0.3',
                '屈服应力（MPa）': '950',
                '强度系数K': '2000',
                '硬化指数n': '0.1',
                '摩擦系数': '0.15'
              },
              loadData: {
                '扭矩（N·m）': `额定${50 + index * 5}`,
                '转速（r/min）': `额定${10000 + index * 500}`
              }
            },
            slaveGear: {
              model: `从齿轮模型 ${index + 1}`,
              parameters: {
                '中心距a（mm）': 70 + index * 5,
                '模数mn（mm）': 3 + index * 0.2,
                '齿数z': 20 + index * 2,
                '变位系数x': 0 + index * 0.05,
                '螺旋角β（°）': 0 + index * 2,
                '压力角α（°）': 20 + index * 0.5,
                '齿顶圆da（mm）': `φ${80 + index * 6}`,
                '齿宽b（mm）': 15 + index * 1.5
              },
              materialProperties: {
                '材料名称': '齿轮钢',
                '密度（g/cm3）': '7.85',
                '弹性模量E（MPa）': '210 * 1000',
                '泊松比v': '0.3',
                '屈服应力（MPa）': '950',
                '强度系数K': '2000',
                '硬化指数n': '0.1',
                '摩擦系数': '0.15'
              },
              loadData: {
                '扭矩（N·m）': `额定${55 + index * 4}`,
                '转速（r/min）': `额定${9500 + index * 400}`
              }
            }
          }))
        };
        setGearGroups(mockData.groups);
      } catch (error) {
        message.error('加载齿轮组数据失败：' + error.message);
      }
    };

    loadGearGroups();

    // 模拟从AI识别页面获取损伤类型
    const mockDamageType = '齿面磨损';
    setDamageType(mockDamageType);
  }, []);

  const handleGroupChange = (groupId) => {
    const group = gearGroups.find(g => g.groupNumber === parseInt(groupId));
    setSelectedGroup(group);
  };

  const handleStartModeling = async () => {
    if (!selectedGroup) {
      message.error('请先选择齿轮配置组');
      return;
    }

    try {
      setIsModeling(true);
      updateProjectStatus('建模中');
      message.info('开始几何建模，请稍候...');

      // 模拟建模过程
      await new Promise(resolve => setTimeout(resolve, 4000));

      // 生成模拟结果
      const result = {
        groupNumber: selectedGroup.groupNumber,
        masterGearModel: selectedGroup.masterGear.model,
        slaveGearModel: selectedGroup.slaveGear.model,
        damageType: damageType,
        modelFile: `gear_model_group_${selectedGroup.groupNumber}_${damageType}.step`,
        modelPreviewUrl: '/preview/model.png', // 模拟预览图URL
        modeledAt: new Date().toLocaleString(),
      };

      setModelingResult(result);
      setIsModeling(false);
      updateProjectStatus('待仿真');
      message.success('几何建模完成！');
    } catch (error) {
      setIsModeling(false);
      updateProjectStatus('待建模');
      message.error('几何建模失败：' + error.message);
    }
  };

  const handleDownloadModel = () => {
    if (!modelingResult) {
      message.error('请先完成几何建模');
      return;
    }

    message.success(`开始下载几何模型文件：${modelingResult.modelFile}`);
  };

  // 准备表格数据
  const masterGearParams = selectedGroup ? Object.entries(selectedGroup.masterGear.parameters).map(([key, value]) => ({
    key: key,
    value: value
  })) : [];

  const slaveGearParams = selectedGroup ? Object.entries(selectedGroup.slaveGear.parameters).map(([key, value]) => ({
    key: key,
    value: value
  })) : [];

  const columns = [
    { title: '参数', dataIndex: 'key', key: 'key', width: '50%' },
    { title: '值', dataIndex: 'value', key: 'value' }
  ];

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '24px' }}>几何建模</h1>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>齿轮配置选择</h2>
        <Form form={form} layout="vertical">
          <Form.Item name="groupNumber" label="选择配置组" rules={[{ required: true, message: '请选择配置组' }]}>
            <Select placeholder="请选择配置组" onChange={handleGroupChange}>
              {gearGroups.map(group => (
                <Option key={group.groupNumber} value={group.groupNumber}>
                  第{group.groupNumber}组 - 主齿轮: {group.masterGear.model}, 从齿轮: {group.slaveGear.model}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="损伤类型">
            <Input value={damageType} readOnly />
          </Form.Item>
        </Form>
      </div>

      {selectedGroup && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>齿轮参数详情</h2>
          <Card title="主齿轮参数" bordered={true} style={{ marginBottom: '16px' }}>
            <Table columns={columns} dataSource={masterGearParams} rowKey="key" pagination={false} />
          </Card>
          <Card title="从齿轮参数" bordered={true}>
            <Table columns={columns} dataSource={slaveGearParams} rowKey="key" pagination={false} />
          </Card>
        </div>
      )}

      <div className="button-group" style={{ justifyContent: 'flex-start' }}>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStartModeling}
          loading={isModeling}
          disabled={isModeling || !selectedGroup}
        >
          开始建模
        </Button>
      </div>

      {modelingResult && (
        <div className="card" style={{ marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>建模结果</h2>
          <p><strong>配置组：</strong>第{modelingResult.groupNumber}组</p>
          <p><strong>主齿轮模型：</strong>{modelingResult.masterGearModel}</p>
          <p><strong>从齿轮模型：</strong>{modelingResult.slaveGearModel}</p>
          <p><strong>损伤类型：</strong>{modelingResult.damageType}</p>
          <p><strong>建模时间：</strong>{modelingResult.modeledAt}</p>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px', textAlign: 'center' }}>
            <h3>模型预览</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
              <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <p style={{ marginLeft: '16px' }}>齿轮3D模型预览图</p>
            </div>
          </div>

          <div className="button-group" style={{ justifyContent: 'flex-start', marginTop: '24px' }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadModel}>
              下载几何模型 (.STEP)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GeometryModeling;