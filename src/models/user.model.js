import { getDatabase, persistDatabase } from "../config/sqlite.js";

const toUser = (row) =>
  row && ({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
  });

const findOne = (db, sql, parameters) => {
  const statement = db.prepare(sql);
  statement.bind(parameters);
  const row = statement.step() ? statement.getAsObject() : null;
  statement.free();
  return row;
};

export const User = {
  async findByEmail(email) {
    const db = await getDatabase();
    return toUser(findOne(db, "SELECT id, name, email, password_hash, role FROM users WHERE email = ?", [email]));
  },
  async findById(id) {
    const db = await getDatabase();
    return toUser(findOne(db, "SELECT id, name, email, password_hash, role FROM users WHERE id = ?", [id]));
  },
  async create({ name, email, passwordHash, role = "user" }) {
    const db = await getDatabase();
    db.run("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)", [name, email, passwordHash, role, Date.now()]);
    const id = findOne(db, "SELECT last_insert_rowid() AS id", []).id;
    persistDatabase(db);
    return this.findById(id);
  },
};
