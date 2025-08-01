import React, { useState } from 'react';
import { Form, Input, Button, Select, Table, Tabs, message } from 'antd';
import { UploadOutlined, DownloadOutlined, FolderOpenOutlined, SearchOutlined } from '@ant-design/icons';
import '../App.css';

const { Option } = Select;
const { TabPane } = Tabs;

// 模拟日志数据
const logData = [
  { id: 1, time: '2025-07-31 10:00:00', operation: '创建项目', type: '建模', description: '创建新项目：齿轮损伤识别测试' },
  { id: 2, time: '2025-07-31 10:05:00', operation: '上传图片', type: '识别', description: '上传损伤图片：gear_damage_1.jpg' },
  { id: 3, time: '2025-07-31 10:10:00', operation: '开始识别', type: '识别', description: '开始AI损伤识别' },
  { id: 4, time: '2025-07-31 10:15:00', operation: '识别完成', type: '识别', description: 'AI损伤识别完成，结果：齿面磨损' },
  { id: 5, time: '2025-07-31 10:20:00', operation: '开始建模', type: '建模', description: '根据识别结果开始几何建模' },
  { id: 6, time: '2025-07-31 10:30:00', operation: '建模完成', type: '建模', description: '几何建模完成，生成模型文件' },
  { id: 7, time: '2025-07-31 10:35:00', operation: '开始仿真', type: '仿真', description: '开始齿轮仿真分析' },
  { id: 8, time: '2025-07-31 11:00:00', operation: '仿真完成', type: '仿真', description: '齿轮仿真分析完成，生成报告' },
];

// 模拟可下载文件数据
const downloadData = [
  { id: 1, name: '齿轮几何模型.step', type: '几何模型', size: '2.5MB', time: '2025-07-31 10:30:00' },
  { id: 2, name: '仿真报告.pdf', type: '仿真报告', size: '1.8MB', time: '2025-07-31 11:00:00' },
  { id: 3, name: 'AI预测结果.xlsx', type: 'AI预测结果', size: '0.5MB', time: '2025-07-31 10:15:00' },
];

function ProjectSettings({ updateProjectStatus }) {
  const [form] = Form.useForm();
  const [logs, setLogs] = useState(logData);
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  const handleCreateProject = async (values) => {
    try {
      // 模拟创建项目
      const newProject = {
        id: Date.now(),
        name: values.projectName,
        path: values.projectPath,
        status: '待建模',
        createTime: new Date().toLocaleString(),
      };

      setProjects([...projects, newProject]);
      setCurrentProject(newProject);
      updateProjectStatus('待建模');
      message.success(`项目 ${values.projectName} 创建成功！`);
      form.resetFields();

      // 记录日志
      const newLog = {
        id: logs.length + 1,
        time: new Date().toLocaleString(),
        operation: '创建项目',
        type: '建模',
        description: `创建新项目：${values.projectName}`,
      };
      setLogs([newLog, ...logs]);
    } catch (error) {
      message.error('项目创建失败：' + error.message);
    }
  };

  const handleOpenProject = () => {
    // 模拟打开项目文件夹
    message.info('打开项目文件夹对话框...');
    // 这里应该调用系统API打开文件选择器，但前端无法直接实现，需要后端支持
  };

  const handleDownload = (file) => {
    message.success(`开始下载 ${file.name}...`);
    // 记录日志
    const newLog = {
      id: logs.length + 1,
      time: new Date().toLocaleString(),
      operation: '下载文件',
      type: file.type === '几何模型' ? '建模' : file.type === '仿真报告' ? '仿真' : '识别',
      description: `下载文件：${file.name}`,
    };
    setLogs([newLog, ...logs]);
  };

  const handleLogTypeChange = (type) => {
    setSelectedLogType(type);
  };

  const filteredLogs = selectedLogType === 'all'
    ? logs
    : logs.filter(log => log.type === selectedLogType);

  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: '20%' },
    { title: '操作', dataIndex: 'operation', key: 'operation', width: '15%' },
    { title: '类型', dataIndex: 'type', key: 'type', width: '10%' },
    { title: '描述', dataIndex: 'description', key: 'description' },
  ];

  const downloadColumns = [
    { title: '文件名', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', width: '15%' },
    { title: '大小', dataIndex: 'size', key: 'size', width: '10%' },
    { title: '创建时间', dataIndex: 'time', key: 'time', width: '20%' },
    { title: '操作', key: 'action', width: '10%', render: (_, record) => (
      <Button type="primary" icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)}>
        下载
      </Button>
    )},
  ];

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '24px' }}>项目设置&日志/下载</h1>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>项目管理</h2>
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]} style={{ flex: 1 }}>
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item name="projectPath" label="项目路径" rules={[{ required: true, message: '请输入项目路径' }]} style={{ flex: 2 }}>
              <Input placeholder="请输入项目路径" />
            </Form.Item>
          </div>
          <div className="button-group" style={{ justifyContent: 'flex-start' }}>
            <Button type="primary" htmlType="submit" icon={<UploadOutlined />}>
              创建项目
            </Button>
            <Button type="default" icon={<FolderOpenOutlined />} onClick={handleOpenProject}>
              读取项目
            </Button>
          </div>
        </Form>

        {currentProject && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
            <h3>当前项目信息</h3>
            <p>项目名称：{currentProject.name}</p>
            <p>项目路径：{currentProject.path}</p>
            <p>创建时间：{currentProject.createTime}</p>
            <p>项目状态：<span className={`status-tag ${currentProject.status === '待建模' || currentProject.status === '待仿真' ? 'pending' : currentProject.status.includes('中') ? 'processing' : 'completed'}`}>{currentProject.status}</span></p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>日志/下载</h2>
        <Tabs defaultActiveKey="logs">
          <TabPane tab="操作日志" key="logs">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Select defaultValue="all" style={{ width: 150 }} onChange={handleLogTypeChange}>
                  <Option value="all">全部日志</Option>
                  <Option value="建模">建模日志</Option>
                  <Option value="仿真">仿真日志</Option>
                  <Option value="识别">识别日志</Option>
                </Select>
              </div>
              <div>
                <Input placeholder="搜索日志..." prefix={<SearchOutlined />} style={{ width: 200 }} />
              </div>
            </div>
            <Table columns={logColumns} dataSource={filteredLogs} rowKey="id" pagination={{ pageSize: 5 }} />
          </TabPane>
          <TabPane tab="下载中心" key="downloads">
            <Table columns={downloadColumns} dataSource={downloadData} rowKey="id" pagination={{ pageSize: 5 }} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}

export default ProjectSettings;