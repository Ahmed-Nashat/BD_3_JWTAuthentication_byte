import { getDatabase, persistDatabase } from "../config/sqlite.js";

const findOne = (db, sql, parameters) => {
  const statement = db.prepare(sql);
  statement.bind(parameters);
  const row = statement.step() ? statement.getAsObject() : null;
  statement.free();
  return row;
};

const toTokenUsage = (row) =>
  row && ({
    jti: row.jti,
    userId: row.user_id,
    remainingUses: row.remaining_uses,
    revokedAt: row.revoked_at,
    expiresAt: row.expires_at,
  });

export const TokenUsage = {
  async create({ jti, userId, remainingUses, expiresAt }) {
    const db = await getDatabase();
    db.run("INSERT INTO token_usage (jti, user_id, remaining_uses, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [jti, userId, remainingUses, expiresAt, Date.now()]);
    persistDatabase(db);
  },
  async findByToken(jti, userId) {
    const db = await getDatabase();
    return toTokenUsage(findOne(db, "SELECT jti, user_id, remaining_uses, revoked_at, expires_at FROM token_usage WHERE jti = ? AND user_id = ?", [jti, userId]));
  },
  async consume(jti, userId) {
    const db = await getDatabase();
    const now = Date.now();
    db.run(`UPDATE token_usage
      SET remaining_uses = remaining_uses - 1,
          revoked_at = CASE WHEN remaining_uses = 1 THEN ? ELSE revoked_at END
      WHERE jti = ? AND user_id = ? AND revoked_at IS NULL
        AND remaining_uses > 0 AND expires_at > ?`, [now, jti, userId, now]);
    const changed = findOne(db, "SELECT changes() AS changed", []).changed;
    if (changed !== 1) return null;
    persistDatabase(db);
    return this.findByToken(jti, userId);
  },
};
