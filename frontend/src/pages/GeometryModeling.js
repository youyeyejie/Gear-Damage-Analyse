import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Table } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function GeometryModeling() {
    const {
        // filteredLogs, //筛选出来日志列表
        // setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        // setCurrentProject, //更新当前项目
        // createProject, //创建项目
        updateProjectStatus, //更新项目状态

        updateDownloadFileList, //更新下载文件列表
        downloadFile, //下载文件

        // updateUploadFileList, //更新上传文件列表
        // clearUploadFileList, //清空上传文件列表

        // updateDetectionResult, //更新识别结果
        
        gearData, //齿轮数据
        loadGearData, //加载齿轮数据
        updateSelectedGearGroup, //更新齿轮组
        updateModelingResult, //更新建模结果
    } = useProjectContext();
    const [form] = Form.useForm();
    // const [gearGroups, setGearGroups] = useState([]);
    // const [selectedGearGroup, setSelectedGearGroup] = useState(null);
    // const [modelingResult, setModelingResult] = useState(null);
    const [isModeling, setIsModeling] = useState(false);
    // const [damageType, setDamageType] = useState('');

    // 从JSON文件加载齿轮组数据
    useEffect(() => { 
        loadGearData();
    }, []); // eslint-disable-line

    const handleGroupChange = (groupId) => {
        if (!currentProject.projectInfo.id) {
            message.warn('请先创建项目');
            return;
        }
        const group = gearData.find(g => g.groupNumber === parseInt(groupId));
        updateSelectedGearGroup(group);
    };

    const handleStartModeling = async () => {
        if (!currentProject.selectedGearGroup) {
            message.error('请先选择齿轮配置组');
            return;
        }
        if (!currentProject.detectionResult.damageType) {
            message.error('请先进行损伤识别');
            return;
        }

        try {
            setIsModeling(true);
            updateProjectStatus('建模中');
            message.info('开始几何建模，请稍候...');

            const response = await fetch('http://localhost:5000/api/geometryModeling', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    groupNumber: currentProject.selectedGearGroup.groupNumber,
                    detectionResult: currentProject.detectionResult,
                })
            });

            const resData = await response.json();
            setIsModeling(false);

            if (resData.code === '200') {
                updateProjectStatus('建模完成，待仿真');
                // 识别成功，更新结果
                const result = {
                    model: {
                        name: resData.data.model.name,
                        size: resData.data.model.size,
                    },
                };
                updateModelingResult(result);
                console.log(1, result);
                console.log(2, currentProject);

                // 添加模型到下载列表
                const modelFile = {
                    id: Date.now(),
                    name: resData.data.model.name,
                    type: '几何模型',
                    size: resData.data.model.size,
                    time: new Date().toLocaleString()
                };
                updateDownloadFileList(modelFile);
                console.log(3, currentProject);

                message.success('几何建模完成');
            } else {
                updateProjectStatus('待建模');
                message.error('几何建模失败：' + resData.msg);
            }
        } catch (error) {
            setIsModeling(false);
            updateProjectStatus('待建模');
            message.error('几何建模失败：' + error.message);
        }
    };

    // 下载模型
    const handleDownloadModel = () => {
        if (!currentProject.modelingResult.model.name) {
            message.warning('请先完成几何建模');
            return;
        }
        downloadFile(currentProject.modelingResult.model);
    };

    // 准备表格数据
    const masterGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.masterGear.parameters).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const slaveGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.slaveGear.parameters).map(([key, value]) => ({
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
                    <Form.Item 
                        name="groupNumber" 
                        label="选择配置组" 
                        rules={[{ required: true, message: '请选择配置组' }]} 
                        initialValue={currentProject.selectedGearGroup?.groupNumber}
                    >
                        <Select placeholder="请选择配置组" onChange={handleGroupChange} >
                            {gearData.map(group => (
                                <Option key={group.groupNumber} value={group.groupNumber}>
                                    第{group.groupNumber}组 - 主齿轮: {group.masterGear.model}, 从齿轮: {group.slaveGear.model}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="损伤类型">
                        <Input value={currentProject.detectionResult.damageType} placeholder="请先进行识别" readOnly />
                    </Form.Item>
                </Form>
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-start' }}>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartModeling}
                    loading={isModeling}
                    style={{ marginRight: '16px' }}
                >
                    开始建模
                </Button>
                <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadModel}
                    hidden={!currentProject.modelingResult.model.name}
                    style={{ marginRight: '16px' }}
                >
                    下载几何模型 (.STEP)
                </Button>
            </div>
            {currentProject.modelingResult?.model.name && (
            // {currentProject.modelingResult && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
                            <h2 style={{ marginBottom: '16px' }}>建模结果</h2>
                            <p><strong>配置组：</strong>第{currentProject.selectedGearGroup.groupNumber}组</p>
                            <p><strong>主齿轮模型：</strong>{currentProject.selectedGearGroup.masterGear.model}</p>
                            <p><strong>从齿轮模型：</strong>{currentProject.selectedGearGroup.slaveGear.model}</p>
                            <p><strong>损伤类型：</strong>{currentProject.detectionResult.damageType}</p>
                        </div>
                        <div style={{ flex: 1, padding: '16px', background: '#f0f2f5', borderRadius: '8px', textAlign: 'center' }}>
                            <h3>模型预览</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
                                <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', marginLeft: '16px' }}>
                                    <p>齿轮3D模型预览图</p>
                                    <p>暂不支持.STEP格式</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentProject.selectedGearGroup?.groupNumber && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>齿轮参数详情</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <Card title="主齿轮参数" variant="outlined" style={{ flex: 1, minWidth: '300px', marginBottom: 0 }}>
                            <Table columns={columns} dataSource={masterGearParams} rowKey="key" pagination={false} />
                        </Card>
                        <Card title="从齿轮参数" variant="outlined" style={{ flex: 1, minWidth: '300px' }}>
                            <Table columns={columns} dataSource={slaveGearParams} rowKey="key" pagination={false} />
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeometryModeling;