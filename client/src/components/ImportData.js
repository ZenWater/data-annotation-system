import React, { useState } from 'react';
import { Upload, Button, Input, message, Spin, Typography, Form } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Dragger } = Upload;

const API_URL = 'http://localhost:5000/api'; // 确保 API URL 正确

const ImportData = () => {
  const [fileList, setFileList] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm(); // 使用 Form 实例

  const handleImport = async () => {
    // 1. 校验字段
    if (!projectName.trim()) {
      message.error('请输入项目名称');
      return;
    }
    if (!currentUser.trim()) {
      message.error('请输入当前用户名');
      return;
    }
    if (fileList.length === 0) {
      message.error('请选择要上传的 JSON 文件');
      return;
    }

    setLoading(true);
    const file = fileList[0]; // 获取文件对象

    // 2. 读取文件内容
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const jsonData = JSON.parse(content);

        // 3. 校验 JSON 格式 (基础校验)
        if (!Array.isArray(jsonData)) {
          throw new Error('JSON 文件内容必须是一个数组');
        }
        if (jsonData.length === 0) {
          throw new Error('JSON 文件内容不能为空数组');
        }

        // 4. 映射数据结构并添加项目名和用户信息
        const processedData = jsonData.map(item => {
          if (!item.instruction || !item.output) {
            // 可以根据需要添加更严格的校验
            console.warn('跳过缺少 instruction 或 output 的条目:', item);
            return null; // 返回 null 以便稍后过滤掉
          }
          return {
            ProjectName: projectName,
            Question: item.instruction,
            Answer: item.output,
            RoleTip: item.system || '', // 如果 system 不存在则为空字符串
            COT: '', // COT 字段默认为空，或根据需要处理
            Confirm: 2, // 默认为待审核
            LastEdit: currentUser,
          };
        }).filter(item => item !== null); // 过滤掉无效条目

        if (processedData.length === 0) {
           throw new Error('JSON 文件中没有有效的可导入数据条目');
        }

        // 5. 发送数据到后端 (需要后端实现 /api/entries/import 接口)
        await axios.post(`${API_URL}/entries/import`, { entries: processedData });

        // 这里就是导入成功的提示
        message.success(`成功导入 ${processedData.length} 条数据`);
        setFileList([]); // 清空文件列表
        form.resetFields(['projectName', 'currentUser']); // 重置表单字段

      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败: ' + (error.response?.data?.message || error.message || '文件读取或处理错误'));
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      message.error('读取文件失败');
      setLoading(false);
    };

    // 修改这里：直接传递 file 对象给 readAsText
    if (file instanceof Blob) { // 添加检查确保 file 是 Blob 类型
       reader.readAsText(file); // 读取文件内容为文本
    } else if (file && file.originFileObj instanceof Blob) {
       // 如果 file 对象本身不是 Blob，但包含 originFileObj，则使用它
       reader.readAsText(file.originFileObj);
    } else {
       message.error('无法读取文件，文件对象无效');
       setLoading(false);
    }
  };

  // Upload 组件的 props
  const uploadProps = {
    name: 'file',
    multiple: false, // 只允许单文件上传
    accept: '.json', // 只接受 json 文件
    fileList: fileList,
    beforeUpload: (file) => {
      // 在上传前更新文件列表状态，并阻止 Upload 组件的默认上传行为
      setFileList([file]);
      return false; // 返回 false 阻止自动上传
    },
    onRemove: () => {
      setFileList([]); // 移除文件时清空列表
    },
  };

  return (
    <Spin spinning={loading} tip="正在导入...">
      <Title level={4}>导入数据</Title>
      <Form form={form} layout="vertical" onFinish={handleImport} style={{ maxWidth: 600 }}>
        <Form.Item
          name="projectName"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input
            placeholder="为导入的数据指定项目名称"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="currentUser"
          label="当前用户"
          rules={[{ required: true, message: '请输入当前用户名' }]}
        >
          <Input
            placeholder="请输入操作用户的名称"
            value={currentUser}
            onChange={e => setCurrentUser(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="选择 JSON 文件"
          rules={[{ required: true, message: '请选择 JSON 文件' }]} // 虽然 Upload 有自己的处理，这里加规则更明确
        >
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽 JSON 文件到此区域上传</p>
            <p className="ant-upload-hint">
              仅支持单个 JSON 文件上传。文件内容应为包含 instruction, output, system 字段的对象数组。
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit" // 触发 Form 的 onFinish
            icon={<UploadOutlined />}
            disabled={fileList.length === 0 || loading}
          >
            开始导入
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default ImportData;