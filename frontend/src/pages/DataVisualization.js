import React, { useState } from 'react';
import { Card, Tabs, Row, Col, Divider, Button, Table, Image } from 'antd';
import { FileTextOutlined, AlertOutlined, DownloadOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

function DataVisualization() {
    const { 
        currentProject,
        logs,
        downloadFile
    } = useProjectContext();

    const [activeTabKey, setActiveTabKey] = useState('project');

    const masterGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.masterGear.parameters).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const slaveGearParams = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.slaveGear.parameters).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];
    
    const masterGearMaterial = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.masterGear.materialProperties).map(([key, value]) => ({
        key: key,
        value: value
    })) : [];

    const slaveGearMaterial = currentProject.selectedGearGroup ? Object.entries(currentProject.selectedGearGroup.slaveGear.materialProperties).map(([key, value]) => ({
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

    const boundaryOptions = [
        { id: 'fixed', name: '固定边' },
        { id: 'loaded', name: '加载面' },
        { id: 'symmetry', name: '对称面' },
        { id: 'free', name: '自由边界' },
    ];
        // 展示热力图
    const renderHeatmap = () => {
        if (!currentProject.detectionResult.heatmap?.name) {
            return (
                <div className="empty-state">
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginLeft: '16px' }}>暂无损伤热力图预览</p>
                </div>
            );
        }

        // 构建图片URL
        const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${currentProject.detectionResult.heatmap.name}`;

        return (
            <div style={{ width: '100%', textAlign: 'center' }}>
                <Image
                    src={imageUrl}
                    alt="热力图"
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
            </div>
        );
    };

    
    const renderCloudmap = () => {
        if (!currentProject.simulationResult.cloudmap?.name) {
            return (
                <div className="empty-state">
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

    return (
        <div className="fade-in data-visualization">
            <h1 style={{ marginBottom: '24px' }}>综合数据展示</h1>

            {/* 项目状态概览卡片 */}
            <Card className=
                {`status-card 
                    ${currentProject.projectInfo.status?.includes('待') && currentProject.projectInfo.status?.includes('完成') ? 'processing' : 
                    currentProject.projectInfo.status?.includes('待') ? 'pending' :
                    currentProject.projectInfo.status?.includes('完成') || currentProject.projectInfo.status?.includes('已完成') ? 'completed' :
                    currentProject.projectInfo.status?.includes('中') ? 'processing' :
                    'failed'}`
                }
                style={{ marginBottom: '24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>{currentProject.projectInfo?.name || '未创建项目'}</h2>
                        {currentProject.projectInfo?.path && (
                            <p style={{ color: '#666' }}>{currentProject.projectInfo?.path}</p>
                        )}
                    </div>
                    <div className="status-badge">
                        {currentProject.projectInfo?.path && (
                            <span>
                            <AlertOutlined style={{ marginRight: '8px' }} />
                            {currentProject.projectInfo?.status}
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            <Tabs
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                style={{ marginBottom: '24px' }}
                items={[
                    { key: 'project', label: '项目信息' },
                    { key: 'ai', label: '智能识别' },
                    { key: 'modeling', label: '几何建模' },
                    { key: 'simulation', label: '仿真结果' },
                ]}
            />

            {/* 项目信息面板 */}
            {activeTabKey === 'project' && (
                <div className="card">
                    {currentProject.projectInfo?.id && (
                        <div>
                            <h2 style={{ marginBottom: '16px' }}>项目基本信息</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <p><strong>项目名称：</strong>{currentProject.projectInfo?.name || 'N/A'}</p>
                                    <p><strong>项目路径：</strong>{currentProject.projectInfo?.path || 'N/A'}</p>
                                    <p><strong>创建时间：</strong>{currentProject.projectInfo?.createTime || 'N/A'}</p>
                                </Col>
                                <Col span={12}>
                                    <p><strong>当前状态：</strong>{currentProject.projectInfo?.status || 'N/A'}</p>
                                    <p><strong>项目编号：</strong>{currentProject.projectInfo?.id || 'N/A'}</p>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />
                        </div>
                    )}

                    <h2 style={{ marginBottom: '16px' }}>项目操作日志</h2>
                    <div className="list-container">
                        {logs && logs.length > 0 ? (
                            logs.map((log, index) => (
                                <div key={index} className="list-item">
                                    <span className="list-col1">{log.time}</span>
                                    <span className="list-col2">{log.description}</span>
                                </div>
                            ))
                        ) : (
                            <p>暂无日志记录</p>
                        )}
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <h2 style={{ marginBottom: '16px' }}>项目下载中心</h2>
                    <div className="list-container">
                        {currentProject.downloadFileList && currentProject.downloadFileList.length > 0 ? (
                            currentProject.downloadFileList.map((file, index) => (
                                <div key={index} className="list-item">
                                    <span className="list-col1">
                                        <Button
                                            type="primary"
                                            icon={<DownloadOutlined />}
                                            onClick={() => downloadFile(file)}
                                            size="small"
                                        >
                                            下载文件
                                        </Button>
                                    </span>
                                    <span className="list-col2">{file.name}</span>
                                </div>
                            ))
                        ) : (
                            <p>暂无可下载文件</p>
                        )}
                    </div>
                </div>
            )}

            {/* 智能识别面板 */}
            {activeTabKey === 'ai' && (
                <div className="card">
                    {currentProject.detectionResult?.output.damageType ? ( 
                        <>
                            <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <p><strong>损伤类型：</strong>{currentProject.detectionResult?.output?.damageType || 'N/A'}</p>
                                    <p><strong>损伤程度：</strong>{currentProject.detectionResult?.output?.damageSeverity || 'N/A'}</p>
                                    <p><strong>损伤位置：</strong>{currentProject.detectionResult?.output?.damageLocation || 'N/A'}</p>
                                </Col>
                                <Col span={12}>
                                    <p><strong>损伤面积：</strong>{currentProject.detectionResult?.output?.damageArea || 'N/A'}</p>
                                    <p><strong>识别精度：</strong>
                                        {currentProject.detectionResult?.input?.precision === 'high' ? '高精度' : 
                                        currentProject.detectionResult?.input?.precision === 'medium' ? '中精度' : 
                                        currentProject.detectionResult?.input?.precision === 'low' ? '低精度' : 'N/A'}
                                    </p>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <h2 style={{ marginBottom: '16px' }}>热力图分析</h2>
                            <div className="preview-container">
                                {renderHeatmap()}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <AlertOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                            <p style={{ fontSize: '18px', color: '#666' }}>暂无智能识别数据</p>
                            <p style={{ marginTop: '8px', color: '#999' }}>请先完成智能识别</p>
                        </div>
                    )}
                </div>
            )}


            {/* 几何建模面板 */}
            {activeTabKey === 'modeling' && (
                <div className="card">
                    {currentProject?.selectedGearGroup?.groupNumber && currentProject?.modelingResult?.model?.name ? (
                        <>
                            <h2 style={{ marginBottom: '16px' }}>建模参数</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <p><strong>配置组：</strong>第{currentProject?.selectedGearGroup?.groupNumber || 'N/A'}组</p>
                                    <p><strong>损伤类型：</strong>{currentProject?.detectionResult?.output?.damageType || 'N/A'}</p>
                                </Col>
                                <Col span={12}>
                                    <p><strong>主齿轮模型：</strong>{currentProject?.selectedGearGroup?.masterGear?.model || 'N/A'}</p>
                                    <p><strong>从齿轮模型：</strong>{currentProject?.selectedGearGroup?.slaveGear?.model || 'N/A'}</p>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <h2 style={{ marginBottom: '16px' }}>齿轮参数详情</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <h3 style={{ marginBottom: '16px' }}>主齿轮参数</h3>
                                    <Table columns={columns} dataSource={masterGearParams} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                </Col>
                                <Col span={12}>
                                    <h3 style={{ marginBottom: '16px' }}>从齿轮参数</h3>
                                    <Table columns={columns} dataSource={slaveGearParams} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <h2 style={{ marginBottom: '16px' }}>模型预览</h2>
                            <div className="preview-container">
                                <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', marginLeft: '16px' }}>
                                    <p>齿轮3D模型预览图</p>
                                    <p>暂不支持.STEP格式</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <AlertOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                            <p style={{ fontSize: '18px', color: '#666' }}>暂无几何建模数据</p>
                            <p style={{ marginTop: '8px', color: '#999' }}>请先完成几何建模</p>
                        </div>
                    )}
                </div>
            )}

            {/* 仿真结果面板 */}
            {activeTabKey === 'simulation' && (
                <div className="card">
                    {currentProject?.selectedGearGroup?.groupNumber && currentProject?.simulationResult?.input ? (
                        <>
                            <h2 style={{ marginBottom: '16px' }}>仿真参数</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <p><strong>配置组：</strong>第{currentProject?.selectedGearGroup?.groupNumber || 'N/A'}组</p>
                                    <p><strong>损伤类型：</strong>{currentProject?.detectionResult?.output?.damageType || 'N/A'}</p>
                                    <p><strong>几何模型：</strong>{currentProject?.modelingResult?.model?.name || 'N/A'}</p>
                                </Col>
                                <Col span={12}>
                                    <p><strong>网格密度：</strong>
                                        {currentProject.simulationResult.input.meshDensity === 'high' ? '高密度' : 
                                        currentProject.simulationResult.input.meshDensity === 'medium' ? '中密度' : 
                                        currentProject.simulationResult.input.meshDensity === 'low' ? '低密度' : 'N/A'}
                                    </p>
                                    <p><strong>边界条件：</strong>{currentProject.simulationResult.input.boundaryCondition 
                                        ? (() => {
                                            const selectedOptions = Object.entries(currentProject.simulationResult.input.boundaryCondition)
                                                .filter(([_, checked]) => checked)
                                                .map(([id]) => boundaryOptions.find(option => option.id === id)?.name)
                                                .filter(Boolean);
                                            return selectedOptions.length > 0 ? selectedOptions.join(', ') : 'N/A';
                                        })()
                                        : 'N/A'}
                                    </p>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <h2 style={{ marginBottom: '16px' }}>齿轮参数详情</h2>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <h3 style={{ marginBottom: '16px' }}>主齿轮材料属性</h3>
                                    <Table columns={columns} dataSource={masterGearMaterial} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                    <h3 style={{ marginBottom: '16px' }}>主齿轮载荷数据</h3>
                                    <Table columns={columns} dataSource={masterGearLoad} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                </Col>
                                <Col span={12}>
                                    <h3 style={{ marginBottom: '16px' }}>从齿轮材料属性</h3>
                                    <Table columns={columns} dataSource={slaveGearMaterial} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                    <h3 style={{ marginBottom: '16px' }}>从齿轮载荷数据</h3>
                                    <Table columns={columns} dataSource={slaveGearLoad} rowKey="key" pagination={false} style={{ marginBottom: '16px' }} />
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <h2 style={{ marginBottom: '16px' }}>应力云图</h2>
                            <div className="preview-container">
                                {renderCloudmap()}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <AlertOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                            <p style={{ fontSize: '18px', color: '#666' }}>暂无仿真计算数据</p>
                            <p style={{ marginTop: '8px', color: '#999' }}>请先完成仿真计算</p>
                        </div>
                    )}
                </div>
            )}
            
        </div>
    );
}

export default DataVisualization;