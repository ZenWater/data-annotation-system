const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加 JSON 请求体大小限制以支持大文件导入
app.use(express.urlencoded({ limit: '50mb', extended: true })); // 增加 URL 编码请求体大小限制

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || '10.88.92.86',
  port: process.env.DB_PORT || 13306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wuweixiong',
  database: process.env.DB_NAME || 'txt2sql',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试数据库连接
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ message: '数据库连接成功', data: rows });
  } catch (error) {
    res.status(500).json({ message: '数据库连接失败', error: error.message });
  }
});

// 获取所有数据条目
app.get('/api/entries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM DataEntries ORDER BY UpdateTime DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败', error: error.message });
  }
});

// 新增：导出数据集 - 使用新路径避免冲突
app.get('/api/dataset/export', async (req, res) => {
  const { projectName, confirmStatus } = req.query;

  try {
    // 添加日志，帮助调试
    console.log('导出请求参数:', { projectName, confirmStatus });

    // 确保查询语句包含 ID
    let sql = 'SELECT ID, ProjectName, Question, Answer, RoleTip, Confirm FROM DataEntries';
    const params = [];
    const conditions = [];

    if (projectName) {
      // 不使用 TRIM 函数，直接比较
      conditions.push('ProjectName = ?');
      params.push(projectName);
      console.log('项目名称条件:', projectName);
    }
    
    if (confirmStatus === '1') { // 确认状态为 '1' 时
      conditions.push('Confirm = ?');
      params.push(1); // SQL 查询条件的值为数字 1
      console.log('确认状态条件:', confirmStatus);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('执行SQL查询:', sql, '参数:', params);
    
    const [rows] = await pool.query(sql, params);
    console.log('查询结果条数:', rows.length);
    
    // 即使没有数据，也返回空数组而不是错误
    return res.json(rows);
  } catch (error) {
    console.error('导出数据失败:', error);
    return res.status(500).json({ message: '导出数据失败', error: error.message });
  }
});

// 获取单个数据条目 - 确保这个路由在特定路由之后
app.get('/api/entries/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM DataEntries WHERE ID = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '数据条目不存在' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败', error: error.message });
  }
});

// 创建数据条目
app.post('/api/entries', async (req, res) => {
  const { ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit } = req.body;
  
  if (!ProjectName) {
    return res.status(400).json({ message: '项目名称不能为空' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO DataEntries (ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit, UpdateTime) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit]
    );
    
    res.status(201).json({ 
      message: '数据条目创建成功', 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ message: '创建数据失败', error: error.message });
  }
});

// 更新数据条目
app.put('/api/entries/:id', async (req, res) => {
  const { ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit } = req.body;
  
  if (!ProjectName) {
    return res.status(400).json({ message: '项目名称不能为空' });
  }
  
  try {
    const [result] = await pool.query(
      'UPDATE DataEntries SET ProjectName = ?, Question = ?, Answer = ?, RoleTip = ?, COT = ?, Confirm = ?, LastEdit = ?, UpdateTime = NOW() WHERE ID = ?',
      [ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '数据条目不存在' });
    }
    
    res.json({ message: '数据条目更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新数据失败', error: error.message });
  }
});

// 删除数据条目
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM DataEntries WHERE ID = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '数据条目不存在' });
    }
    
    res.json({ message: '数据条目删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除数据失败', error: error.message });
  }
});


// 新增：批量导入数据条目
app.post('/api/entries/import', async (req, res) => {
  const { entries } = req.body; // 前端发送的是 { entries: [...] }

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: '请求体必须包含一个非空的 "entries" 数组' });
  }

  // 基础校验：检查每个条目是否包含必要信息
  const firstEntry = entries[0];
  if (!firstEntry.ProjectName || !firstEntry.LastEdit) {
      return res.status(400).json({ message: '每个条目必须包含 ProjectName 和 LastEdit 信息' });
  }

  let connection;
  try {
    connection = await pool.getConnection(); // 从连接池获取连接
    await connection.beginTransaction(); // 开始事务

    const sql = 'INSERT INTO DataEntries (ProjectName, Question, Answer, RoleTip, COT, Confirm, LastEdit, UpdateTime) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
    let insertedCount = 0;

    for (const entry of entries) {
      // 可以在这里添加更严格的单条数据校验
      if (!entry.ProjectName) {
         console.warn('跳过缺少 ProjectName 的条目:', entry);
         continue; // 跳过项目名为空的条目
      }
      const values = [
        entry.ProjectName,
        entry.Question || '', // 确保字段存在，不存在则为空
        entry.Answer || '',
        entry.RoleTip || '',
        entry.COT || '',
        entry.Confirm !== undefined ? entry.Confirm : 2, // 默认为 2 (待审核)
        entry.LastEdit || '未知用户' // 确保 LastEdit 存在
      ];
      await connection.query(sql, values);
      insertedCount++;
    }

    await connection.commit(); // 提交事务
    res.status(201).json({ message: `成功导入 ${insertedCount} 条数据` });

  } catch (error) {
    if (connection) {
      await connection.rollback(); // 如果出错，回滚事务
    }
    console.error('批量导入失败:', error);
    res.status(500).json({ message: '批量导入数据失败', error: error.message });
  } finally {
    if (connection) {
      connection.release(); // 释放连接回连接池
    }
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`server run on http://0.0.0.0:${PORT}`);
});