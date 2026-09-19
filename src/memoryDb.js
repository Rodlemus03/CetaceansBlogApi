const norm = (sql) => sql.replace(/\s+/g, ' ').trim().toLowerCase()

export class MemoryDb {
  constructor () {
    this.users = []
    this.posts = []
    this.nextUserId = 1
    this.nextPostId = 1
  }

  async exec () {
    return { rows: [] }
  }

  async query (sql, params = []) {
    const q = norm(sql)

    if (q.startsWith('insert into users')) {
      const [username, passwordHash, email, role] = params
      this.users.push({
        id: this.nextUserId++,
        username,
        password_hash: passwordHash,
        email,
        role: role || 'Usuario'
      })
      return { rows: [], rowCount: 1 }
    }

    if (q.startsWith('select id, username, email, role, password_hash from users')) {
      const [username] = params
      const u = this.users.find(x => x.username === username)
      const rows = u ? [{ id: u.id, username: u.username, email: u.email, role: u.role, password_hash: u.password_hash }] : []
      return { rows, rowCount: rows.length }
    }

    if (q.startsWith('select * from users where id')) {
      const id = Number(params[0])
      const rows = this.users.filter(x => x.id === id)
      return { rows, rowCount: rows.length }
    }

    if (q.startsWith('select * from blog_posts where id')) {
      const id = Number(params[0])
      const rows = this.posts.filter(p => p.id === id)
      return { rows, rowCount: rows.length }
    }

    if (q.startsWith('select * from blog_posts')) {
      return { rows: [...this.posts], rowCount: this.posts.length }
    }

    if (q.startsWith('insert into blog_posts')) {
      const [title, information, author_id, author_name, family, diet, funfact] = params
      const now = new Date()
      this.posts.push({
        id: this.nextPostId++,
        title,
        information,
        author_id: Number(author_id),
        author_name,
        family,
        diet,
        funfact,
        created_at: now,
        updated_at: now
      })
      return { rows: [], rowCount: 1 }
    }

    if (q.startsWith('update blog_posts set')) {
      const [title, information, family, diet, funfact, id] = params
      const post = this.posts.find(p => p.id === Number(id))
      if (post) {
        Object.assign(post, { title, information, family, diet, funfact, updated_at: new Date() })
      }
      return { rows: [], rowCount: post ? 1 : 0 }
    }

    if (q.startsWith('delete from blog_posts where id')) {
      const id = Number(params[0])
      const before = this.posts.length
      this.posts = this.posts.filter(p => p.id !== id)
      return { rows: [], rowCount: before - this.posts.length }
    }

    if (q === 'select 1') {
      return { rows: [{ '?column?': 1 }], rowCount: 1 }
    }

    throw new Error(`MemoryDb: consulta no soportada -> ${sql}`)
  }
}
