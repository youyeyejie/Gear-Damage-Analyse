import React, { useState } from 'react';
import { Button, Upload, message, Row, Col, Select, Image } from 'antd';
import { DownloadOutlined, PlayCircleOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function AIDetection() {
    const {
        logs, //日志列表
        setLogs, //更新日志列表
        currentProject, //当前项目相关信息
        setCurrentProject, //更新当前项目
        downloadFile, //下载文件
    } = useProjectContext();
    const [isDetecting, setIsDetecting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [precision, setPrecision] = useState(currentProject.detectionResult.input.precision || 'low');

    // 获取base64编码的图片用于预览
    const getBase64 = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

    // 处理上传变化
    const handleUploadChange = ({ fileList: currentFileList, file: currentFile }) => {
        const updatedCurrentProject = {
            ...currentProject,
            uploadFileList: {
                ...currentProject.uploadFileList,
                aiDetectionImage: currentFileList,
            },
        };
        setCurrentProject(updatedCurrentProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
        if (!currentProject.projectInfo.id) {
            message.warning('请先创建项目');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
            return;
        }
        if (currentFile.status === "error") {
            message.error(currentFile.response?.msg || '上传失败');
        } else if (currentFile.status === "done") {
            message.success(currentFile.response?.msg || '上传成功');
            const updatedLogs = [{
                id: Date.now(),
                type: '识别',
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
                                aiDetectionImage: currentProject.uploadFileList.aiDetectionImage.filter(f => f !== file)
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

    // 预览图片
    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
    };

    // 开始AI识别
    const handleStartDetection = async () => {
        if (currentProject.uploadFileList.aiDetectionImage.length === 0) {
            message.warning('请先上传至少一张图片');
            return;
        }

        setIsDetecting(true);
        const updatedCurrentProject = {
            ...currentProject,
            projectInfo: {
                ...currentProject.projectInfo,
                status: '识别中',
            },
            detectionResult: {
                ...currentProject.detectionResult,
                input: {
                    ...currentProject.detectionResult.input,
                    precision: precision,
                }
            }
        };
        setCurrentProject(updatedCurrentProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));

        const images = [];
        currentProject.uploadFileList.aiDetectionImage.map(file => images.push(file.response.data.fileName));

        try {
            const response = await fetch('http://localhost:5000/api/aiDetection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: currentProject.detectionResult.input,
                    images: images,
                })
            });

            const resData = await response.json();
            setIsDetecting(false);

            if (resData.code === '200') {
                // 添加报告到下载列表
                const id = Date.now();
                const reportFile = {
                    id: id,
                    name: resData.data.report.name,
                    type: 'AI识别报告',
                    size: resData.data.report.size,
                    time: new Date().toLocaleString()
                };

                const heatmapFile = {
                    id: id + 1,
                    name: resData.data.heatmap.name,
                    type: 'AI识别热力图',
                    size: resData.data.heatmap.size,
                    time: new Date().toLocaleString()
                };

                const updatedCurrentProject = {
                    ...currentProject,
                    projectInfo: {
                        ...currentProject.projectInfo,
                        status: '识别完成，待建模',
                    },
                    detectionResult: resData.data,
                    downloadFileList: [...currentProject.downloadFileList, reportFile, heatmapFile],
                };
                setCurrentProject(updatedCurrentProject);
                sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
                const updatedLogs = [{
                        id: id,
                        type: '识别',
                        operation: '更新状态',
                        description: '状态更新为：识别完成，待建模',
                        time: new Date().toLocaleString(),
                    }, {
                        id: id + 1,
                        type: '识别',
                        operation: '识别结果',
                        description: `识别结果：${resData.data.output.damageType}，${resData.data.output.damageSeverity}，${resData.data.output.damageLocation}`,
                        time: new Date().toLocaleString(),
                    },
                    {
                        id: id + 2,
                        type: '识别',
                        operation: '新增可下载文件',
                        description: `新增AI识别报告：${reportFile.name}，大小：${reportFile.size}`,
                        time: new Date().toLocaleString(),
                    }, {
                        id: id + 3,
                        type: '识别',
                        operation: '新增可下载文件',
                        description: `新增AI识别热力图：${heatmapFile.name}，大小：${heatmapFile.size}`,
                        time: new Date().toLocaleString(),
                    }, ...logs];
                setLogs(updatedLogs);
                sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
                message.success('AI识别成功');
            } else {
                throw new Error(resData.msg);
            }
        } catch (error) {
            setIsDetecting(false);
            message.error(`识别失败: ${error.message}`);
            const updatedCurrentProject = { 
                ...currentProject,
                projectInfo: {
                    ...currentProject.projectInfo,
                    status: '待识别',
                }
            };
            setCurrentProject(updatedCurrentProject);
            sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
            const updatedLogs = [{
                id: Date.now(),
                type: '识别',
                operation: '识别失败',
                description: '识别失败：' + error.message,
                time: new Date().toLocaleString(),
            }, ...logs];
            setLogs(updatedLogs);
            sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
        }
    };

    // 下载AI预测报告
    const handleDownloadReport = () => {
        if (!currentProject.detectionResult.report?.name) {
            message.error('请先完成AI识别');
            return;
        }
        downloadFile(currentProject.detectionResult.report);
    };

    // 下载热力图
    const handleDownloadHeatmap = () => {
        if (!currentProject.detectionResult.heatmap?.name) {
            message.error('请先完成AI识别');
            return;
        }
        downloadFile(currentProject.detectionResult.heatmap);
    };

    // 展示热力图
    const renderHeatmap = () => {
        if (!currentProject.detectionResult.heatmap?.name) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
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

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '24px' }}>智能识别</h1>

            <div className="card" style={{ marginTop: '24px' }}>
                <h2 style={{ marginBottom: '16px' }}>图片上传</h2>
                <Upload
                    multiple
                    action="http://localhost:5000/api/uploadFile"
                    onChange={handleUploadChange}
                    listType="picture-card"
                    fileList={currentProject.uploadFileList.aiDetectionImage}
                    onPreview={handlePreview}
                    onRemove={handleRemoveFile}
                    accept='image/*'
                >
                    <div>
                        <PlusOutlined />
                        <div className="ant-upload-text">上传图片</div>
                    </div>
                </Upload>
                {previewImage && (
                    <Image
                        wrapperStyle={{ display: 'none' }}
                        preview={{
                            visible: previewOpen,
                            onVisibleChange: visible => setPreviewOpen(visible),
                            afterOpenChange: visible => !visible && setPreviewImage(''),
                        }}
                        src={previewImage}
                    />
                )}
            </div>

            <div className="card" style={{ marginTop: '24px' }}>
                <h2 style={{ marginBottom: '16px' }}>参数设置</h2>
                <div className="precision-selector" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '120px', marginRight: '16px' }}>识别精度设置:</label>
                    <Select
                        defaultValue={currentProject.detectionResult.input.precision || 'low'}
                        style={{ flex: 1, maxWidth: '300px' }}
                        onChange={value => setPrecision(value)}
                        value={precision}
                    >
                        <Option value="high">高精度</Option>
                        <Option value="medium">中精度</Option>
                        <Option value="low">低精度</Option>
                    </Select>
                </div>
            </div>

            <div className="button-group" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartDetection}
                    loading={isDetecting}
                    style={{ marginRight: '16px' }}
                >
                    开始识别
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadReport}
                    hidden={!currentProject.detectionResult.report?.name}
                    style={{ marginRight: '16px' }}
                >
                    下载AI预测报告
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadHeatmap}
                    hidden={!currentProject.detectionResult.heatmap?.name}
                    style={{ marginRight: '16px' }}
                >
                    下载热力图
                </Button>
            </div>

            {currentProject.detectionResult.output?.damageType && !isDetecting &&(
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>损伤信息</h3>
                                <p><strong>损伤类型：</strong>{currentProject.detectionResult.output.damageType}</p>
                                <p><strong>损伤严重程度：</strong>{currentProject.detectionResult.output.damageSeverity}</p>
                                <p><strong>损伤面积：</strong>{currentProject.detectionResult.output.damageArea}</p>
                                <p><strong>损伤位置：</strong>{currentProject.detectionResult.output.damageLocation}</p>
                                <p><strong>损伤描述：</strong>{currentProject.detectionResult.output.damageDescription}</p>
                                <p><strong>识别精度：</strong>{currentProject.detectionResult.input.precision === 'high' ? '高精度' : currentProject.detectionResult.input.precision === 'medium' ? '中精度' : '低精度'}</p>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>损伤热力图</h3>
                                {renderHeatmap()}
                            </div>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}

export default AIDetection;
