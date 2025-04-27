import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography, Menu } from 'antd';
import DataTable from './components/DataTable';
import ImportData from './components/ImportData';
import ExportData from './components/ExportData'; // 引入新的导出组件
import ModelFineTuning from './components/ModelFineTuning'; // 导入模型微调组件
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const location = window.location.pathname;

  return (
    <Router>
      <Layout className="layout">
        <Header className="header" style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={3} style={{ color: 'white', margin: '0', marginRight: '50px' }}>
            数据集标注管理系统 V 0.8内部测试版
          </Title>
          <Menu theme="dark" mode="horizontal" selectedKeys={[location]} style={{ flex: 1, minWidth: 0 }}>
            <Menu.Item key="/">
              <Link to="/">数据列表</Link>
            </Menu.Item>
            <Menu.Item key="/import">
              <Link to="/import">导入数据</Link>
            </Menu.Item>
            {/* 新增导出数据菜单项 */}
            <Menu.Item key="/export">
              <Link to="/export">导出数据</Link>
            </Menu.Item>
            {/* 新增模型微调菜单项 */}
            <Menu.Item key="/fine-tune">
              <Link to="/fine-tune">模型微调</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content className="content">
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<DataTable />} />
              <Route path="/import" element={<ImportData />} />
              {/* 新增导出数据路由 */}
              <Route path="/export" element={<ExportData />} />
              {/* 新增模型微调路由 */}
              <Route path="/fine-tune" element={<ModelFineTuning />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          柳州职业技术大学 数据集标注管理系统 V 0.8内部测试版 © Power by 紫絮凝烟
        </Footer>
      </Layout>
    </Router>
  );
}

export default App;
