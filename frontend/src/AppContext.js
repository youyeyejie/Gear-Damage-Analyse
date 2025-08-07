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
    uploadFileList: [],
    detectionResult: {
        input: {
            image: [],
        },
        output: {
            isDamage: null,
        },
        heatmap: [],
    },
    selectedGearGroup: {
        groupNumber: null,
        masterGear: {
            model: "06-4880（06-4163）",
            parameters: {
                "中心距a（mm）": null,
                "模数mn（mm）": null,
                "齿数z": null,
                "变位系数x": null,
                "螺旋角β（°）": null,
                "压力角α（°）": null,
                "齿顶圆da-φ（mm）": null,
                "齿宽b（mm）": null
            },
            materialProperties: {
                "材料名称": null,
                "密度（g/cm3）": null,
                "弹性模量E（MPa）": null,
                "泊松比v": null,
                "屈服应力（MPa）": null,
                "强度系数K": null,
                "硬化指数n": null,
                "摩擦系数": null
            },
            loadData: {
                "扭矩（N·m）": null,
                "转速（r/min）": null,
            }
        },
        slaveGear: {
            model: "06-4176",
            parameters: {   
                "中心距a（mm）": null,
                "模数mn（mm）": null,
                "齿数z": null,
                "变位系数x": null,
                "螺旋角β（°）": null,
                "压力角α（°）": null,
                "齿顶圆da-φ（mm）": null,
                "齿宽b（mm）": null
            },
            materialProperties: {
                "材料名称": null,
                "密度（g/cm3）": null,
                "弹性模量E（MPa）": null,
                "泊松比v": null,
                "屈服应力（MPa）": null,
                "强度系数K": null,
                "硬化指数n": null,
                "摩擦系数": null
            },
            loadData: {
                "扭矩（N·m）": null,
                "转速（r/min）": null
            }
        }
    },
    modelingResult: {
        input: {
            gearGroupNumber: null,
            isDamage: null,
        },
        model: {
            name: null,
            size: null,
        },
    },
    simulationResult: {
        input: {
            gearGroupNumber: null,
            isDamage: null,
            model: {
                name: null,
            },
        },
        output: {
            remainLife: null,
        },
        stress_cloudmap: {
            name: null,
            size: null,
        },
        remain_life_cloudmap: {
            name: null,
            size: null,
        },
    },
};

const Logs = [];
const gearGroups = [];

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
    const [gearData, setGearData] = useState(() => {
        const savedGearData = sessionStorage.getItem('gearData');
        return savedGearData ? JSON.parse(savedGearData) : gearGroups;
    });

    // 创建新项目
    const createProject = (projectName, projectPath) => {
        const projectInfo = {
            id: Date.now(),
            name: projectName,
            path: projectPath,
            status: '待识别',
            createTime: new Date().toLocaleString(),
        };
        const newProject = {
            ...ProjectManager,
            projectInfo,
        };
        console.log(newProject);

        setCurrentProject(newProject);
        sessionStorage.setItem('currentProject', JSON.stringify(newProject));

        // 记录日志
        const updatedLogs = [{
            id: Date.now(),
            time: new Date().toLocaleString(),
            operation: '创建项目',
            type: '其他',
            description: `创建新项目：${projectName}，路径：${projectPath}`,
        }, ...logs];
        setLogs(updatedLogs);
        sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
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
            const updatedLogs = [{
                id: Date.now(),
                time: new Date().toLocaleString(),
                operation: '下载文件',
                type: file.type === '几何模型' ? '建模' : file.type === '仿真报告' ? '仿真' : '识别',
                description: `下载文件：${file.name}`,
            }, ...logs];
            setLogs(updatedLogs);
            sessionStorage.setItem('logs', JSON.stringify(updatedLogs));
            message.success(`文件 ${file.name} 下载成功`);
        } catch (error) {
            message.error('下载文件失败：' + error.message); 
        }
    };
    
    const loadGearData = async () => {
        try {
            // 从本地JSON文件加载齿轮数据: frontend/src/gear.json
            const response = await fetch('/gear.json');
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            const gearDataFromFile = await response.json();
            // 从JSON数据中提取groups数组赋值给齿轮数据
            setGearData(gearDataFromFile.groups);
        } catch (error) {
            message.error('加载齿轮数据失败：' + error.message); 
        }
    };


    // 导出的context值
    const contextValue = {
        logs, //日志列表
        setLogs, //更新日志列表

        currentProject, //当前项目相关信息
        setCurrentProject, //更新当前项目
        createProject, //创建项目

        downloadFile, //下载文件

        gearData, //齿轮数据
        loadGearData, //加载齿轮数据
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