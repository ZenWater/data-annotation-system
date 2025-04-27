import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Spin } from 'antd';
import axios from 'axios'; // 如果需要调用API，则引入axios

const { Title } = Typography;
const API_URL = 'http://localhost:5000/api'; // 假设后端有对应接口

const ModelFineTuning = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    console.log('提交的数据:', values);
    // 在这里添加调用后端API进行模型微调的逻辑
    try {
      // 示例：假设有一个 /api/fine-tune 接口
      // const response = await axios.post(`${API_URL}/fine-tune`, values);
      // message.success('模型微调任务已提交: ' + response.data.message);

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟网络延迟
      message.success('模型微调任务已提交（模拟）');
      // 可以在这里处理成功后的逻辑，例如清空表单
      // form.resetFields();

    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交模型微调失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading} tip="正在提交...">
      <Title level={4}>模型微调</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }} // 限制表单最大宽度
      >
        <Form.Item
          name="trainingSystemUrl"
          label="模型训练系统对接地址"
          rules={[{ required: true, message: '请输入对接地址' }, { type: 'url', message: '请输入有效的URL' }]}
        >
          <Input placeholder="例如：http://train-system.example.com/api/v1/fine-tune" />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="认证 Key"
          rules={[{ required: true, message: '请输入认证 Key' }]}
        >
          <Input.Password placeholder="请输入您的认证 Key" /> {/* 使用密码输入框隐藏Key */}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            提交模型微调
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default ModelFineTuning;