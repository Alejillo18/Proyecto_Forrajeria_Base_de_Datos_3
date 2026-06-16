import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Sembrando datos iniciales en la base de datos...');

    await prisma.cliente.upsert({
      where: { id_cliente: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: {
        id_cliente: '00000000-0000-0000-0000-000000000000',
        nombre_cliente: 'Consumidor Final',
        dni_cuit: 0,
        email: 'ventas@anonimo.com',
      },
    });

    await prisma.vendedor.upsert({
      where: { id_vendedor: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: {
        id_vendedor: '00000000-0000-0000-0000-000000000000',
        nombre_vendedor: 'mostrador',
        activo: true,
      },
    });

    const hashedPasswordAdmin = await bcrypt.hash('123456', 10);
    await prisma.usuario.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        id_usuario: '601471c6-6dc2-4a23-ba66-1cac98d82ded',
        email: 'admin@test.com',
        password: hashedPasswordAdmin,
        rol: 'Administrador',
        activo: true,
      },
    });

    const hashedPasswordOperario = await bcrypt.hash('123456', 10);
    await prisma.usuario.upsert({
      where: { email: 'operario@forrajería.com' },
      update: {},
      create: {
        id_usuario: '11111111-2222-3333-4444-555555555555',
        email: 'operario@forrajería.com',
        password: hashedPasswordOperario,
        rol: 'Empleado',
        activo: true,
      },
    });

    console.log('Sembrado completado con éxito');
  } catch (error) {
    console.error('Error durante el sembrado de datos', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();