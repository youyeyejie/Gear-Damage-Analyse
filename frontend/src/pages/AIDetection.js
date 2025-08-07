import React, { useState } from 'react';
import { Button, Upload, message, Row, Col, Image } from 'antd';
import { DownloadOutlined, PlayCircleOutlined, PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

function AIDetection() {
    const {
        logs, //日志列表
        setLogs, //更新日志列表
        currentProject, //当前项目相关信息
        setCurrentProject, //更新当前项目
        downloadFile, //下载文件
    } = useProjectContext();
    const [isDetecting, setIsDetecting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
    const handleUploadChange = ({ fileList: currentFileList, file: currentFile }) => {
        setIsUploading(true);
        const updatedCurrentProject = {
            ...currentProject,
            uploadFileList: currentFileList
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
            setIsUploading(false);
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
            setIsUploading(false);
        }
    };

    // 删除上传文件
    const handleRemoveFile = (file) => {
        setIsUploading(true);
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
                                aiDetectionImage: currentProject.uploadFileList.filter(f => f !== file)
                            }
                        };
                        setCurrentProject(updatedCurrentProject);
                        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));
                        message.success(`已删除文件: ${file.name}`);
                        setIsUploading(false);
                    } else {
                        throw new Error(resData.msg);
                    }
                });
        } catch (error) {
            message.error(`删除失败: ${error.message}`);
            setIsUploading(false);
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
        if (!currentProject.projectInfo.id) {
            message.warning('请先创建项目');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
            return;
        }
        if (isUploading) {
            message.warning('请等待上传完成');
            return;
        }
        if (currentProject.uploadFileList.length === 0) {
            message.warning('请先上传至少一张图片');
            return;
        }

        setIsDetecting(true);
        const updatedCurrentProject = {
            ...currentProject,
            projectInfo: {
                ...currentProject.projectInfo,
                status: '识别中',
            }
        };
        setCurrentProject(updatedCurrentProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedCurrentProject));

        const images = [];
        currentProject.uploadFileList.map(file => images.push(file.response?.data.fileName));

        try {
            const response = await fetch('http://localhost:5000/api/aiDetection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {
                        image: images,
                    },
                })
            });

            const resData = await response.json();
            setIsDetecting(false);

            if (resData.code === '200') {
                // 添加报告到下载列表
                const id = Date.now();

                const heatmap = [];
                for (let i = 0; i < resData.data.heatmap.length; i++) {
                    const heatmapFile = {
                        id: id + i,
                        name: resData.data.heatmap[i].name,
                        type: '损伤识别热力图',
                        size: resData.data.heatmap[i].size,
                        time: new Date().toLocaleString()
                    };
                    heatmap.push(heatmapFile);
                }

                const updatedCurrentProject = {
                    ...currentProject,
                    projectInfo: {
                        ...currentProject.projectInfo,
                        status: '识别完成，待建模',
                    },
                    detectionResult: resData.data,
                    downloadFileList: [...currentProject.downloadFileList, ...heatmap],
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
                        description: `识别结果：${resData.data.output.isDamage ? '有' : '无'}损`,
                        time: new Date().toLocaleString(),
                    }, {
                        id: id + 2,
                        type: '识别',
                        operation: '新增可下载文件',
                        description: `新增损伤识别热力图：${heatmap.map(item => item.name).join(', ')}`,
                        time: new Date().toLocaleString(),
                    }, ...logs];
                setLogs(updatedLogs);
                sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
                message.success('损伤识别成功');
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

    // 下载热力图
    const handleDownloadHeatmap = () => {
        if (!currentProject.detectionResult.heatmap?.length) {
            message.error('请先完成损伤识别');
            return;
        }
        for (let i = 0; i < currentProject.detectionResult.heatmap.length; i++) {
            downloadFile(currentProject.detectionResult.heatmap[i]);
        }
    };

    // 展示热力图
    const renderHeatmap = () => {
        if (!currentProject.detectionResult.heatmap?.length) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', background: '#e8e8e8', borderRadius: '8px', marginTop: '16px' }}>
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginLeft: '16px' }}>暂无损伤热力图预览</p>
                </div>
            );
        }


        const heatmapImages = currentProject.detectionResult.heatmap.map((heatmap, index) => {
            const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${heatmap.name}`;
            return (
                <Col span={12}>
                    <div key={index} style={{ width: '100%', textAlign: 'center', marginBottom: '16px' }}>
                        <Image
                            src={imageUrl}
                            alt={`热力图 ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                        />
                    </div>
                </Col>
            );
        });
        return (
            <Row gutter={[16, 16]}>
                {heatmapImages}
            </Row>
        );
    };

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '24px' }}>损伤识别</h1>

            <div className="card" style={{ marginTop: '24px' }}>
                <h2 style={{ marginBottom: '16px' }}>图片上传</h2>
                <Upload
                    multiple
                    action="http://localhost:5000/api/uploadFile"
                    onChange={handleUploadChange}
                    listType="picture-card"
                    fileList={currentProject.uploadFileList}
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

            {/* <div className="card" style={{ marginTop: '24px' }}>
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
            </div> */}

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
                    onClick={handleDownloadHeatmap}
                    hidden={!currentProject.detectionResult.heatmap?.length}
                    style={{ marginRight: '16px' }}
                >
                    下载热力图
                </Button>
            </div>

            {currentProject.detectionResult.heatmap?.length > 0 && !isDetecting &&(
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
                    <div className="card" style={{ height: '100%', padding: '16px' }}>
                        <h3 style={{ marginBottom: '16px' }}>识别结果</h3>
                        <p>损伤情况：{currentProject.detectionResult.output.isDamage ? '有损' : '无损'}</p>
                    </div>
                    <div className="card" style={{ height: '100%', padding: '16px' }}>
                        <h3 style={{ marginBottom: '16px' }}>损伤热力图</h3>
                        {renderHeatmap()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIDetection;
