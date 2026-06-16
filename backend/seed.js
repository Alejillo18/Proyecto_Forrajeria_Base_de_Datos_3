import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('Sembrando datos iniciales en la base de datos...');

    // Cliente anónimo
    await client.query(`
      INSERT INTO clientes (id_cliente, nombre_cliente, dni_cuit, email)
      VALUES ('00000000-0000-0000-0000-000000000000', 'Consumidor Final', 0, 'ventas@anonimo.com')
      ON CONFLICT (id_cliente) DO NOTHING
    `);

    // Vendedor mostrador
    await client.query(`
      INSERT INTO vendedores (id_vendedor, nombre_vendedor, activo)
      VALUES ('00000000-0000-0000-0000-000000000000', 'mostrador', true)
      ON CONFLICT (id_vendedor) DO NOTHING
    `);

    // Admin
    const hashedPasswordAdmin = await bcrypt.hash('123456', 10);
    await client.query(`
      INSERT INTO usuarios (id_usuario, email, password, rol, activo)
      VALUES ('601471c6-6dc2-4a23-ba66-1cac98d82ded', 'admin@test.com', $1, 'Administrador', true)
      ON CONFLICT (email) DO NOTHING
    `, [hashedPasswordAdmin]);

    // Operario
    const hashedPasswordOperario = await bcrypt.hash('123456', 10);
    await client.query(`
      INSERT INTO usuarios (id_usuario, email, password, rol, activo)
      VALUES ('11111111-2222-3333-4444-555555555555', 'operario@forrajeria.com', $1, 'Empleado', true)
      ON CONFLICT (email) DO NOTHING
    `, [hashedPasswordOperario]);

    console.log('Sembrado completado con éxito');
  } catch (error) {
    console.error('Error durante el sembrado de datos', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();