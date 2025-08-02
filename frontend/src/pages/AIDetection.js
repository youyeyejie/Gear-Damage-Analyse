import React, { useState } from 'react';
import { Button, Upload, message, Row, Col, Select, Image } from 'antd';
import { DownloadOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useProjectContext } from '../AppContext';
import '../App.css';

const { Option } = Select;

function AIDetection() {
    const { currentProject, updateProjectStatus, uploadData, 
        setUploadData, uploadFileLog, detectionResult, updateDetectionResult, 
        addDownloadFile, downloadFile, downloadData } = useProjectContext();
    const [isDetecting, setIsDetecting] = useState(false);
    const [precision, setPrecision] = useState('medium');
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
    const handleUploadChange = ({ fileList: newFileList, file: currentFile }) => {
        setUploadData(newFileList); 
        // 存储到sessionStorage
        sessionStorage.setItem('uploadData', JSON.stringify(uploadData));
    
        // 文件开始上传前检查是否已建立项目
        // 只在当前文件上传完成或失败时显示消息
        if (currentFile) {
            if (!currentProject) {
                message.warning('请先创建项目');
                setUploadData([]);
                sessionStorage.setItem('uploadData', JSON.stringify(uploadData));
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
                return;
            }
            if (currentFile.status === "error") {
                message.error(currentFile.response?.msg || '上传失败');
            } else if (currentFile.status === "done") {
                message.success(currentFile.response?.msg || '上传成功');
                uploadFileLog(currentFile);
            }
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
                        setUploadData(prev => prev.filter(f => f.uid !== file.uid));
                        sessionStorage.setItem('uploadData', JSON.stringify(uploadData));
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
        if (uploadData.length === 0) {
            message.warning('请先上传至少一张图片');
            return;
        }

        setIsDetecting(true);
        updateProjectStatus('识别中');
        const images = [];
        uploadData.map(file => images.push(file.response.data.fileName));

        try {
            const response = await fetch('http://localhost:5000/api/aiDetection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    precision: precision,
                    images: images,
                })
            });

            const resData = await response.json();
            setIsDetecting(false);

            if (resData.code === '200') {
                // 识别成功，更新结果
                updateDetectionResult({
                    damageType: resData.data.damageType,
                    damageSeverity: resData.data.damageSeverity,
                    damageLocation: resData.data.damageLocation,
                    damageArea: resData.data.damageArea,
                    damageDescription: resData.data.damageDescription,
                    report: {
                        name: resData.data.report.name,
                        size: resData.data.report.size,
                    },
                    heatmap: {
                        name: resData.data.heatmap.name,
                        size: resData.data.heatmap.size,
                    },
                    precision: resData.data.precision,
                });

                // 更新项目状态
                updateProjectStatus('识别完成');

                // 添加报告到下载列表
                const timestamp = Date.now();
                const reportFile = {
                    id: timestamp,
                    name: resData.data.report.name,
                    type: 'AI识别报告',
                    size: resData.data.report.size,
                    time: new Date().toLocaleString()
                };
                addDownloadFile(reportFile);
                console.log('添加报告文件到downloadData:', reportFile);
                // 添加热力图到下载列表
                const heatmapFile = {
                    id: timestamp + 1,  // 确保ID唯一
                    name: resData.data.heatmap.name,
                    type: 'AI识别热力图',
                    size: resData.data.heatmap.size,
                    time: new Date().toLocaleString()
                };
                addDownloadFile(heatmapFile);
                console.log('添加热力图文件到downloadData:', heatmapFile);
                console.log('当前downloadData长度:', downloadData.length);
                message.success('AI识别成功');
            } else {
                message.error(`识别失败: ${resData.msg}`);
                updateProjectStatus('识别失败');
            }
        } catch (error) {
            setIsDetecting(false);
            message.error(`识别失败: ${error.message}`);
            updateProjectStatus('识别失败');
        }
    };

    // 下载AI预测报告
    const handleDownloadReport = () => {
        if (!detectionResult.damageType) {
            message.warning('请先完成AI识别');
            return;
        }
        downloadFile(detectionResult.report);
    };

    // 下载热力图
    const handleDownloadHeatmap = () => {
        if (!detectionResult.heatmap) {
            message.warning('请先完成AI识别');
            return;
        }
        downloadFile(detectionResult.heatmap);
    };

    // 展示热力图
    const renderHeatmap = () => {
        if (!detectionResult.heatmap) {
            return <div>暂无热力图数据</div>;
        }

        // 构建图片URL
        const imageUrl = `http://localhost:5000/api/downloadFile?fileName=${detectionResult.heatmap.name}`;

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
                    fileList={uploadData}
                    onPreview={handlePreview}
                    onRemove={handleRemoveFile}
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
                    <span style={{ marginRight: '16px' }}>识别精度: </span>
                    <Select
                        defaultValue="medium"
                        style={{ width: 120 }}
                        onChange={setPrecision}
                        value={precision}
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
                    hidden={!detectionResult.damageType}
                >
                    下载AI预测报告
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadHeatmap}
                    hidden={!detectionResult.damageType}
                >
                    下载热力图
                </Button>
            </div>

            {detectionResult.damageType && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h2 style={{ marginBottom: '16px' }}>识别结果</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <div className="card" style={{ height: '100%', padding: '16px' }}>
                                <h3 style={{ marginBottom: '16px' }}>损伤信息</h3>
                                <p><strong>损伤类型：</strong>{detectionResult.damageType}</p>
                                <p><strong>损伤严重程度：</strong>{detectionResult.damageSeverity}</p>
                                <p><strong>损伤面积：</strong>{detectionResult.damageArea}</p>
                                <p><strong>损伤位置：</strong>{detectionResult.damageLocation}</p>
                                <p><strong>损伤描述：</strong>{detectionResult.damageDescription}</p>
                                <p><strong>识别精度：</strong>{precision === 'high' ? '高精度' : precision === 'medium' ? '中等精度' : '低精度'}</p>
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

            {/* 移除自定义预览模态框，使用Ant Design的Image组件预览功能 */}
        </div>
    );
}

export default AIDetection;
