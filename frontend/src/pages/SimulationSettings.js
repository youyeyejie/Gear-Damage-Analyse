import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, message, Upload, Checkbox, Table } from 'antd';
import { PlayCircleOutlined, DownloadOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function SimulationSettings() {
    const [form] = Form.useForm();
    const {
        filteredLogs, //筛选出来日志列表
        setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        setCurrentProject, //更新当前项目
        createProject, //创建项目
        updateProjectStatus, //更新项目状态

        updateDownloadFileList, //更新下载文件列表
        downloadFile, //下载文件

        updateUploadFileList, //更新上传文件列表
        clearUploadFileList, //清空上传文件列表

        updateDetectionResult, //更新识别结果

        gearData, //齿轮数据
        loadGearData, //加载齿轮数据
        updateSelectedGearGroup, //更新齿轮组
        updateModelingResult, //更新建模结果
        
        updateSimulationResult, //更新仿真结果
    } = useProjectContext();
    const [isSimulating, setIsSimulating] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    // const [simulationResult, setSimulationResult] = useState(null);
    // const [selectedMaterial, setSelectedMaterial] = useState('');
    // const [meshDensity, setMeshDensity] = useState('medium');
    // const [boundaryConditions, setBoundaryConditions] = useState({});
    // const [loadSettings, setLoadSettings] = useState({ force: 0, pressure: 0, current: 0 });
    // const [fileList, setFileList] = useState([]);
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
    // useEffect(() => {
    //     if (modelingResult && modelingResult.modelFile) {
    //         setFileList([{
    //             name: modelingResult.modelFile,
    //             status: 'done',
    //             url: `/download/${modelingResult.modelFile}`,
    //             isModelFile: true
    //         }]);
    //     }
    // }, [modelingResult]);

    const handleMaterialChange = (materialId) => {
        // const material = materials.find(m => m.id === parseInt(materialId));
        // setSelectedMaterial(material);
    };

    const handleMeshDensityChange = (density) => {
        // setMeshDensity(density);
    };

    const handleBoundaryChange = (e) => {
        // const { name, checked } = e.target;
        // setBoundaryConditions(prev => ({
        //     ...prev,
        //     [name]: checked
        // }));
    };

    const handleLoadChange = (field, value) => {
        // setLoadSettings(prev => ({
        //     ...prev,
        //     [field]: parseFloat(value) || 0
        // }));
    };

    const handleUploadChange = ({ file }) => {
        // setFileList(fileList);
        // updateUploadFileList(file, 'model', 'add');
    };

    const handleStartSimulation = async () => {
        // // 验证是否已上传模型文件
        // if (fileList.length === 0) {
        //     message.error('请先上传几何模型文件');
        //     return;
        // }

        // // 验证是否已选择材料
        // if (!selectedMaterial) {
        //     message.error('请先选择材料类型');
        //     return;
        // }

        // // 验证是否已选择边界条件
        // const hasBoundary = Object.values(boundaryConditions).some(Boolean);
        // if (!hasBoundary) {
        //     message.error('请至少选择一个边界条件');
        //     return;
        // }

        // // 验证是否已设置载荷
        // const hasLoad = Object.values(loadSettings).some(v => v > 0);
        // if (!hasLoad) {
        //     message.error('请至少设置一个载荷参数');
        //     return;
        // }

        // try {
        //     setIsSimulating(true);
        //     updateProjectStatus('仿真中');
        //     message.info('开始仿真计算，请稍候...');

        //     // 模拟仿真过程
        //     await new Promise(resolve => setTimeout(resolve, 6000));

        //     // 生成模拟结果
        //     const result = {
        //         material: selectedMaterial.name,
        //         meshDensity: {
        //             low: '低密度',
        //             medium: '中密度',
        //             high: '高密度'
        //         }[meshDensity],
        //         boundaryConditions: Object.entries(boundaryConditions)
        //             .filter(([_, value]) => value)
        //             .map(([key]) => boundaryOptions.find(option => option.id === key)?.name || key),
        //         loadSettings: loadSettings,
        //         reportFile: 'simulation_report.pdf',
        //         stressImageUrl: '/preview/stress.png',
        //         simulatedAt: new Date().toLocaleString(),
        //     };

        //     setSimulationResult(result);
        //     setIsSimulating(false);
        //     updateProjectStatus('仿真完成');
        //     message.success('仿真计算完成！');
        // } catch (error) {
        //     setIsSimulating(false);
        //     updateProjectStatus('待仿真');
        //     message.error('仿真计算失败：' + error.message);
        // }
    };

    const handleDownloadReport = () => {
        // if (!simulationResult) {
        //     message.error('请先完成仿真计算');
        //     return;
        // }

        // message.success(`开始下载仿真报告：${simulationResult.reportFile}`);
    };

    const handleDownloadStressImage = () => {
        // if (!simulationResult) {
        //     message.error('请先完成仿真计算');
        //     return;
        // }

        // message.success('开始下载应力云图');
    };


    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };



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
            <h1 style={{ marginBottom: '24px' }}>仿真设置</h1>

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


                <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleToggleCollapse}>
                    齿轮工况详情【点击查看】
                </h2>
                {!isCollapsed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Card title="主齿轮材料属性" variant="outlined" style={{ minWidth: '300px' }}>
                            <Table columns={columns} dataSource={masterGearParams} rowKey="key" pagination={false} />
                        </Card>
                        <Card title="从齿轮材料属性" variant="outlined" style={{ minWidth: '300px' }}>
                            <Table columns={columns} dataSource={slaveGearParams} rowKey="key" pagination={false} />
                        </Card>
                        <Card title="主齿轮载荷数据" variant="outlined" style={{ minWidth: '300px' }}>
                            <Table columns={columns} dataSource={masterGearLoad} rowKey="key" pagination={false} />
                        </Card>
                        <Card title="从齿轮载荷数据" variant="outlined" style={{ minWidth: '300px' }}>
                            <Table columns={columns} dataSource={slaveGearLoad} rowKey="key" pagination={false} />
                        </Card>
                    </div>
                )}
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '16px' }}>几何模型</h2>
                <Upload
                    action="http://localhost:5000/api/uploadFile"
                    onChange={handleUploadChange}
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
                        defaultValue="medium"
                        style={{ flex: 1, maxWidth: '300px' }}
                        onChange={value => updateSimulationResult({ input: { meshDensity: value } })}
                        value={currentProject.simulationResult.input.meshDensity}
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
                                onChange={value => updateSimulationResult({ input: { boundaryCondition: value } })}
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
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartSimulation}
                    loading={isSimulating}
                    disabled={isSimulating}
                >
                    开始仿真
                </Button>
            </div>

            {/* {currentProject.simulationResult && (
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
            )} */}
        </div>
    );
}

export default SimulationSettings;