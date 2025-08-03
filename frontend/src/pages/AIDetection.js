import React, { useState } from 'react';
import { Button, Upload, message, Row, Col, Select, Image } from 'antd';
import { DownloadOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function AIDetection() {
    const {
        // filteredLogs, //筛选出来日志列表
        // setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        // setCurrentProject, //更新当前项目
        // createProject, //创建项目
        updateProjectStatus, //更新项目状态

        updateDownloadFileList, //更新下载文件列表
        downloadFile, //下载文件

        updateUploadFileList, //更新上传文件列表
        clearUploadFileList, //清空上传文件列表

        updateDetectionResult, //更新识别结果
    } = useProjectContext();
    const [isDetecting, setIsDetecting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    // 获取base64编码的图片用于预览
    const getBase64 = file =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

    // 处理上传变化
    const handleUploadChange = ({ file: currentFile }) => {
        updateUploadFileList(currentFile, 'ai', 'add');
            
        // 文件开始上传前检查是否已建立项目
        // 只在当前文件上传完成或失败时显示消息
        if (!currentProject.projectInfo.id) {
            message.warning('请先创建项目');
            clearUploadFileList();
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
            return;
        }
        if (currentFile.status === "error") {
            message.error(currentFile.response?.msg || '上传失败');
        } else if (currentFile.status === "done") {
            message.success(currentFile.response?.msg || '上传成功');
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
                    if (resData.code === '0') {
                        // 删除成功，更新前端状态
                        updateUploadFileList(file, 'ai', 'remove');
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
        updateProjectStatus('识别中');
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
                updateDetectionResult(resData.data);
                // 识别成功，更新结果
                setTimeout(() => {
                    updateProjectStatus('识别完成，待仿真');
                }, 100);

                // 添加报告到下载列表
                const reportFile = {
                    id: Date.now(),
                    name: resData.data.report.name,
                    type: 'AI识别报告',
                    size: resData.data.report.size,
                    time: new Date().toLocaleString()
                };
                setTimeout(() => {
                    updateDownloadFileList(reportFile);
                }, 100);

                const heatmapFile = {
                    id: Date.now(),
                    name: resData.data.heatmap.name,
                    type: 'AI识别热力图',
                    size: resData.data.heatmap.size,
                    time: new Date().toLocaleString()
                };
                setTimeout(() => {
                    updateDownloadFileList(heatmapFile);
                }, 100);
                message.success('AI识别成功');
            } else {
                message.error(`识别失败: ${resData.msg}`);
                updateProjectStatus('待识别');
            }
        } catch (error) {
            setIsDetecting(false);
            message.error(`识别失败: ${error.message}`);
            updateProjectStatus('待识别');
        }
    };

    // 下载AI预测报告
    const handleDownloadReport = () => {
        if (!currentProject.detectionResult.report) {
            message.warning('请先完成AI识别');
            return;
        }
        downloadFile(currentProject.detectionResult.report);
    };

    // 下载热力图
    const handleDownloadHeatmap = () => {
        if (!currentProject.detectionResult.heatmap) {
            message.warning('请先完成AI识别');
            return;
        }
        downloadFile(currentProject.detectionResult.heatmap);
    };

    // 展示热力图
    const renderHeatmap = () => {
        if (!currentProject.detectionResult.heatmap) {
            return <div>暂无热力图数据</div>;
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
                        defaultValue="low"
                        style={{ width: 120 }}
                        onChange={value => updateDetectionResult({ input: { precision: value } })}
                        value={currentProject.detectionResult.input.precision}
                    >
                        <Option value="high">高精度</Option>
                        <Option value="medium">中等精度</Option>
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

            {currentProject.detectionResult.output?.damageType && (
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
                                <p><strong>识别精度：</strong>{currentProject.detectionResult.input.precision === 'high' ? '高精度' : currentProject.detectionResult.input.precision === 'medium' ? '中等精度' : '低精度'}</p>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
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
