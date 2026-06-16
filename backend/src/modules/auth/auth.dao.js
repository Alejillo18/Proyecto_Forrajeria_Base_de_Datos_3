import { pool } from '../../../config/db.pg.js';

export const AuthDAO = {
  async selectByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },
};
