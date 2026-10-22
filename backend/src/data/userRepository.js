// ACCESO A DATOS: usuarios (solo SQL).
export function createUserRepository(db) {
  const insert = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  const byEmail = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
  const byId = db.prepare('SELECT id, name, email FROM users WHERE id = ?');

  return {
    create({ name, email, passwordHash }) {
      const info = insert.run(name, email, passwordHash);
      return { id: Number(info.lastInsertRowid), name, email };
    },
    findByEmail(email) {
      return byEmail.get(email) ?? null;
    },
    findById(id) {
      return byId.get(id) ?? null;
    },
  };
}
