import { createContext, useContext, useState } from 'react';
import { message } from 'antd';

// 创建Context
const ProjectContext = createContext();

const ProjectManager = {
    projectInfo: {
        id: null,
        name: null,
        path: null,
        status: null,
        createTime: null,
    },
    downloadFileList: [],
    uploadFileList: {
        aiDetectionImage: [],
        geometryModel: null,
    },
    detectionResult: {
        damageType: null,
        damageSeverity: null,
        damageLocation: null,
        damageArea: null,
        damageDescription: null,
        report: {
            name: null,
            size: null,
        },
        heatmap: {
            name: null,
            size: null,
        },
        precision: null,
    },
};

const Logs = [];

// Context Provider组件
const ProjectProvider = ({ children }) => {
    const [currentProject, setCurrentProject] = useState(() => {
        const savedProject = sessionStorage.getItem('currentProject');
        return savedProject ? JSON.parse(savedProject) : ProjectManager;
    });
    const [logs, setLogs] = useState(() => {
        const savedLogs = sessionStorage.getItem('logs');
        return savedLogs ? JSON.parse(savedLogs) : Logs;
    });
    const [selectedLogType, setSelectedLogType] = useState('all');

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
            projectInfo: {
                id: Date.now(),
                name: projectName,
                path: projectPath,
                status: '待识别',
                createTime: new Date().toLocaleString(),
            },
            downloadFileList: [],
            uploadFileList: {
                aiDetectionImage: [],
                geometryModel: null,
            },
            detectionResult: {
                damageType: null,
                damageSeverity: null,
                damageLocation: null,
                damageArea: null,
                damageDescription: null,
                report: {
                    name: null,
                    size: null,
                },
                heatmap: {
                    name: null,
                    size: null,
                },
                precision: null,
            },
        };
        console.log(newProject);

        setCurrentProject(newProject);
        sessionStorage.setItem('currentProject', JSON.stringify(newProject));

        // 记录日志
        const newLog = {
            id: Date.now(),
            time: new Date().toLocaleString(),
            operation: '创建项目',
            type: '其他',
            description: `创建新项目：${projectName}，路径：${projectPath}`,
        };
        addLog(newLog);
    };

    // 更新项目状态
    const updateProjectStatus = (status) => {
        const updatedProject = { ...currentProject, projectInfo: { ...currentProject.projectInfo, status } };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));
        
        message.success(`项目状态更新为: ${status}`);
        // 记录日志
        const newLog = {
            id: Date.now(),
            time: new Date().toLocaleString(),
            operation: '更新状态',
            type: status.includes('建模') ? '建模' :
                    status.includes('仿真') ? '仿真' :
                    status.includes('识别') ? '识别' : '其他',
            description: `项目状态更新为: ${status}`,
        };
        addLog(newLog);
    };

    // 更新下载文件列表
    const updateDownloadFileList = (file) => {
        setCurrentProject(prevProject => ({
            ...prevProject,
            downloadFileList: [...prevProject.downloadFileList, file],
        }));
        sessionStorage.setItem('currentProject', JSON.stringify(currentProject));
        // 记录日志
        const newLog = {
            id: Date.now(),
            time: new Date().toLocaleString(),
            operation: '新增可下载文件',
            type: file.type.includes('模型') ? '建模' :
                    file.type.includes('仿真') ? '仿真' :
                    file.type.includes('报告') ? '识别' : '其他',
            description: `新增可下载文件：${file.name}`,
        };
        addLog(newLog);
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
                id: Date.now(),
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
    
    // 更新上传文件列表
    // type: ai, model
    // operation: add, remove
    const updateUploadFileList = (file, type, operation) => {
        var updatedUploadFileList = {};
        if (type === 'ai') {
            const deduplicated = currentProject.uploadFileList.aiDetectionImage.filter(f => f.name !== file.name);
            updatedUploadFileList = { 
                ...currentProject.uploadFileList,
                aiDetectionImage: operation === 'add' ? [...deduplicated, file] : deduplicated,
            };
        } else if (type === 'model') {
            updatedUploadFileList = { 
                ...currentProject.uploadFileList,
                geometryModel: operation === 'add' ? file : null,
            };
        }
        console.log(updatedUploadFileList);
        const updatedProject = { ...currentProject, uploadFileList: updatedUploadFileList };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));

        // 记录日志
        if (operation === 'add' && file.status === 'done') {
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleString(),
                operation: '上传文件',
                type: file.type.includes('模型') ? '建模' : 
                        file.type.includes('仿真') ? '仿真' : 
                        file.type.includes('报告') ? '识别' : '其他',
                description: `上传文件：${file.name}`,
            };
            addLog(newLog);
        }
    };

    // 清空上传文件列表
    const clearUploadFileList = () => {
        const updatedProject = { ...currentProject, uploadFileList: {
            aiDetectionImage: [],
            geometryModel: null,
        } };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));
    };

    // 更新识别结果
    const updateDetectionResult = (result) => {
        setCurrentProject(prevProject => ({
            ...prevProject,
            detectionResult: result,
        }));
        sessionStorage.setItem('currentProject', JSON.stringify(currentProject));

        // 记录日志
        const newLog = {
            id: Date.now(),
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
        setCurrentProject, //更新当前项目
        createProject, //创建项目
        updateProjectStatus, //更新项目状态

        updateDownloadFileList, //更新下载文件列表
        downloadFile, //下载文件

        updateUploadFileList, //更新上传文件列表
        clearUploadFileList, //清空上传文件列表

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