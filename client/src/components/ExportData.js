import React, { useState, useEffect } from 'react';
// 引入 Table 组件
import { Select, Button, message, Spin, Typography, Form, Space, Table } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'; // 引入预览图标
import axios from 'axios';
import moment from 'moment'; // 用于生成默认文件名

const { Title } = Typography;
const { Option } = Select;

const API_URL = 'http://localhost:5000/api'; // 确保 API URL 正确

const ExportData = () => {
  const [projectNames, setProjectNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null); // 默认不选定项目
  const [confirmStatus, setConfirmStatus] = useState('all'); // 默认导出全部状态
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [previewData, setPreviewData] = useState([]); // 新增：存储预览数据
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); // 新增：预览加载状态

  // 获取项目名称列表
  const fetchProjectNames = async () => {
    setLoading(true);
    try {
      // 复用获取所有条目的接口来提取项目名
      const response = await axios.get(`${API_URL}/entries`);
      const uniqueProjectNames = [...new Set(response.data.map(item => item.ProjectName))].filter(Boolean);
      setProjectNames(uniqueProjectNames.sort());
    } catch (error) {
      message.error('获取项目列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectNames();
  }, []);

  // 添加 useEffect 方便观察 previewData 状态变化
  useEffect(() => {
    console.log('Preview data state updated:', previewData);
  }, [previewData]);

  // 新增：处理预览操作
  const handlePreview = async () => {
    console.log('Preview requested with filters:', { selectedProject, confirmStatus }); // 增加日志：记录筛选条件
    setIsPreviewLoading(true); // 开始加载预览
    setPreviewData([]); // 清空旧的预览数据

    try {
      // 构建请求参数
      const params = {};
      if (selectedProject) {
        params.projectName = selectedProject;
      }
      if (confirmStatus !== 'all') {
        params.confirmStatus = confirmStatus; // 后端需要处理 '1'
      }
      console.log('Calling API /api/dataset/export with params:', params); // 增加日志：记录API请求参数

      // 调用后端接口获取数据（复用导出接口逻辑，但只获取数据不下载）
      const response = await axios.get(`${API_URL}/dataset/export`, { params });
      console.log('API response received:', response); // 增加日志：记录原始API响应

      // 确保 response.data 是一个数组
      if (Array.isArray(response.data)) {
          console.log(`API returned ${response.data.length} items.`); // 增加日志：记录返回条目数
          if (response.data.length === 0) {
              message.info('没有找到符合条件的数据可供预览');
              setPreviewData([]); // 明确设置为空数组
          } else {
              // 基础检查：确保数据包含必要的键 (ID, Question)
              if (response.data[0] && response.data[0].hasOwnProperty('ID') && response.data[0].hasOwnProperty('Question')) {
                 setPreviewData(response.data);
                 message.success(`加载了 ${response.data.length} 条数据供预览`);
              } else {
                 // 如果数据结构不符合预期
                 console.error('API response data structure incorrect:', response.data[0]);
                 message.error('预览失败：返回的数据格式不正确');
                 setPreviewData([]);
              }
          }
      } else {
          // 如果返回的不是数组
          console.error('API response data is not an array:', response.data);
          message.error('预览失败：服务器返回的数据格式无效');
          setPreviewData([]);
      }

    } catch (error) {
      console.error('预览 API 调用失败:', error); // 修改日志文本
      message.error('加载预览数据失败: ' + (error.response?.data?.message || error.message));
      setPreviewData([]); // 出错时也清空
    } finally {
      setIsPreviewLoading(false); // 结束加载预览
    }
  };

  // 处理导出操作 (保持不变，导出时重新获取最新数据)
  const handleExport = async () => {
    setLoading(true);
    try {
      // 构建请求参数
      const params = {};
      if (selectedProject) {
        params.projectName = selectedProject;
      }
      if (confirmStatus !== 'all') {
        params.confirmStatus = confirmStatus; // 后端需要处理 '1'
      }

      // 调用后端导出接口
      const response = await axios.get(`${API_URL}/dataset/export`, { params });

      if (!response.data || response.data.length === 0) {
        message.warning('没有找到符合条件的数据可供导出');
        setLoading(false);
        return;
      }

      // 映射数据结构为目标 JSON 格式
      const exportData = response.data.map(item => ({
        instruction: item.Question || '',
        input: '', // input 字段固定为空字符串
        output: item.Answer || '',
        system: item.RoleTip || '',
      }));

      // 生成 JSON 文件并触发下载
      const jsonString = JSON.stringify(exportData, null, 2); // 格式化 JSON 输出
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // 生成文件名，例如: export_项目名_状态_时间戳.json
      const timestamp = moment().format('YYYYMMDDHHmmss');
      const projectNamePart = selectedProject ? selectedProject.replace(/\s+/g, '_') : 'all_projects';
      const statusPart = confirmStatus === '1' ? 'confirmed' : 'all_status';
      link.download = `export_${projectNamePart}_${statusPart}_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // 释放内存

      message.success(`成功导出 ${exportData.length} 条数据`);

    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 定义预览表格的列
  const previewColumns = [
    {
      title: 'ID',
      dataIndex: 'ID',
      key: 'ID',
      width: 80,
    },
    {
      title: '问题 (Instruction)',
      dataIndex: 'Question',
      key: 'Question',
      // 添加 ellipsis 以防问题过长
      ellipsis: true,
    },
  ];


  return (
    <Spin spinning={loading || isPreviewLoading} tip={isPreviewLoading ? "正在加载预览..." : "正在导出..."}>
      <Title level={4}>导出数据</Title>
      {/* 修改 Form 的 onFinish 为 handleExport，预览按钮单独触发 */}
      <Form form={form} layout="inline" style={{ marginBottom: '20px' }}>
        <Form.Item label="项目名称">
          <Select
            placeholder="选择项目 (可选)"
            allowClear
            style={{ width: 200 }}
            value={selectedProject}
            onChange={value => {setSelectedProject(value); setPreviewData([])}} // 选择变化时清空预览
            loading={loading && projectNames.length === 0}
          >
            {projectNames.map(name => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="确认状态">
          <Select
            style={{ width: 150 }}
            value={confirmStatus}
            onChange={value => {setConfirmStatus(value); setPreviewData([])}} // 选择变化时清空预览
          >
            <Option value="all">全部</Option>
            <Option value="1">仅已确认</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            {/* 预览按钮 */}
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={handlePreview} // 点击触发预览
              disabled={loading || isPreviewLoading}
            >
              预览数据
            </Button>
            {/* 导出按钮 */}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport} // 点击触发导出
              disabled={loading || isPreviewLoading}
            >
              导出 JSON
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <Typography.Paragraph type="secondary">
        选择筛选条件后，可先点击“预览数据”查看将要导出的条目（仅显示ID和问题），确认无误后点击“导出 JSON”。
      </Typography.Paragraph>

      {/* 新增：预览表格 */}
      {/* 移除 previewData.length > 0 的判断，让表格一直显示，通过 loading 和 empty 状态反馈 */}
      <Typography.Title level={5} style={{ marginTop: '20px' }}>
        预览结果 {previewData.length > 0 ? `(${previewData.length} 条)` : ''}
      </Typography.Title>
      <Table
        columns={previewColumns}
        dataSource={previewData} // 直接绑定 previewData
        rowKey="ID"
        loading={isPreviewLoading} // 使用 isPreviewLoading 控制加载状态
        pagination={{ pageSize: 10, hideOnSinglePage: true }} // 优化分页
        scroll={{ y: 300 }}
        size="small"
        // locale={{ emptyText: isPreviewLoading ? '正在加载...' : '暂无数据' }} // 可以自定义空状态提示
      />
    </Spin>
  );
};

export default ExportData;