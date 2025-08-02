import { createContext, useContext, useState } from 'react';
import { message } from 'antd';

// 创建Context
const ProjectContext = createContext();
const DetectionResult = {
    damageType: '',
    damageSeverity: '',
    damageLocation: '',
    damageArea: '',
    damageDescription: '',
    report: {
        name: '',
        size: '',
    },
    heatmap: {
        name: '',
        size: '',
    },
    precision: '',
};

// Context Provider组件
const ProjectProvider = ({ children }) => {
    const [currentProject, setCurrentProject] = useState(() => {
        const savedProject = sessionStorage.getItem('currentProject');
        return savedProject ? JSON.parse(savedProject) : null;
    });
    const [logs, setLogs] = useState(() => {
        const savedLogs = sessionStorage.getItem('logs');
        return savedLogs ? JSON.parse(savedLogs) : [];
    });
    const [selectedLogType, setSelectedLogType] = useState('all');
    const [downloadData, setDownloadData] = useState(() => {
            const savedDownloadData = sessionStorage.getItem('downloadData');
            return savedDownloadData ? JSON.parse(savedDownloadData) : [];
    });
    const [uploadData, setUploadData] = useState(() => {
            const savedUploadData = sessionStorage.getItem('uploadData');
            return savedUploadData ? JSON.parse(savedUploadData) : [];
    });
    const [detectionResult, setDetectionResult] = useState(() => {
        const savedDetectionResult = sessionStorage.getItem('detectionResult');
        return savedDetectionResult ? JSON.parse(savedDetectionResult) : DetectionResult;
    });

    // 添加新日志
    const addLog = (newLog) => {
        setLogs(prevLogs => {
            const updatedLogs = [newLog, ...prevLogs];
            return updatedLogs;
        });
        sessionStorage.setItem('logs', JSON.stringify(logs));
    };

    // 筛选日志
    const filteredLogs = selectedLogType === 'all'
        ? logs
        : logs.filter(log => log.type === selectedLogType);


    // 创建新项目
    const createProject = (projectName, projectPath) => {
        const newProject = {
            id: Date.now(),
            name: projectName,
            path: projectPath,
            status: '待识别',
            createTime: new Date().toLocaleString(),
        };

        setCurrentProject(newProject);
        sessionStorage.setItem('currentProject', JSON.stringify(newProject));
        // 清空上传数据
        setUploadData([]);
        sessionStorage.setItem('uploadData', JSON.stringify([]));
        // 清空识别结果
        setDetectionResult(DetectionResult);
        sessionStorage.setItem('detectionResult', JSON.stringify(DetectionResult));
        // 清空下载数据
        setDownloadData([]);
        sessionStorage.setItem('downloadData', JSON.stringify([]));

        // 记录日志
        const newLog = {
            id: logs.length + 1,
            time: new Date().toLocaleString(),
            operation: '创建项目',
            type: '建模',
            description: `创建新项目：${projectName}`,
        };
        addLog(newLog);
    };

    // 更新项目状态
    const updateProjectStatus = (status) => {
        const updatedProject = { ...currentProject, status };
        setCurrentProject(updatedProject);
        // 更新sessionStorage中的项目状态
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));
        message.success(`项目状态更新为: ${status}`);

        // 记录日志
        const newLog = {
            id: logs.length + 1,
            time: new Date().toLocaleString(),
            operation: '更新状态',
            type: status === '待建模' || status === '建模中' || status === '建模完成' ? '建模' :
                    status === '待仿真' || status === '仿真中' || status === '仿真完成' ? '仿真' : '识别',
            description: `项目状态更新为: ${status}`,
        };
        addLog(newLog);
    };

    // 添加下载文件
    const addDownloadFile = (file) => {
        setDownloadData(prevDownloadData => {
            const updatedDownloadData = [...prevDownloadData, file];
            return updatedDownloadData;
        });
        sessionStorage.setItem('downloadData', JSON.stringify(downloadData));
    };

    // 下载文件
    const downloadFile = async (file) => {
        try {
            const response = await fetch(`/api/downloadFile?fileName=${file.name}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('文件不存在');
                } else {
                    throw new Error(`HTTP错误! 状态码: ${response.status}`);
                }
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(url);
             // 记录日志
            const newLog = {
                id: logs.length + 1,
                time: new Date().toLocaleString(),
                operation: '下载文件',
                type: file.type === '几何模型' ? '建模' : file.type === '仿真报告' ? '仿真' : '识别',
                description: `下载文件：${file.name}`,
            };
            addLog(newLog);
            message.success(`文件 ${file.name} 下载成功`);
        } catch (error) {
            message.error('下载文件失败：' + error.message); 
        }
    };


    // 上传文件日志
    const uploadFileLog = (file) => {
        // 记录日志
        const newLog = {
            id: logs.length + 1,
            time: new Date().toLocaleString(),
            operation: '上传文件',
            type: file.type === '几何模型' ? '建模' : file.type === '仿真报告' ? '仿真' : '识别',
            description: `上传文件：${file.name}`,
        };
        addLog(newLog);
    };

    // 更新识别结果
    const updateDetectionResult = (result) => {
        setDetectionResult(result);
        // 存储到sessionStorage
        sessionStorage.setItem('detectionResult', JSON.stringify(result));
        // 记录日志
        const newLog = {
            id: logs.length + 1,
            time: new Date().toLocaleString(),
            operation: '识别结果',
            type: '识别',
            description: `识别结果：${result.damageType}，${result.damageSeverity}，${result.damageLocation}，${result.damageDescription}`,
        };
        addLog(newLog);
    };


    // 导出的context值
    const contextValue = {
        filteredLogs, //筛选出来日志列表
        setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        createProject, //创建项目
        updateProjectStatus, //更新项目状态

        downloadData, //下载文件列表
        addDownloadFile, //更新下载文件列表
        downloadFile, //下载文件

        uploadData, //上传文件列表
        setUploadData, //更新上传文件列表
        uploadFileLog, //更新上传文件日志

        detectionResult, //识别结果
        updateDetectionResult, //更新识别结果
    };

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
};

// 自定义Hook，便于使用context
const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
};

export { ProjectProvider, useProjectContext };