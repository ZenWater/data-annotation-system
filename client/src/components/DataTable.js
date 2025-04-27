import React, { useState, useEffect, useMemo } from 'react'; // 导入 useMemo
import {
  Table, Button, Space, Modal, Form, Input,
  Select, Popconfirm, message, Typography, Spin,
  Tooltip, Tag, Drawer
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, SearchOutlined, ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

const API_URL = 'http://localhost:5000/api';

const DataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [form] = Form.useForm();
  const [viewEntry, setViewEntry] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [projectFilter, setProjectFilter] = useState(null);
  const [projectNames, setProjectNames] = useState([]);
  const [currentUser, setCurrentUser] = useState(''); // 新增：存储当前用户名的状态

  // 获取所有数据并提取项目名称
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/entries`);
      setData(response.data);
      // 提取唯一的项目名称用于下拉列表
      const uniqueProjectNames = [...new Set(response.data.map(item => item.ProjectName))].filter(Boolean); // 过滤掉空值
      setProjectNames(uniqueProjectNames.sort()); // 排序项目名称
    } catch (error) {
      message.error('获取数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理表单提交
  const handleSubmit = async () => {
    // 新增：校验当前用户是否填写
    if (!currentUser.trim()) {
      message.error('请在右上角输入当前用户名');
      return; // 阻止提交
    }
    try {
      const values = await form.validateFields();

      // 设置最后编辑者
      values.LastEdit = currentUser; // 使用状态中的用户名
      // 移除强制设置 Confirm = 2 的代码
      // values.Confirm = 2; // 直接设置为 待审核 状态 <-- 移除此行

      if (currentEntry) {
        // 更新现有条目
        // 可选：使用封装的 API
        // await entriesApi.update(currentEntry.ID, values);
        await axios.put(`${API_URL}/entries/${currentEntry.ID}`, values);
        message.success('数据更新成功');
      } else {
        // 创建新条目，新条目默认 Confirm 为 2 (待审核)
        values.Confirm = values.Confirm !== undefined ? values.Confirm : 2; // 如果表单没传Confirm，默认为2
        // 可选：使用封装的 API
        // await entriesApi.create(values);
        await axios.post(`${API_URL}/entries`, values);
        message.success('数据添加成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 删除条目
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
      message.success('数据删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败: ' + error.message);
    }
  };

  // 编辑条目
  const handleEdit = (record) => {
    setCurrentEntry(record);
    form.setFieldsValue({
      ProjectName: record.ProjectName,
      Question: record.Question,
      Answer: record.Answer,
      RoleTip: record.RoleTip,
      COT: record.COT,
      Confirm: record.Confirm // <-- 添加此行，将 Confirm 状态设置到表单
    });
    setModalVisible(true);
  };

  // 查看条目详情
  const handleView = (record) => {
    setViewEntry(record);
    setDrawerVisible(true);
  };

  // 添加新条目
  const handleAdd = () => {
    setCurrentEntry(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 新增：处理确认操作
  const handleConfirm = async (record) => {
    console.log('handleConfirm called with record:', record); // 添加日志：记录传入的记录
    console.log('Current user:', currentUser); // 添加日志：记录当前用户名

    // 新增：校验当前用户是否填写
    if (!currentUser.trim()) {
      message.error('请在右上角输入当前用户名');
      console.log('Confirm cancelled: currentUser is empty.'); // 添加日志
      return; // 阻止确认
    }
    try {
      // 准备更新的数据，只更新 Confirm 和 LastEdit 字段
      const updatedData = {
        ...record, // 包含所有现有字段，以防后端需要它们进行验证或处理
        Confirm: 1, // 设置为已确认状态
        LastEdit: currentUser // 使用状态中的用户名
      };
      console.log('Attempting to update entry with data:', updatedData); // 添加日志：记录将要发送的数据

      // 调用后端 API 更新数据
      // 注意：确保这里的 record.ID 是正确的
      await axios.put(`${API_URL}/entries/${record.ID}`, updatedData);
      console.log('API call successful for ID:', record.ID); // 添加日志：记录API调用成功

      message.success('数据确认成功');
      fetchData(); // 重新获取数据以更新表格
    } catch (error) {
      // 添加更详细的错误日志
      console.error('确认操作失败:', error);
      if (error.response) {
        // 服务器返回了错误状态码
        console.error('服务器响应错误:', error.response.data);
        message.error(`确认失败: ${error.response.data?.message || '服务器错误'}`);
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        console.error('网络错误，未收到响应:', error.request);
        message.error('确认失败: 网络错误，请检查后端服务是否运行');
      } else {
        // 设置请求时发生了一些事情，触发了一个错误
        console.error('请求设置错误:', error.message);
        message.error(`确认失败: ${error.message}`);
      }
      // 不再调用 fetchData()，因为操作失败了
    }
  };


  // 过滤数据 - 使用 useMemo 优化性能
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 项目名称筛选
      if (projectFilter && item.ProjectName !== projectFilter) {
        return false;
      }
      // 文本搜索筛选
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          (item.Question && item.Question.toLowerCase().includes(searchLower)) ||
          (item.Answer && item.Answer.toLowerCase().includes(searchLower))
          // 不再搜索 ProjectName
        );
      }
      return true; // 如果没有筛选条件，则返回 true
    });
  }, [data, searchText, projectFilter]); // 依赖项包括 data, searchText 和 projectFilter


  // 表格列定义 - 调整显示的列
  const columns = [
    {
      title: 'ID',
      dataIndex: 'ID',
      key: 'ID',
      width: 80,
      sorter: (a, b) => a.ID - b.ID,
    },
    {
      title: '问题',
      dataIndex: 'Question',
      key: 'Question',
      // ellipsis: true, // 移除 ellipsis
      render: text => text ? (
        // 直接渲染完整文本，使用 pre-wrap 保留换行和空格
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</div>
      ) : '-',
    },
    {
      title: '答案',
      dataIndex: 'Answer',
      key: 'Answer',
      // ellipsis: true, // 移除 ellipsis
      render: text => text ? (
         // 直接渲染完整文本，使用 pre-wrap 保留换行和空格
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{text}</div>
      ) : '-',
    },
    {
      title: '操作',
      key: 'action',
      // width: 220, // 移除固定宽度，让其自适应
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          />
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          {/* 确认按钮逻辑保持不变，但现在基于隐藏的 Confirm 字段 */}
          {record.Confirm !== 1 && (
             <Popconfirm
               title="确定要确认这条数据吗？"
               onConfirm={() => handleConfirm(record)}
               okText="确定"
               cancelText="取消"
             >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                确认
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除这条数据吗？"
            onConfirm={() => handleDelete(record.ID)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>数据条目管理</Title>
        <Space wrap>
          {/* 添加项目名称筛选下拉列表 */}
          <Select
            placeholder="按项目名称筛选"
            allowClear
            style={{ width: 200 }}
            value={projectFilter}
            onChange={value => setProjectFilter(value)} // 更新筛选状态
          >
            {projectNames.map(name => (
              <Option key={name} value={name}>{name}</Option>
            ))}
          </Select>
          <Input
            placeholder="搜索问题/回答" // 更新 placeholder
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加数据
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
          >
            刷新
          </Button>
          {/* 新增：当前用户输入框 */}
          <Input
            placeholder="当前用户"
            value={currentUser}
            onChange={e => setCurrentUser(e.target.value)}
            style={{ width: 150 }}
          />
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData} // 使用过滤后的数据
          rowKey="ID"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: total => `共 ${total} 条数据`
          }}
          // scroll={{ x: 'max-content' }} // 移除 scroll 属性
        />
      </Spin>

      {/* 添加/编辑表单模态框 */}
      <Modal
        title={currentEntry ? '编辑数据条目' : '添加数据条目'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800} // 可以根据需要调整宽度
        confirmLoading={loading} // 可以添加 loading 状态
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="ProjectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="Question" label="问题">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="Answer" label="答案">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item name="RoleTip" label="角色提示">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="COT" label="COT">
            <TextArea rows={3} />
          </Form.Item>
          {/* 新增 Confirm 状态选择 */}
          <Form.Item
            name="Confirm"
            label="确认状态"
            rules={[{ required: true, message: '请选择确认状态' }]}
            initialValue={2} // 新增时默认为 待审核
          >
            <Select>
              <Option value={1}>已确认</Option>
              <Option value={2}>待审核</Option>
              <Option value={0}>无效</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 查看详情抽屉 */}
      <Drawer
        title="数据条目详情"
        placement="right"
        width={600}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
      >
        {viewEntry && (
          <div>
            <p><strong>ID:</strong> {viewEntry.ID}</p>
            <p><strong>项目名称:</strong> {viewEntry.ProjectName}</p>
            <p><strong>问题:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10, borderRadius: 4, marginBottom: 16 }}>
              {viewEntry.Question || '无'}
            </div>
            
            <p><strong>回答:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10, borderRadius: 4, marginBottom: 16 }}>
              {viewEntry.Answer || '无'}
            </div>
            
            <p><strong>系统提示:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10, borderRadius: 4, marginBottom: 16 }}>
              {viewEntry.RoleTip || '无'}
            </div>
            
            <p><strong>思维链:</strong></p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10, borderRadius: 4, marginBottom: 16 }}>
              {viewEntry.COT || '无'}
            </div>
            
            <p>
              <strong>确认状态:</strong> {' '}
              {viewEntry.Confirm === 1 ? '已确认' : viewEntry.Confirm === 2 ? '待审核' : '未确认'}
            </p>
            
            <p><strong>最后编辑:</strong> {viewEntry.LastEdit || '无'}</p>
            
            <p><strong>更新时间:</strong> {viewEntry.UpdateTime ? moment(viewEntry.UpdateTime).format('YYYY-MM-DD HH:mm:ss') : '无'}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DataTable;