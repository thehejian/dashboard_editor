import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import cmdbRouter from './routes/cmdb.js'

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

// Share pool with route modules
app.locals.pool = pool

// ==================== CMDB API Routes ====================

app.use('/api/cmdb', cmdbRouter)

// Run CMDB migration on startup
async function runMigrations() {
  try {
    const migrationResult = await pool.query(`
      SELECT to_regclass('public.ci_types') IS NOT NULL as exists
    `)
    if (!migrationResult.rows[0].exists) {
      console.log('📦 运行 CMDB 迁移...')
      const migrationSql = readFileSync(new URL('./db/001_cmdb_schema.sql', import.meta.url), 'utf-8')
      await pool.query(migrationSql)
      console.log('✅ CMDB 表结构创建成功')
    } else {
      console.log('✅ CMDB 表结构已存在')
    }
  } catch (err) {
    console.error('❌ CMDB 迁移失败:', err)
  }
}
runMigrations()

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
    // Check if CMDB data already exists
    const ciCheck = await pool.query('SELECT COUNT(*) as count FROM ci_types')
    if (parseInt(ciCheck.rows[0].count) > 0) {
      return res.json({ success: true, message: 'CMDB 数据已存在，跳过 seed' })
    }

    // Seed CMDB data
    const seedSql = readFileSync(new URL('./db/002_seed_data.sql', import.meta.url), 'utf-8')
    await pool.query(seedSql)
    console.log('✅ CMDB seed 完成')

    res.json({ success: true, message: 'CMDB 数据初始化完成' })
  } catch (err) {
    console.error('Seed 错误:', err)
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