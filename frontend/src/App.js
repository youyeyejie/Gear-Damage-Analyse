import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { FileTextOutlined, DatabaseOutlined, SettingOutlined, BarChartOutlined, SlidersOutlined } from '@ant-design/icons';
import './App.css';
import { ProjectProvider, useProjectContext } from './AppContext';

// 导入页面组件
import ProjectSettings from './pages/ProjectSettings';
import AIDetection from './pages/AIDetection';
import GeometryModeling from './pages/GeometryModeling';
import SimulationSettings from './pages/SimulationSettings';
import DataVisualization from './pages/DataVisualization';

const { Header, Content, Footer, Sider } = Layout;

function AppContent() {
    const [collapsed, setCollapsed] = useState(false);
    const [ selectedMenu, setSelectedMenu] = useState(() => {
        const savedMenu = sessionStorage.getItem('selectedMenu');
        return savedMenu || 'projectSettings';
    });
    const { currentProject } = useProjectContext()

    return (
            <Router>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                    <div className="logo" style={{ minHeight: '64px', color: 'white', textAlign: 'center', padding: '18px', fontSize: '18px', fontWeight: 'bold' }}>
                        齿轮损伤识别系统
                    </div>
                    <Menu
                        theme="dark"
                        defaultSelectedKeys={[selectedMenu]}
                        selectedKeys={[selectedMenu]}
                        mode="inline"
                        items={[
                            {
                                key: 'projectSettings',
                                icon: <SettingOutlined />,
                                label: <Link to="/" onClick={() => {
                                    setSelectedMenu('projectSettings');
                                    sessionStorage.setItem('selectedMenu', 'projectSettings');
                                }}>项目设置</Link>,
                            },
                            {
                                key: 'aiDetection',
                                icon: <FileTextOutlined />,
                                label: <Link to="/ai-detection" onClick={() => {
                                    setSelectedMenu('aiDetection');
                                    sessionStorage.setItem('selectedMenu', 'aiDetection');
                                }}>损伤识别</Link>,
                            },
                            {
                                key: 'geometryModeling',
                                icon: <DatabaseOutlined />,
                                label: <Link to="/geometry-modeling" onClick={() => {
                                    setSelectedMenu('geometryModeling');
                                    sessionStorage.setItem('selectedMenu', 'geometryModeling');
                                }}>几何建模</Link>,
                            },
                            {
                                key: 'simulationSettings',
                                icon: <SlidersOutlined />,
                                label: <Link to="/simulation-settings" onClick={() => {
                                    setSelectedMenu('simulationSettings');
                                    sessionStorage.setItem('selectedMenu', 'simulationSettings');
                                }}>仿真计算</Link>,
                            },
                            {
                                key: 'dataVisualization',
                                icon: <BarChartOutlined />,
                                label: <Link to="/data-visualization" onClick={() => {
                                    setSelectedMenu('dataVisualization');
                                    sessionStorage.setItem('selectedMenu', 'dataVisualization');
                                }}>数据展示</Link>,
                            },
                        ]}
                    />
                </Sider>
                <Layout className="site-layout">
                    <Header className={`site-layout-background ${collapsed ? 'ant-layout-header-collapsed' : ''}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
                        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                            <span>
                                当前项目: &nbsp;
                                <span style={{ color: '#1890ff' }}>
                                    {currentProject?.projectInfo?.name || '未创建项目'}
                                </span>
                            </span>
                            {currentProject?.projectInfo?.name && (
                                <span style={{ marginLeft: '30px' }}>
                                    状态: &nbsp;
                                    <span style={{ color: '#1890ff' }}>
                                        {currentProject?.projectInfo?.status || '未创建项目'}
                                    </span>
                                </span>
                            )}
                        </div>
                    </Header>
                    <Content className={collapsed ? 'ant-layout-content-collapsed' : ''}>
                        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                            <Routes>
                                <Route path="/" element={<ProjectSettings />} />
                                <Route path="/ai-detection" element={<AIDetection />} />
                                <Route path="/geometry-modeling" element={<GeometryModeling />} />
                                <Route path="/simulation-settings" element={<SimulationSettings />} />
                                <Route path="/data-visualization" element={<DataVisualization />} />
                            </Routes>
                        </div>
                    </Content>
                    <Footer style={{ textAlign: 'center' }}>齿轮损伤识别和剩余寿命预测系统 © {new Date().getFullYear()}</Footer>
                </Layout>
            </Layout>
            </Router>
    );
}

function App() {
    return (
        <ProjectProvider>
            <AppContent />
        </ProjectProvider>
    );
}

export default App;
