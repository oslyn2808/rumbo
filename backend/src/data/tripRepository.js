// ACCESO A DATOS: viajes guardados. Todas las consultas filtran por usuario.
function toTrip(row) {
  return {
    id: row.id,
    destination: row.destination,
    days: row.days,
    preferences: row.preferences,
    plan: JSON.parse(row.plan_json),
    createdAt: row.created_at,
  };
}

export function createTripRepository(db) {
  const insert = db.prepare(
    'INSERT INTO trips (user_id, destination, days, preferences, plan_json) VALUES (?, ?, ?, ?, ?)'
  );
  const one = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?');
  const all = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY id DESC');
  const remove = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?');

  return {
    add(userId, { destination, days, preferences, plan }) {
      const info = insert.run(userId, destination, days, preferences, JSON.stringify(plan));
      return Number(info.lastInsertRowid);
    },
    get(userId, id) {
      const row = one.get(id, userId);
      return row ? toTrip(row) : null;
    },
    list(userId) {
      return all.all(userId).map(toTrip);
    },
    delete(userId, id) {
      return remove.run(id, userId).changes > 0;
    },
  };
}
