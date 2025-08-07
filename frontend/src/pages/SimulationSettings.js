import React, { useState, useEffect } from 'react';
import { Form, Button, Select, Card, message, Table, Row, Col, Image } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function SimulationSettings() {
    const [form] = Form.useForm();
    const {
        logs, //日志列表
        setLogs, //更新日志列表
        currentProject, //当前项目相关信息
        setCurrentProject, //更新当前项目
        downloadFile, //下载文件
        gearData, //齿轮数据
        loadGearData, //加载齿轮数据
    } = useProjectContext();
    const [isSimulating, setIsSimulating] = useState(false);

    // 从JSON文件加载齿轮组数据
    useEffect(() => { 
        loadGearData();
    }, []); // eslint-disable-line

    const handleStartSimulation = async () => {
        if (!currentProject.detectionResult.heatmap?.length) {
            message.warning('请先进行损伤识别');
            setTimeout(() => {
                window.location.href = '/ai-detection';
            }, 500);
            return;
        }
        if (!currentProject.selectedGearGroup.groupNumber || !currentProject.modelingResult.model.name) {
            message.warning('请先完成几何建模');
            setTimeout(() => {
                window.location.href = '/geometry-modeling';
            }, 500);
            return;
        }
        setIsSimulating(true);
        const updatedCurrentProject = {
            ...currentProject,
            projectInfo: {
                ...currentProject.projectInfo,
                status: '仿真中',
            },
        };
        setCurrentProject(updatedCurrentProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));

        try {
            const response = await fetch('http://localhost:5000/api/simulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {
                        gearGroupNumber: currentProject.selectedGearGroup.groupNumber,
                        isDamage: currentProject.detectionResult.output.isDamage,
                        model: {
                            name: currentProject.modelingResult.model.name,
                        },
                    },
                }),
            });

            const resData = await response.json();
            setIsSimulating(false);
            
            if (resData.code === '200') {
                const id = Date.now();

                const stress_cloudmap = {
                    id: id,
                    name: resData.data.stress_cloudmap.name,
                    type: '仿真应力云图',
                    size: resData.data.stress_cloudmap.size,
                    time: new Date().toLocaleString(),
                };
                const remain_life_cloudmap = {
                    id: id + 1,
                    name: resData.data.remain_life_cloudmap.name,
                    type: '仿真剩余寿命云图',
                    size: resData.data.remain_life_cloudmap.size,
                    time: new Date().toLocaleString(),
                };

                const updatedCurrentProject = {
                    ...currentProject,
                    projectInfo: {
                        ...currentProject.projectInfo,
                        status: '仿真完成',
                    },
                    simulationResult: resData.data,
                    downloadFileList: [...currentProject.downloadFileList, stress_cloudmap, remain_life_cloudmap],
                };
                setCurrentProject(updatedCurrentProject);
                sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
                const updatedLogs = [{
                    id: id,
                    type: '仿真',
                    operation: '仿真成功',
                    description: '状态更新为：仿真成功',
                    time: new Date().toLocaleString(),
                }, {
                    id: id + 1,
                    type: '仿真',
                    operation: '新增可下载文件',
                    description: `新增仿真应力云图：${stress_cloudmap.name}，大小${stress_cloudmap.size}`,
                    time: new Date().toLocaleString(),
                }, {
                    id: id + 2,
                    type: '仿真',
                    operation: '新增可下载文件',
                    description: `新增剩余寿命云图：${remain_life_cloudmap.name}，大小${remain_life_cloudmap.size}`,
                    time: new Date().toLocaleString(),
                }, ...logs];
                setLogs(updatedLogs);
                sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
                message.success('仿真成功');
            } else {
                throw new Error(resData.msg);
            }
        } catch (error) {
            setIsSimulating(false);
            message.error(`仿真失败: ${error.message}`);
            const updatedCurrentProject = {
                ...currentProject,
                projectInfo: {
                    ...currentProject.projectInfo,
                    status: '待仿真',
                },
            };
            setCurrentProject(updatedCurrentProject);
            sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
            const updatedLogs = [{
                id: Date.now(),
                type: '仿真',
                operation: '仿真失败',
                description: `仿真失败: ${error.message}`,
                time: new Date().toLocaleString(),
            }, ...logs];
            setLogs(updatedLogs);
            sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
        }
    };

    const handleDownloadStressImage = () => {
        if (!currentProject.simulationResult.stress_cloudmap?.name) {
            message.error('请先完成仿真计算');
            return;
        }
        downloadFile(currentProject.simulationResult.stress_cloudmap);
    };

    const handleDownloadRemainLifeImage = () => {
        if (!currentProject.simulationResult.remain_life_cloudmap?.name) {
            message.error('请先完成仿真计算');
            return;
        }
        downloadFile(currentProject.simulationResult.remain_life_cloudmap);
    };

    const renderCloudmap = (cloudmapName) => {
        if (!currentProject.simulationResult[cloudmapName]?.name) {
            return (
                <div className="empty-state">
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginLeft: '16px' }}>暂无{cloudmapName === "stress_cloudmap" ? '仿真应力云图' : '仿真剩余寿命云图'}预览</p>
                </div>
            );
        }
        
        // 构建图片URL
        const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${currentProject.simulationResult[cloudmapName].name}`;

        return (
            <div style={{ width: '100%', textAlign: 'center' }}>
                <Image
                    src={imageUrl}
                    alt={cloudmapName}
                    style={{ maxWidth: '100%', maxHeight: '450px' }}
                />
            </div>
        );
    }


    // 准备表格数据
    const masterGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.masterGear.materialProperties).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const slaveGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.slaveGear.materialProperties).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];
    const masterGearLoad = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.masterGear.loadData).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const slaveGearLoad = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.slaveGear.loadData).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const columns = [
        { title: '参数', dataIndex: 'key', key: 'key', width: '50%' },
        { title: '值', dataIndex: 'value', key: 'value' }
    ];
    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '24px' }}>仿真计算</h1>

            <div className="card">
                <h2 style={{ marginBottom: '16px' }}>仿真参数</h2>
                <Form form={form} layout="vertical">
                    <Form.Item 
                        name="groupNumber" 
                        label="选择配置组" 
                        rules={[{ required: true, message: '请在“几何建模”页面选择配置组' }]} 
                        initialValue={currentProject.selectedGearGroup?.groupNumber}
                    >
                        <Select placeholder="请在“几何建模”页面选择配置组" disabled>
                            {gearData.map(group => (
                                <Option key={group.groupNumber} value={group.groupNumber}>
                                    第{group.groupNumber}组 - 主齿轮: {group.masterGear.model}, 从齿轮: {group.slaveGear.model}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        name="isDamage"
                        label="损伤情况" 
                        rules={[{ required: true, message: '请在“损伤识别”页面完成智能识别' }]} 
                        initialValue={currentProject.detectionResult.output?.isDamage}
                        disabled={true}
                    >
                        <Select placeholder="请在“损伤识别”页面完成智能识别" disabled>
                            <Option value={true}>有损</Option>
                            <Option value={false}>无损</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item 
                        name="geometryModel"
                        label="几何模型" 
                        rules={[{ required: true, message: '请在“几何建模”页面完成建模' }]} 
                        initialValue={currentProject.modelingResult.model?.name}
                        disabled={true}
                    >
                        <Select 
                            placeholder="请在“几何建模”页面完成建模" 
                            disabled
                            prefix={<UploadOutlined />}
                        >
                            <Option value={currentProject.modelingResult.model?.name}>{currentProject.modelingResult.model?.name}</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-start' }}>
                <Button
                    type="primary"
                    style={{ marginRight: '16px' }}
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartSimulation}
                    loading={isSimulating}
                    disabled={isSimulating}
                >
                    开始仿真
                </Button>
                <Button 
                    style={{ marginRight: '16px' }}
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={handleDownloadStressImage}
                    hidden={!currentProject.simulationResult.stress_cloudmap?.name}
                >
                    下载应力云图
                </Button>
                <Button 
                    style={{ marginRight: '16px' }}
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={handleDownloadRemainLifeImage}
                    hidden={!currentProject.simulationResult.remain_life_cloudmap?.name}
                >
                    下载剩余寿命云图
                </Button>
            </div>

            {currentProject.simulationResult.stress_cloudmap.name && currentProject.simulationResult.remain_life_cloudmap.name && !isSimulating && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>仿真结果</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>应力云图</h3>
                                {renderCloudmap('stress_cloudmap')}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>剩余寿命云图</h3>
                                    <p><strong>剩余寿命预测：</strong>{currentProject?.simulationResult?.output?.remainLife || 'N/A'}</p>
                                {renderCloudmap('remain_life_cloudmap')}
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            {currentProject.selectedGearGroup?.groupNumber && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>齿轮工况详情</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card title="主齿轮材料属性" variant="outlined" style={{ minWidth: '300px', marginBottom: '16px' }}>
                                <Table columns={columns} dataSource={masterGearParams} rowKey="key" pagination={false} />
                            </Card>
                            <Card title="主齿轮载荷数据" variant="outlined" style={{ minWidth: '300px', marginBottom: '16px' }}>
                                <Table columns={columns} dataSource={masterGearLoad} rowKey="key" pagination={false} />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title="从齿轮材料属性" variant="outlined" style={{ minWidth: '300px', marginBottom: '16px' }}>
                                <Table columns={columns} dataSource={slaveGearParams} rowKey="key" pagination={false} />
                            </Card>
                            <Card title="从齿轮载荷数据" variant="outlined" style={{ minWidth: '300px', marginBottom: '16px' }}>
                                <Table columns={columns} dataSource={slaveGearLoad} rowKey="key" pagination={false} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}

export default SimulationSettings;