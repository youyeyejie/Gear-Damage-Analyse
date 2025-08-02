import { createContext, useContext, useState } from 'react';
import { message } from 'antd';

// 创建Context
const ProjectContext = createContext();

// 模拟初始数据
const initialLogData = [
    // { id: 1, time: '2025-07-31 10:00:00', operation: '创建项目', type: '建模', description: '创建新项目：齿轮损伤识别测试' },
    // { id: 2, time: '2025-07-31 10:05:00', operation: '上传图片', type: '识别', description: '上传损伤图片：gear_damage_1.jpg' },
    // { id: 3, time: '2025-07-31 10:10:00', operation: '开始识别', type: '识别', description: '开始AI损伤识别' },
    // { id: 4, time: '2025-07-31 10:15:00', operation: '识别完成', type: '识别', description: 'AI损伤识别完成，结果：齿面磨损' },
    // { id: 5, time: '2025-07-31 10:20:00', operation: '开始建模', type: '建模', description: '根据识别结果开始几何建模' },
    // { id: 6, time: '2025-07-31 10:30:00', operation: '建模完成', type: '建模', description: '几何建模完成，生成模型文件' },
    // { id: 7, time: '2025-07-31 10:35:00', operation: '开始仿真', type: '仿真', description: '开始齿轮仿真分析' },
    // { id: 8, time: '2025-07-31 11:00:00', operation: '仿真完成', type: '仿真', description: '齿轮仿真分析完成，生成报告' },
];

const initialDownloadData = [
    // { id: 1, name: '1.step', type: '几何模型', size: '2.5MB', time: '2025-07-31 10:30:00' },
    // { id: 2, name: '仿真报告.pdf', type: '仿真报告', size: '1.8MB', time: '2025-07-31 11:00:00' },
    // { id: 3, name: 'AI预测结果.xlsx', type: 'AI预测结果', size: '0.5MB', time: '2025-07-31 10:15:00' },
];

const initialUploadData = [
    // { id: 1, name: 'gear_damage_1.jpg', type: '图片', size: '1.2MB', time: '2025-07-31 10:05:00' },
    // { id: 2, name: 'gear_damage_2.jpg', type: '图片', size: '1.5MB', time: '2025-07-31 10:10:00' },
];

// Context Provider组件
const ProjectProvider = ({ children }) => {
    const [logs, setLogs] = useState(initialLogData);
    const [selectedLogType, setSelectedLogType] = useState('all');
    const [downloadData, setDownloadData] = useState(initialDownloadData);
    const [uploadData, setUploadData] = useState(initialUploadData);
    const [currentProject, setCurrentProject] = useState(null);

    // 添加新日志
    const addLog = (newLog) => {
        setLogs([newLog, ...logs]);
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
            status: '待建模',
            createTime: new Date().toLocaleString(),
        };

        setCurrentProject(newProject);

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
        setCurrentProject({ ...currentProject, status });
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
        setDownloadData([...downloadData, file]);
    };

    // 下载文件日志
    const downloadFileLog = (file) => {
        // 记录日志
        const newLog = {
            id: logs.length + 1,
            time: new Date().toLocaleString(),
            operation: '下载文件',
            type: file.type === '几何模型' ? '建模' : file.type === '仿真报告' ? '仿真' : '识别',
            description: `下载文件：${file.name}`,
        };
        addLog(newLog);
    };

    // 添加上传文件
    const addUploadFile = (file) => {
        setUploadData([...uploadData, file]);
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
    
    // 导出的context值
    const contextValue = {
        filteredLogs, //筛选出来日志列表
        setSelectedLogType, //筛选日志的函数

        currentProject, //当前项目相关信息
        createProject, //创建项目
        updateProjectStatus, //更新项目状态

        downloadData, //下载文件列表
        addDownloadFile, //更新下载文件列表
        downloadFileLog, //更新下载文日志

        uploadData, //上传文件列表
        addUploadFile, //更新上传文件列表
        uploadFileLog, //更新上传文件日志
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