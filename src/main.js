import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import helmet from "helmet"

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

import {
  validateBody,
  validateParams,
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  idParamSchema
} from './validators.js'

// isLocal indica si corremos con BD efimera (--local); initDb la prepara.
import { isLocal, initDb } from './conn.js'

const app = express()
app.use(express.json())

app.use(bodyParser.json())

app.use(cors())

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  },
}));


// Puerto 3000 en modo local (para los tests del lab), 5000 en modo normal.
const port = isLocal ? 3000 : 5000

app.get('/', async (req, res) => {
  res.send('Hello world from API!')
})

app.post('/register', validateBody(registerSchema), async (req, res) => {
  const { username, password_md5, email } = req.body

  try {
    await registerUser(username, password_md5, email)
    res.status(200).json({ status: 'success', message: 'User registered succesully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.post('/login', validateBody(loginSchema), async (req, res) => {
  const { username, password_md5 } = req.body

  try {
    const user = await loginUser(username, password_md5)
    if (user) {
      const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '24h'
      })
      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        username: user.username,
        token,
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

app.get('/user/:id', validateParams(idParamSchema), async (req, res) => {
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

app.get('/post/:id', validateParams(idParamSchema), async (req, res) => {
  const id = req.params.id
  try {
    const post = await getPostByID(id)
    res.status(200).json({ status: 'success', data: post })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.post('/post', authenticateToken, validateBody(createPostSchema), async (req, res) => {
  const { title, information, author_id, author_name, family, diet, funfact } = req.body

  try {
    await createPost(title, information, author_id, author_name, family, diet, funfact)
    res.status(201).json({ status: 'success', message: 'Post created successfully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})

app.put('/post/:id', authenticateToken, validateParams(idParamSchema), validateBody(updatePostSchema), async (req, res) => {
  const id = req.params.id
  const { title, information, family, diet, funfact } = req.body
  try {
    await updatePost(id, title, information, family, diet, funfact)
    res.status(200).json({ status: 'success', message: 'Post updated successfully.' })
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message })
  }
})
app.delete('/post/:id', validateParams(idParamSchema), async (req, res) => {
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
