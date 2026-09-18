import bcrypt from 'bcryptjs'

const users = [
  ['sapo', '1234#', 'sapo@gmail.com', 'Administrador'],
  ['test', 'test', 'test@gmail.com', 'Usuario']
]

const posts = [
  ['Ballena azul', 'El animal mas grande que ha existido, llega a 30 metros.', 1, 'sapo', 'Balaenopteridae', 'Filtrador', 'Su corazon pesa cerca de 180 kg.'],
  ['Orca', 'Es el delfin mas grande y un depredador tope del oceano.', 1, 'sapo', 'Delphinidae', 'Carnivoro', 'Cazan en grupo con estrategias que se ensenan entre generaciones.'],
  ['Delfin nariz de botella', 'Muy sociable e inteligente, comun en aguas templadas.', 2, 'test', 'Delphinidae', 'Carnivoro', 'Se reconoce a si mismo en un espejo.'],
  ['Cachalote', 'El depredador con dientes mas grande del planeta.', 1, 'sapo', 'Physeteridae', 'Carnivoro', 'Tiene el cerebro mas grande del reino animal.'],
  ['Beluga', 'Ballena blanca del Artico, muy vocal.', 2, 'test', 'Monodontidae', 'Carnivoro', 'La llaman el canario del mar por sus sonidos.'],
  ['Narval', 'Cetaceo del Artico con un colmillo largo en espiral.', 1, 'sapo', 'Monodontidae', 'Carnivoro', 'Su colmillo es en realidad un diente sensorial.'],
  ['Marsopa comun', 'Uno de los cetaceos mas pequenos, timido y costero.', 2, 'test', 'Phocoenidae', 'Carnivoro', 'Prefiere aguas frias y poco profundas.'],
  ['Ballena jorobada', 'Famosa por sus saltos y sus cantos complejos.', 1, 'sapo', 'Balaenopteridae', 'Filtrador', 'Los machos cantan melodias que duran horas.'],
  ['Ballena gris', 'Realiza una de las migraciones mas largas entre los mamiferos.', 2, 'test', 'Eschrichtiidae', 'Filtrador', 'Migra hasta 20000 km ida y vuelta cada ano.'],
  ['Vaquita marina', 'El cetaceo mas amenazado, endemico del Golfo de California.', 1, 'sapo', 'Phocoenidae', 'Carnivoro', 'Quedan muy pocos ejemplares en estado salvaje.']
]

export async function seedLocalDb (db) {
  await db.exec()

  for (const u of users) {
    const [username, password, email, role] = u
    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 12)
    await db.query(
      'INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)',
      [username, passwordHash, email, role]
    )
  }

  for (const p of posts) {
    await db.query(
      'INSERT INTO blog_posts (title, information, author_id, author_name, family, diet, funfact) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      p
    )
  }

  console.log(`BD local en memoria lista: ${users.length} usuarios, ${posts.length} posts`)
}
