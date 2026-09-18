import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

import {
  registerUser,
  loginUser,
  createPost,
  getPosts,
  getPostByID,
  getUserById,
  deletePost,
  updatePost
} from './db.js'

import authenticateToken from './middleware.js'

// isLocal indica si corremos con BD efimera (--local); initDb la prepara.
import { isLocal, initDb } from './conn.js'

const app = express()
app.use(express.json())

app.use(bodyParser.json())
app.use(cookieParser())

const allowedOrigins = [
  'http://127.0.0.1:5173',
  'https://my-blog-one-beige-60.vercel.app'
]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

// Puerto 3000 en modo local (para los tests del lab), 5000 en modo normal.
const port = isLocal ? 3000 : 5000

app.get('/', async (req, res) => {
  res.send('Hello world from API!')
})

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body

  try {
    await registerUser(username, password, email)
    res.status(200).json({ status: 'success', message: 'User registered succesully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await loginUser(username, password)
    if (user) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '24h'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400000
      })
      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        username: user.username,
        role: user.role,
        id: user.id
      })
    } else {
      res.status(401).json({ status: 'failed', message: 'Invalid username or password.' })
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  res.status(200).json({ status: 'success', message: 'User logged out successfully' })
})

app.get('/me', authenticateToken, async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  })
})

app.get('/user/:id', async (req, res) => {
  const id = req.params.id
  try {
    const user = await getUserById(id)
    res.status(200).json({ status: 'success', data: user })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.get('/posts', async (req, res) => {
  try {
    const posts = await getPosts()
    if (posts !== 'No posts found.') {
      res
        .status(200)
        .json({ status: 'success', message: 'Posts retrieved successfully.', data: posts })
    } else {
      res.status(404).json({ status: 'failed', message: 'No posts found.' })
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.get('/post/:id', async (req, res) => {
  const id = req.params.id
  try {
    const post = await getPostByID(id)
    res.status(200).json({ status: 'success', data: post })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.post('/post', authenticateToken, async (req, res) => {
  const { title, information, author_id, author_name, family, diet, funfact } = req.body

  try {
    await createPost(title, information, author_id, author_name, family, diet, funfact)
    res.status(201).json({ status: 'success', message: 'Post created successfully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.put('/post/:id', authenticateToken, async (req, res) => {
  const id = req.params.id
  const { title, information, family, diet, funfact } = req.body
  try {
    await updatePost(id, title, information, family, diet, funfact)
    res.status(200).json({ status: 'success', message: 'Post updated successfully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})
app.delete('/post/:id', async (req, res) => {
  const id = req.params.id
  try {
    const result = await deletePost(id)
    res.status(200).json({ status: 'success', message: result })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

// --- Arranque -------------------------------------------------------------
// En Vercel (serverless) se exporta el app como handler y la plataforma lo
// invoca: alli NO se debe llamar app.listen(). Como servidor tradicional
// (tu maquina, local o normal) si se llama listen.

export default app

if (!process.env.VERCEL) {
  ;(async () => {
    try {
      await initDb() // en local siembra la BD en memoria; en normal verifica conexion
    } catch (err) {
      console.error('Fallo al iniciar la base de datos:', err)
      process.exit(1)
    }

    app.listen(port, () => {
      const modo = isLocal ? 'LOCAL (BD efimera en memoria)' : 'NORMAL (BD real)'
      console.log(`Server listening at http://127.0.0.1:${port} [${modo}]`)
    })
  })()
}
