import { z } from 'zod'

// password_md5 llega en texto plano; el hash MD5() se calcula en la consulta SQL (db.js).
const password = z.string().min(1)

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password_md5: password,
  email: z.string().trim().email()
})

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password_md5: password
})

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  information: z.string().trim().min(1),
  author_id: z.coerce.number().int().positive(),
  author_name: z.string().trim().min(1),
  family: z.string().trim().min(1),
  diet: z.string().trim().min(1),
  funfact: z.string().trim().min(1)
})

export const updatePostSchema = createPostSchema.pick({
  title: true,
  information: true,
  family: true,
  diet: true,
  funfact: true
})

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export function validateBody (schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ status: 'failed', errors: result.error.flatten() })
    }
    req.body = result.data
    next()
  }
}

export function validateParams (schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      return res.status(400).json({ status: 'failed', errors: result.error.flatten() })
    }
    req.params = result.data
    next()
  }
}
