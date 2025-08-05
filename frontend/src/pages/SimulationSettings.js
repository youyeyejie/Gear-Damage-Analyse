import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Upload, Checkbox, Table, Row, Col, Image, Divider } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

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
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [meshDensity, setMeshDensity] = useState(currentProject.simulationResult.input.meshDensity || 'low');
    const [boundaryCondition, setBoundaryCondition] = useState(currentProject.simulationResult.input.boundaryCondition);

    // 边界条件选项
    const boundaryOptions = [
        { id: 'fixed', name: '固定边' },
        { id: 'loaded', name: '加载面' },
        { id: 'symmetry', name: '对称面' },
        { id: 'free', name: '自由边界' },
    ];

    // 从JSON文件加载齿轮组数据
    useEffect(() => { 
        loadGearData();
    }, []); // eslint-disable-line

    const handleUploadChange = ({ fileList: currentFileList, file: currentFile }) => {
        if (!currentProject.projectInfo.id) {
            message.warning('请先创建项目');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
            return;
        }
        const updatedCurrentProject = {
            ...currentProject,
            uploadFileList: {
                ...currentProject.uploadFileList,
                geometryModel: currentFileList,
            },
        };
        setCurrentProject(updatedCurrentProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
        
        if (currentFile.status === "error") {
            message.error(currentFile.response?.msg || '上传失败');
        } else if (currentFile.status === "done") {
            message.success(currentFile.response?.msg || '上传成功');
            const updatedLogs = [{
                id: Date.now(),
                type: '仿真',
                operation: '上传文件',
                description: `上传文件: ${currentFile.name}`,
                time: new Date().toLocaleString(),
            }, ...logs];
            setLogs(updatedLogs);
            sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
        }
    };

    // 删除上传文件
    const handleRemoveFile = (file) => {
        try {
            // 向后端发送删除请求
            fetch('http://localhost:5000/api/deleteFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName: file.response.data.fileName })
            }).then(response => response.json())
                .then(resData => {
                    if (resData.code === '200') {
                        // 删除成功，更新前端状态
                        const updatedCurrentProject = {
                            ...currentProject,
                            uploadFileList: {
                                ...currentProject.uploadFileList,
                                geometryModel: null,
                            }
                        };
                        setCurrentProject(updatedCurrentProject);
                        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
                        message.success(`已删除文件: ${file.name}`);
                    } else {
                        message.error(`删除失败: ${resData.msg}`);
                    }
                });
        } catch (error) {
            message.error(`删除失败: ${error.message}`);
        }
    };


    const handleStartSimulation = async () => {
        // 验证是否已上传模型文件
        if (currentProject.uploadFileList.geometryModel.length === 0) {
            message.warning('请先上传几何模型文件');
            return;
        }
        // 验证是否已选择边界条件
        const hasBoundary = boundaryCondition ? Object.values(boundaryCondition).some(Boolean) : false;
        if (!hasBoundary) {
            message.warning('请至少选择一个边界条件');
            return;
        }
        setIsSimulating(true);
        const updatedCurrentProject = {
            ...currentProject,
            projectInfo: {
                ...currentProject.projectInfo,
                status: '仿真中',
            },
            simulationResult: {
                input: {
                    meshDensity: meshDensity,
                    boundaryCondition: boundaryCondition,
                },
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
                    groupNumber: currentProject.selectedGearGroup.groupNumber,
                    input: updatedCurrentProject.simulationResult.input,
                    model: updatedCurrentProject.uploadFileList.geometryModel[0].response.data.fileName,
                }),
            });

            const resData = await response.json();
            setIsSimulating(false);
            
            if (resData.code === '200') {
                const id =Date.now();
                const reportFile = {
                    id: id,
                    name: resData.data.report.name,
                    type: '仿真计算报告',
                    size: resData.data.report.size,
                    time: new Date().toLocaleString()
                };

                const cloudmapFile = {
                    id: id + 1,
                    name: resData.data.cloudmap.name,
                    type: '仿真应力云图',
                    size: resData.data.cloudmap.size,
                    time: new Date().toLocaleString()
                };

                const updatedCurrentProject = {
                    ...currentProject,
                    projectInfo: {
                        ...currentProject.projectInfo,
                        status: '仿真完成',
                    },
                    simulationResult: resData.data,
                    downloadFileList: [...currentProject.downloadFileList, reportFile, cloudmapFile],
                };
                setCurrentProject(updatedCurrentProject);
                sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
                const updatedLogs = [{
                    id: id,
                    type: '仿真',
                    operation: '仿真成功',
                    description: '状态更新为：仿真成功',
                    time: new Date().toLocaleString(),
                },{
                    id: id + 1,
                    type: '仿真',
                    operation: '仿真结果',
                    description: `仿真结果：${resData.data.report.name}，${resData.data.cloudmap.name}`,
                    time: new Date().toLocaleString(),
                }, {
                    id: id + 2,
                    type: '仿真',
                    operation: '新增可下载文件',
                    description: `新增仿真计算报告：${reportFile.name}，大小：${reportFile.size}`,
                    time: new Date().toLocaleString(),
                }, {
                    id: id + 3,
                    type: '仿真',
                    operation: '新增可下载文件',
                    description: `新增仿真应力云图：${cloudmapFile.name}，大小：${cloudmapFile.size}`,
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

    const handleDownloadReport = () => {
        if (!currentProject.simulationResult.report?.name) {
            message.error('请先完成仿真计算');
            return;
        }
        downloadFile(currentProject.simulationResult.report);
    };

    const handleDownloadStressImage = () => {
        if (!currentProject.simulationResult.cloudmap?.name) {
            message.error('请先完成仿真计算');
            return;
        }
        downloadFile(currentProject.simulationResult.cloudmap);
    };

    const renderCloudmap = () => {
        if (!currentProject.simulationResult.cloudmap?.name) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginLeft: '16px' }}>暂无应力分布云图预览</p>
                </div>
            );
        }
        
        // 构建图片URL
        const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${currentProject.simulationResult.cloudmap.name}`;

        return (
            <div style={{ width: '100%', textAlign: 'center' }}>
                <Image
                    src={imageUrl}
                    alt="应力云图"
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
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
                <h2 style={{ marginBottom: '16px' }}>齿轮工况选择</h2>
                <Form form={form} layout="vertical" style={{ width: '100%', display: 'flex', gap: '30px' }}>
                    <Form.Item 
                        name="groupNumber" 
                        label="选择配置组" 
                        rules={[{ message: '请选择配置组' }]} 
                        initialValue={currentProject.selectedGearGroup?.groupNumber}
                        style={{ flex: 1 }}
                    >
                        <Select placeholder="请选择配置组" disabled>
                            {gearData.map(group => (
                                <Option key={group.groupNumber} value={group.groupNumber}>
                                    第{group.groupNumber}组 - 主齿轮: {group.masterGear.model}, 从齿轮: {group.slaveGear.model}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="损伤类型" style={{ flex: 1 }}>
                        <Input value={currentProject.detectionResult.output.damageType} placeholder="请先进行识别" readOnly />
                    </Form.Item>
                </Form>
                
                <Divider style={{ margin: '16px 0' }} />

                <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsCollapsed(!isCollapsed)}>
                    齿轮工况详情
                    {isCollapsed ? <DownOutlined style={{ marginLeft: '8px' }} /> : <UpOutlined style={{ marginLeft: '8px' }} />}
                </h2>
                {!isCollapsed && (
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
                )}
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '16px' }}>几何模型</h2>
                <Upload
                    action="http://localhost:5000/api/uploadFile"
                    onChange={handleUploadChange}
                    onRemove={handleRemoveFile}
                    fileList={currentProject.uploadFileList.geometryModel}
                    maxCount={1}
                    // beforeUpload={() => false} // 阻止自动上传
                    // accept=".step,.stl,.obj"
                >
                    <Button icon={<UploadOutlined />}>点击上传几何模型</Button>
                </Upload>
            </div>

            <div className="card" >
                <h2 style={{ marginBottom: '16px' }}>参数设置</h2>
                <div className="form-item" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '120px', marginRight: '16px' }}>网格密度设置:</label>
                    <Select
                        defaultValue={currentProject.simulationResult.input.meshDensity || 'low'}
                        style={{ flex: 1, maxWidth: '300px' }}
                        onChange={value => setMeshDensity(value)}
                        value={meshDensity}
                    >
                        <Option value="low">低密度</Option>
                        <Option value="medium">中密度</Option>
                        <Option value="high">高密度</Option>
                    </Select>
                </div>
                <div className="form-item" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '120px', marginRight: '16px' }}>边界条件设置:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        {boundaryOptions.map(option => (
                            <Checkbox
                                key={option.id}
                                name={option.id}
                                onChange={(e) => setBoundaryCondition({
                                    ...boundaryCondition,
                                    [option.id]: e.target.checked,
                                })}
                                checked={boundaryCondition?.[option.id] || false}
                            >
                                {option.name}
                            </Checkbox>
                        ))}
                    </div>
                </div>
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
                    onClick={handleDownloadReport}
                    hidden={!currentProject.simulationResult.report?.name}
                >
                    下载仿真报告
                </Button>
                <Button 
                    style={{ marginRight: '16px' }}
                    type="primary" 
                    icon={<DownloadOutlined />} 
                    onClick={handleDownloadStressImage}
                    hidden={!currentProject.simulationResult.cloudmap?.name}
                >
                    下载应力云图
                </Button>
            </div>

            {currentProject.simulationResult.cloudmap?.name && !isSimulating && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>仿真结果</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>仿真参数</h3>
                                <p><strong>网格密度：</strong>{currentProject.simulationResult.input.meshDensity === 'high' ? '高密度' : currentProject.simulationResult.input.meshDensity === 'medium' ? '中密度' : '低密度'}</p>
                                <p><strong>边界条件：</strong>{currentProject.simulationResult.input.boundaryCondition 
                                    ? Object.entries(currentProject.simulationResult.input.boundaryCondition)
                                        .filter(([_, checked]) => checked)
                                        .map(([id]) => boundaryOptions.find(option => option.id === id)?.name)
                                        .filter(Boolean)
                                        .join(', ')
                                    : ''
                                }</p>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>应力云图</h3>
                                {renderCloudmap()}
                            </div>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}

export default SimulationSettings;