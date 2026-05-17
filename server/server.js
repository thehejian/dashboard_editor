import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '192.168.0.155',
  port: process.env.DB_PORT || 2345,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '745544752',
  database: process.env.DB_NAME || 'mydb'
})

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ 数据库连接成功'))
  .catch(err => console.error('❌ 数据库连接失败:', err))

// ==================== API Routes ====================

// 1. 代码片段搜索
app.post('/api/code-search', async (req, res) => {
  try {
    const { query, limit = 5, threshold = 0.5 } = req.body

    if (!query) {
      return res.status(400).json({ error: '缺少查询内容' })
    }

    // 检查是否有数据
    const countResult = await pool.query('SELECT COUNT(*) as count FROM code_snippets')
    if (parseInt(countResult.rows[0].count) === 0) {
      return res.json({
        success: true,
        data: [],
        message: '暂无数据，请先添加代码片段',
        count: 0
      })
    }

    const embedding = await getEmbedding(query)

    const result = await pool.query(`
      SELECT id, title, description, code_content, language, metadata,
             1 - (embedding <=> $1::vector) as similarity
      FROM code_snippets
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, [embedding, threshold, limit])

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (err) {
    console.error('代码搜索错误:', err)
    res.status(500).json({ error: '搜索失败' })
  }
})

// 添加测试数据
app.post('/api/seed-data', async (req, res) => {
  try {
    // 插入代码片段 (使用 random_vector() 生成向量)
    await pool.query(`
      INSERT INTO code_snippets (title, description, code_content, language, embedding) VALUES
      ('登录表单组件', 'Vue3 登录表单组件', '<template><a-form><a-input/></a-form>', 'vue', random_vector(1536)),
      ('表格组件', 'Ant Design Table', '<a-table :columns="cols" :data-source="data" />', 'vue', random_vector(1536)),
      ('图表组件', 'G2 折线图', '<Line :data="data" />', 'vue', random_vector(1536)),
      ('弹窗组件', 'Modal 对话框', '<a-modal title="标题">内容</a-modal>', 'vue', random_vector(1536)),
      ('下拉组件', 'Select 选择', '<a-select><a-select-option/></a-select>', 'vue', random_vector(1536))
    `)

    // 插入模板
    await pool.query(`
      INSERT INTO code_templates (name, trigger_keyword, template_content, category, usage_count, embedding) VALUES
      ('输入框', 'a-input', '<a-input v-model:value="v" />', '表单', 100, random_vector(1536)),
      ('按钮', 'a-button', '<a-button>确定</a-button>', '按钮', 90, random_vector(1536)),
      ('表格', 'a-table', '<a-table :data-source="d" />', '数据', 80, random_vector(1536)),
      ('弹窗', 'a-modal', '<a-modal>内容</a-modal>', '反馈', 70, random_vector(1536))
    `)

    // 插入文档
    await pool.query(`
      INSERT INTO docs (title, content, chunk_text, doc_type, embedding) VALUES
      ('运维手册-创建图表', '如何创建新图表', '打开仪表盘，点击"添加图表"按钮，选择类型并配置数据源。', '运维手册', random_vector(1536)),
      ('运维手册-数据源', '如何配置数据源', '在监控配置页面添加 Prometheus/InfluxDB 数据源。', '运维手册', random_vector(1536)),
      ('API-指标', '获取监控指标', '调用 /api/v1/metrics 获取监控数据，需传时间和指标参数。', 'API文档', random_vector(1536)),
      ('API-告警', '查询告警', '调用 /api/v1/alarms 查询告警，支持按级别、状态筛选。', 'API文档', random_vector(1536))
    `)

    res.json({
      success: true,
      message: '测试数据已添加 (使用 pgvector random_vector)'
    })
  } catch (err) {
    console.error('添加测试数据错误:', err)
    res.status(500).json({ error: err.message })
  }
})

// 2. 代码模板推荐
app.post('/api/code-recommend', async (req, res) => {
  try {
    const { input, limit = 3 } = req.body

    if (!input) {
      return res.status(400).json({ error: '缺少输入内容' })
    }

    const embedding = await getEmbedding(input)

    const result = await pool.query(`
      SELECT id, name, trigger_keyword, template_content, category, usage_count,
             1 - (embedding <=> $1::vector) as similarity
      FROM code_templates
      ORDER BY embedding <=> $1::vector, usage_count DESC
      LIMIT $2
    `, [embedding, limit])

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    })
  } catch (err) {
    console.error('模板推荐错误:', err)
    res.status(500).json({ error: '推荐失败' })
  }
})

// 3. 文档问答 (RAG)
app.post('/api/doc-qa', async (req, res) => {
  try {
    const { question, limit = 3 } = req.body

    if (!question) {
      return res.status(400).json({ error: '缺少问题' })
    }

    const questionEmbedding = await getEmbedding(question)

    // 检索相关文档
    const docs = await pool.query(`
      SELECT id, title, chunk_text, chunk_index,
             1 - (embedding <=> $1::vector) as similarity
      FROM docs
      WHERE 1 - (embedding <=> $1::vector) > 0.7
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, [questionEmbedding, limit])

    // 如果有 OpenAI API，可以调用 LLM 生成回答
    // 这里先返回检索到的文档
    res.json({
      success: true,
      question,
      context: docs.rows.map(d => ({
        title: d.title,
        chunk_text: d.chunk_text,
        similarity: d.similarity
      })),
      // 如果有 LLM 回答
      // answer: await generateAnswer(question, docs.rows)
      count: docs.rows.length
    })
  } catch (err) {
    console.error('文档问答错误:', err)
    res.status(500).json({ error: '问答失败' })
  }
})

// ==================== Helper Functions ====================

// 获取 Embedding 向量
async function getEmbedding(text) {
  // 这里应该调用 OpenAI Embedding API
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  // const response = await openai.embeddings.create({
  //   model: 'text-embedding-3-small',
  //   input: text
  // })
  // return response.data[0].embedding

  // 暂时返回模拟向量 (1536 维)
  const dim = 1536
  const vector = new Array(dim).fill(0).map(() => (Math.random() * 2 - 1) * 0.1)
  return vector
}

// ==================== Start Server ====================

app.listen(PORT, () => {
  console.log(`🚀 服务启动: http://localhost:${PORT}`)
})