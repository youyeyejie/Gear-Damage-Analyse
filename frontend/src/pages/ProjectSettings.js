import React from 'react';
import { useProjectContext } from '../AppContext';
import { Form, Input, Button, Select, Table, Tabs, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import '../App.css';

const { Option } = Select;

function ProjectSettings() {
    const [form] = Form.useForm();
    const {
        filteredLogs, //筛选出来日志列表
        setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        // setCurrentProject, //更新当前项目
        createProject, //创建项目
        // updateProjectStatus, //更新项目状态

        // updateDownloadFileList, //更新下载文件列表
        downloadFile, //下载文件
    } = useProjectContext();

    const handleCreateProject = async (values) => {
        try {
            // 向后端API发送创建项目请求
            const response = await fetch('/api/createProject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: values.projectName,
                    projectPath: values.projectPath
                })
            });
            
            // 检查响应是否成功
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('项目已存在');
                } else {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }
            }
            const resData = await response.json();
            if (resData.code !== '0') {
                throw new Error(resData.msg);
            }

            // 项目创建成功，更新项目列表
            createProject(values.projectName, values.projectPath);
            message.success(`项目 ${values.projectName} 创建成功`); 
            form.resetFields();
        } catch (error) {
            message.error('创建项目失败：' + error.message); 
        }
    };

    const handleDownload = async (file) => {
        downloadFile(file);  
    };

    const handleLogTypeChange = (type) => {
        setSelectedLogType(type);
    };

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
        {
            title: '操作', key: 'action', width: '10%', render: (_, record) => (
                <Button type="primary" icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)}>
                    下载
                </Button>
            )
        },
    ];

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '24px' }}>项目设置</h1>

            <div className="card">
                <h2 style={{ marginBottom: '16px' }}>项目管理</h2>
                <Form form={form} layout="vertical" onFinish={handleCreateProject} initialValues={{ projectPath: 'Data' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]} style={{ flex: 1 }}>
                            <Input placeholder={currentProject.projectInfo.name ? `当前项目名称：${currentProject.projectInfo.name}` : "请输入项目名称"} />
                        </Form.Item>
                        <Form.Item name="projectPath" label="项目路径" rules={[{ required: true, message: '请输入项目路径' }]} style={{ flex: 2 }}>
                            <Input placeholder="请输入项目路径 e.g. C:\Users\Desktop" />
                        </Form.Item>
                    </div>
                    <div className="button-group" style={{ justifyContent: 'flex-start' }}>
                        <Button type="primary" htmlType="submit" icon={<UploadOutlined />}>
                            创建项目
                        </Button>
                    </div>
                </Form>

                {currentProject.projectInfo.id && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '16px' }}>当前项目信息</h3>
                        <p>项目名称：{currentProject.projectInfo.name}</p>
                        <p>项目路径：{currentProject.projectInfo.path}</p>
                        <p>创建时间：{currentProject.projectInfo.createTime}</p>
                        <p>项目状态：<span className={`status-tag ${currentProject.projectInfo.status.includes('待') ? 'pending' : currentProject.projectInfo.status.includes('中') ? 'processing' : currentProject.projectInfo.status.includes('已') ? 'completed' : 'failed'}`}>{currentProject.projectInfo.status}</span></p>
                    </div>
                )}
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '16px' }}>日志/下载</h2>
                <Tabs 
                    defaultActiveKey="logs"
                    items={[
                        {
                            key: 'logs',
                            label: '操作日志',
                            children: (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div>
                                            <Select defaultValue="all" style={{ width: 150 }} onChange={handleLogTypeChange}>
                                                <Option value="all">全部日志</Option>
                                                <Option value="建模">建模日志</Option>
                                                <Option value="仿真">仿真日志</Option>
                                                <Option value="识别">识别日志</Option>
                                            </Select>
                                        </div>
                                    </div>
                                    <Table columns={logColumns} dataSource={filteredLogs} rowKey="id" pagination={{ pageSize: 15 }} />
                                </div>
                            ),
                        },
                        {
                            key: 'downloads',
                            label: '下载中心',
                            children: <Table columns={downloadColumns} dataSource={currentProject.downloadFileList} rowKey="id" pagination={{ pageSize: 5 }} />,
                        },
                    ]}
                />
            </div>
        </div>
    );
}

export default ProjectSettings;