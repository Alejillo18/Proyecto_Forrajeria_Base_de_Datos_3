import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

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

    const emailAdmin = 'admin@test.com';
    const passwordPlana = '123456';
    const passwordHasheada = await bcrypt.hash(passwordPlana, 10);

    await prisma.usuario.upsert({
      where: { email: emailAdmin },
      update: {}, 
      create: {
        id_usuario: randomUUID(), 
        email: emailAdmin,
        password: passwordHasheada,
        rol: 'Administrador',
        activo: true,
      },
    });

    console.log('Sembrado completado con éxito (Consumidor, Vendedor y Admin)');
  } catch (error) {
    console.error('Error durante el sembrado de datos:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();