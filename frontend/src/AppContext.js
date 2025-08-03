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
        input: {
            precision: 'low',
        },
        output: {
            damageType: null,
            damageSeverity: null,
            damageLocation: null,
            damageArea: null,
            damageDescription: null,
        },
        report: {
            name: null,
            size: null,
        },
        heatmap: {
            name: null,
            size: null,
        },
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
        model: {
            name: null,
            size: null,
        },
    },
    simulationResult: {
        input: {
            meshDensity: 'low',
            boundaryCondition: {},
        },
    }
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
    const [selectedLogType, setSelectedLogType] = useState('all');
    const [gearData, setGearData] = useState(() => {
        const savedGearData = sessionStorage.getItem('gearData');
        return savedGearData ? JSON.parse(savedGearData) : gearGroups;
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
        const updatedDownloadFileList = [...currentProject.downloadFileList, file];
        const updatedProject = {
            ...currentProject,
            downloadFileList: updatedDownloadFileList,
        };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));
        
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
    const updateUploadFileList = (file, type, operation = 'add') => {
        var updatedUploadFileList = {};
        if (type === 'ai') {
            const deduplicated = currentProject.uploadFileList.aiDetectionImage.filter(f => f.name !== file.name);
            updatedUploadFileList = { 
                ...currentProject.uploadFileList,
                aiDetectionImage: operation === 'add' ? [...deduplicated, file] : deduplicated,
            };
        } else if (type === 'model') {
            fetch('http://localhost:5000/api/deleteFile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName: currentProject.uploadFileList.geometryModel })
            }).then (()=> {
                updatedUploadFileList = { 
                    ...currentProject.uploadFileList,
                    geometryModel: file,
                };
            });
        }
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
        const updatedProject = {
            ...currentProject,
            detectionResult: result,
        };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));

        if (result.output?.damageType) {
            // 记录日志
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleString(),
                operation: '识别结果',
                type: '识别',
                description: `识别结果：${result.output.damageType}，${result.output.damageSeverity}，${result.output.damageLocation}，${result.output.damageDescription}`,
            };
            addLog(newLog);
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

    // 更新齿轮组编号
    const updateSelectedGearGroup = (selectedGearGroup) => {
        const updatedProject = {
            ...currentProject,
            selectedGearGroup: selectedGearGroup,
        };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));

        // 记录日志
        const newLog = {
            id: Date.now(),
            time: new Date().toLocaleString(),
            operation: '选择齿轮组',
            type: '建模',
            description: `选择齿轮组：${selectedGearGroup.groupNumber}，主齿轮：${selectedGearGroup.mainGear.model}，从齿轮：${selectedGearGroup.subGear.model}`,
        };
        addLog(newLog);
    };

    // 更新建模结果
    const updateModelingResult = (modelingResult) => {
        const updatedProject = {
            ...currentProject,
            modelingResult: modelingResult,
        };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));

        if (modelingResult.model?.name) {
            // 记录日志
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleString(),
                operation: '建模结果',
                type: '建模',
                description: `建模结果：${modelingResult.model.name}，${modelingResult.model.size}`,
            };
            addLog(newLog);
        }
    };

    // 更新仿真结果
    const updateSimulationResult = (simulationResult) => {
        const updatedProject = {
            ...currentProject,
            simulationResult: simulationResult,
        };
        setCurrentProject(updatedProject);
        sessionStorage.setItem('currentProject', JSON.stringify(updatedProject));

        if (simulationResult.report?.name) {
            // 记录日志
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleString(),
                operation: '仿真结果',
                type: '仿真',
                description: `仿真结果：${simulationResult.report.name}，${simulationResult.report.size}`,
            };
            addLog(newLog);
        }
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

        gearData, //齿轮数据
        loadGearData, //加载齿轮数据
        updateSelectedGearGroup, //更新齿轮组
        updateModelingResult, //更新建模结果

        updateSimulationResult, //更新仿真结果
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