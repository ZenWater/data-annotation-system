import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误
      console.error('API错误:', error.response.data);
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误:', error.request);
    } else {
      // 请求设置时出错
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 数据条目API
export const entriesApi = {
  // 获取所有数据条目
  getAll: () => api.get('/entries'),
  
  // 获取单个数据条目
  getById: (id) => api.get(`/entries/${id}`),
  
  // 创建数据条目
  create: (data) => api.post('/entries', data),
  
  // 更新数据条目
  update: (id, data) => api.put(`/entries/${id}`, data),
  
  // 删除数据条目
  delete: (id) => api.delete(`/entries/${id}`),
};

export default api;