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
                            uploadFileList: currentProject.uploadFileList.filter(f => f !== file)
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

        try {
            const response = await fetch('http://localhost:5000/api/aiDetection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {
                        gear_image: currentProject.uploadFileList?.[0].response?.data.fileName,
                        model: currentProject.detectionResult.input.model,
                    },
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

                const blockmapFile = {
                    id: id + 1,
                    name: resData.data.blockmap.name,
                    type: '损伤识别方框图',
                    size: resData.data.blockmap.size,
                    time: new Date().toLocaleString()
                };

                const updatedCurrentProject = {
                    ...currentProject,
                    projectInfo: {
                        ...currentProject.projectInfo,
                        status: '识别完成，待建模',
                    },
                    detectionResult: resData.data,
                    downloadFileList: [...currentProject.downloadFileList, reportFile, blockmapFile],
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
                        description: `新增损伤识别报告：${reportFile.name}，大小：${reportFile.size}`,
                        time: new Date().toLocaleString(),
                    }, {
                        id: id + 3,
                        type: '识别',
                        operation: '新增可下载文件',
                        description: `新增损伤识别方框图：${blockmapFile.name}，大小：${blockmapFile.size}`,
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

    // 下载AI预测报告
    const handleDownloadReport = () => {
        if (!currentProject.detectionResult.report?.name) {
            message.error('请先完成损伤识别');
            return;
        }
        downloadFile(currentProject.detectionResult.report);
    };

    // 下载损伤方框图
    const handleDownloadBlockmap = () => {
        if (!currentProject.detectionResult.blockmap?.name) {
            message.error('请先完成损伤识别');
            return;
        }
        downloadFile(currentProject.detectionResult.blockmap);
    };

    // 展示损伤方框图
    const renderBlockmap = () => {
        if (!currentProject.detectionResult.blockmap?.name) {
            return (
                <div className="empty-state">
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginLeft: '16px' }}>暂无损伤方框图预览</p>
                </div>
            );
        }

        const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${currentProject.detectionResult.blockmap.name}`;
        return (
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '16px' }}>
                <Image
                    src={imageUrl}
                    alt={`损伤方框图`}
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
            </div>
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
                    accept='.jpg,.jpeg,.png,.JPG,.JPEG,.PNG'
                >
                    <div>
                        <PlusOutlined />
                        <div className="ant-upload-text">上传图片</div>
                    </div>
                </Upload>
                <span style={{ fontSize: '12px', color: '#666', marginTop: '16px' }}>
                    请上传一张齿轮损伤图片，要求齿面平行于镜头，且画面中仅包含单个齿面，光照均匀无强反光。<br/>
                    若上传多张图片，仅识别第一张图片。
                </span>
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
                    <label style={{ width: '120px', marginRight: '16px' }}>识别模型设置:</label>
                    <Select
                        defaultValue={currentProject.detectionResult.input.model || 'yolov5s'}
                        style={{ flex: 1, maxWidth: '300px' }}
                        disabled
                    >
                        <Option value="yolov5s">yolov5s(默认)</Option>
                    </Select>
                </div>
            </div>

            <div className="button-group" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartDetection}
                    loading={isDetecting || currentProject.projectInfo.status === '识别中'}
                    style={{ marginRight: '16px' }}
                >
                    开始识别
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadReport}
                    hidden={!currentProject.detectionResult.report?.name || isDetecting || currentProject.projectInfo.status === '识别中'}
                    style={{ marginRight: '16px' }}
                >
                    下载损伤识别报告
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadBlockmap}
                    hidden={!currentProject.detectionResult.blockmap?.name || isDetecting || currentProject.projectInfo.status === '识别中'}
                    style={{ marginRight: '16px' }}
                >
                    下载损伤方框图
                </Button>
            </div>

            {currentProject.detectionResult.report?.name && !isDetecting &&(
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>损伤信息</h3>
                                <p>
                                    <strong>分析结果可信度：</strong>
                                    {currentProject.detectionResult.output.isValid === 1  ? "分析有效，可信度高" 
                                    : "分析无效 - 未检测到明确损伤。请确保齿面平行于镜头，且画面中仅包含单个齿面，光照均匀无强反光"
                                    }
                                </p>
                                {currentProject.detectionResult.output.isValid === 1 ? (
                                    <div>
                                    <p>
                                        <strong>磨损状况评估：</strong>
                                        {parseFloat(currentProject.detectionResult.output.abrasionRate).toFixed(1)}% 
                                        {parseFloat(currentProject.detectionResult.output.abrasionRate) > 80 ? "（严重磨损，请立即停机检修，更换齿轮，检查润滑系统）"  
                                        : parseFloat(currentProject.detectionResult.output.abrasionRate) > 60 ? "（中度磨损，建议缩短检修周期，考虑更换润滑油）" 
                                        : "（轻微磨损，可接受，建议按常规维护计划进行）"}
                                    </p>
                                    <p><strong>齿面剥落分析：</strong>{parseFloat(currentProject.detectionResult.output.peelingRate).toFixed(1)}% 
                                        {parseFloat(currentProject.detectionResult.output.peelingRate) > 30 ? "（严重剥落，风险较大，建议立即更换齿轮，分析失效根本原因）" 
                                        : parseFloat(currentProject.detectionResult.output.peelingRate) > 10 ? "（中度剥落，建议立即检查齿轮是否正常）" 
                                        : "（轻微剥落，可接受，建议按常规维护计划进行）"}
                                    </p>
                                    <p><strong>压伤程度测量：</strong>{parseFloat(currentProject.detectionResult.output.scuffingRate).toFixed(1)}% 
                                        {parseFloat(currentProject.detectionResult.output.scuffingRate) > 80 ? "（严重压伤，风险较大，建议立即检修，更换齿轮，检查运行条件）" 
                                        : parseFloat(currentProject.detectionResult.output.scuffingRate) > 60 ? "（中度压伤，建议检查润滑系统，考虑调整工作参数）" 
                                        : "（轻微压伤，可接受，建议按常规维护计划进行）"}
                                    </p>
                                    <p><strong>点蚀分布情况：</strong>{parseFloat(currentProject.detectionResult.output.pittingRate).toFixed(1)}% 
                                        {parseFloat(currentProject.detectionResult.output.pittingRate) > 60 ? "（广泛点蚀，风险较高，建议考虑更换齿轮，检查设计参数是否合理）" 
                                        : parseFloat(currentProject.detectionResult.output.pittingRate) > 30 ? "（局部点蚀，建议加强监测，优化润滑）" 
                                        : "（初期点蚀，可接受，建议按常规维护计划进行）"}
                                    </p>
                                    <p><strong>综合损伤评级：</strong>
                                        {Math.max(
                                            parseFloat(currentProject.detectionResult.output.abrasionRate),
                                            parseFloat(currentProject.detectionResult.output.peelingRate) * 1.5,
                                            parseFloat(currentProject.detectionResult.output.scuffingRate),
                                            parseFloat(currentProject.detectionResult.output.pittingRate)
                                        ) > 80 ? "高风险" : "风险较低，可接受"} 
                                    </p>
                                    </div>
                                ) : null}
                                <p><strong>识别模型：</strong>{currentProject.detectionResult.input.model}</p>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>损伤方框图</h3>
                                {renderBlockmap()}
                            </div>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}

export default AIDetection;
