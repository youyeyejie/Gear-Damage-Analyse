import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import { FileTextOutlined, DatabaseOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons';
import './App.css';

// 导入页面组件
import ProjectSettings from './pages/ProjectSettings';
import AIDetection from './pages/AIDetection';
import GeometryModeling from './pages/GeometryModeling';
import SimulationSettings from './pages/SimulationSettings';
import DataVisualization from './pages/DataVisualization';

const { Header, Content, Footer, Sider } = Layout;

function App() {
    const [collapsed, setCollapsed] = useState(false);
    const [projectStatus, setProjectStatus] = useState('待建模');

    const handleMenuClick = (e) => {
        // 移除未使用的currentPage状态更新
    };

    const updateProjectStatus = (status) => {
        setProjectStatus(status);
        message.success(`项目状态更新为: ${status}`);
    };

    return (
        <Router>
            <Layout style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
                    <div className="logo" style={{ color: 'white', textAlign: 'center', padding: '16px', fontSize: '18px', fontWeight: 'bold' }}>
                        齿轮损伤识别系统
                    </div>
                    <Menu
                        theme="dark"
                        defaultSelectedKeys={['projectSettings']}
                        mode="inline"
                        onClick={handleMenuClick}
                        items={[
                            {
                                key: 'projectSettings',
                                icon: <SettingOutlined />,
                                label: <Link to="/">项目设置</Link>,
                            },
                            {
                                key: 'aiDetection',
                                icon: <FileTextOutlined />,
                                label: <Link to="/ai-detection">智能识别</Link>,
                            },
                            {
                                key: 'geometryModeling',
                                icon: <DatabaseOutlined />,
                                label: <Link to="/geometry-modeling">几何建模</Link>,
                            },
                            {
                                key: 'simulationSettings',
                                icon: <SettingOutlined />,
                                label: <Link to="/simulation-settings">仿真设置</Link>,
                            },
                            {
                                key: 'dataVisualization',
                                icon: <BarChartOutlined />,
                                label: <Link to="/data-visualization">数据展示</Link>,
                            },
                        ]}
                    />
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-background" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
                        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                            当前项目状态: <span style={{ color: '#1890ff' }}>{projectStatus}</span>
                        </div>
                    </Header>
                    <Content style={{ margin: '0 16px' }}>
                        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                            <Routes>
                                <Route path="/" element={<ProjectSettings updateProjectStatus={updateProjectStatus} />} />
                                <Route path="/ai-detection" element={<AIDetection updateProjectStatus={updateProjectStatus} />} />
                                <Route path="/geometry-modeling" element={<GeometryModeling updateProjectStatus={updateProjectStatus} />} />
                                <Route path="/simulation-settings" element={<SimulationSettings updateProjectStatus={updateProjectStatus} />} />
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

export default App;
