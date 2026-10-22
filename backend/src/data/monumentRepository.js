// ACCESO A DATOS: monumentos guardados en el diario. Todas las consultas filtran por usuario.
function toMonument(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    info: JSON.parse(row.info_json),
    createdAt: row.created_at,
  };
}

export function createMonumentRepository(db) {
  const insert = db.prepare('INSERT INTO monuments (user_id, name, location, info_json) VALUES (?, ?, ?, ?)');
  const all = db.prepare('SELECT * FROM monuments WHERE user_id = ? ORDER BY id DESC');
  const remove = db.prepare('DELETE FROM monuments WHERE id = ? AND user_id = ?');

  return {
    add(userId, { name, location, info }) {
      const infoRow = insert.run(userId, name, location ?? null, JSON.stringify(info));
      return Number(infoRow.lastInsertRowid);
    },
    list(userId) {
      return all.all(userId).map(toMonument);
    },
    delete(userId, id) {
      return remove.run(id, userId).changes > 0;
    },
  };
}
