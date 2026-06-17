import pg from "pg";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { Producto } from "./src/modules/productos/productos.model.js";
import { TurnoCaja } from "./src/modules/turnos/turnos.model.js";

dotenv.config();

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function elegir(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PRODUCTOS = [
  { sku: "ALF-001", nombre_producto: "Alfalfa Premium", peso_bolsa_kg: 25, stock_bolsas_cerradas: 40, stock_kilos_granel: 120, precio_venta_bolsa: 8500, precio_venta_kilo: 380 },
  { sku: "ALF-002", nombre_producto: "Alfalfa Económica", peso_bolsa_kg: 25, stock_bolsas_cerradas: 60, stock_kilos_granel: 200, precio_venta_bolsa: 6200, precio_venta_kilo: 270 },
  { sku: "MAI-001", nombre_producto: "Maíz Partido", peso_bolsa_kg: 30, stock_bolsas_cerradas: 80, stock_kilos_granel: 350, precio_venta_bolsa: 5800, precio_venta_kilo: 210 },
  { sku: "AFR-001", nombre_producto: "Afrechillo de Trigo", peso_bolsa_kg: 30, stock_bolsas_cerradas: 55, stock_kilos_granel: 180, precio_venta_bolsa: 4900, precio_venta_kilo: 180 },
  { sku: "SOJ-001", nombre_producto: "Pellet de Soja", peso_bolsa_kg: 25, stock_bolsas_cerradas: 30, stock_kilos_granel: 90, precio_venta_bolsa: 9200, precio_venta_kilo: 400 },
  { sku: "AVN-001", nombre_producto: "Avena Entera", peso_bolsa_kg: 25, stock_bolsas_cerradas: 45, stock_kilos_granel: 160, precio_venta_bolsa: 6800, precio_venta_kilo: 295 },
  { sku: "CEB-001", nombre_producto: "Cebada Forrajera", peso_bolsa_kg: 30, stock_bolsas_cerradas: 35, stock_kilos_granel: 100, precio_venta_bolsa: 5500, precio_venta_kilo: 200 },
];

const VENDEDORES = [
  { nombre_vendedor: "Carlos Méndez", comision_porcentaje: 5 },
  { nombre_vendedor: "Laura Gómez", comision_porcentaje: 5 },
  { nombre_vendedor: "Rodrigo Sánchez", comision_porcentaje: 4 },
];

const CLIENTES = [
  { nombre_cliente: "Granja Los Aromos", dni_cuit: 27345678901, telefono: "3549876543", direccion: "Camino vecinal s/n", email: "aromos@granja.com" },
  { nombre_cliente: "Juan Pablo Rodríguez", dni_cuit: 20987654321, telefono: "3543334455", direccion: "Av. San Martín 1200", email: null },
  { nombre_cliente: "Tambo La Esperanza", dni_cuit: 30456789012, telefono: "3546667788", direccion: "Ruta 5 km 12", email: "esperanza@tambo.com" },
];

const METODOS_PAGO = ["Efectivo", "Transferencia", "Cuenta Corriente"];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Conectado a MongoDB");

  try {
    await client.query(`
      INSERT INTO clientes (id_cliente, nombre_cliente, dni_cuit, email)
      VALUES ('00000000-0000-0000-0000-000000000000', 'Consumidor Final', 0, 'ventas@anonimo.com')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO vendedores (id_vendedor, nombre_vendedor, activo)
      VALUES ('00000000-0000-0000-0000-000000000000', 'Mostrador', true)
      ON CONFLICT DO NOTHING;
    `);

    const passAdmin = await bcrypt.hash("123456", 10);
    await client.query(`
      INSERT INTO usuarios (id_usuario, email, password, rol, activo)
      VALUES ('601471c6-6dc2-4a23-ba66-1cac98d82ded', 'admin@test.com', $1, 'Administrador', true)
      ON CONFLICT DO NOTHING;
    `, [passAdmin]);

    const passOperario = await bcrypt.hash("123456", 10);
    await client.query(`
      INSERT INTO usuarios (id_usuario, email, password, rol, activo)
      VALUES ('11111111-2222-3333-4444-555555555555', 'operario@forrajeria.com', $1, 'Empleado', true)
      ON CONFLICT DO NOTHING;
    `, [passOperario]);

    console.log("[PG] Sembrando comisionistas...");
    const vendedoresIds = [];
    for (const v of VENDEDORES) {
      const { rows } = await client.query(`
        INSERT INTO vendedores (nombre_vendedor, comision_porcentaje, activo)
        VALUES ($1, $2, true)
        ON CONFLICT DO NOTHING
        RETURNING id_vendedor;
      `, [v.nombre_vendedor, v.comision_porcentaje]);
      if (rows[0]) vendedoresIds.push(rows[0].id_vendedor);
    }

    if (vendedoresIds.length === 0) {
      const { rows } = await client.query(`SELECT id_vendedor FROM vendedores WHERE id_vendedor != '00000000-0000-0000-0000-000000000000'`);
      vendedoresIds.push(...rows.map(r => r.id_vendedor));
    }

    console.log("[PG] Sembrando clientes...");
    const clientesIds = [];
    for (const c of CLIENTES) {
      const { rows } = await client.query(`
        INSERT INTO clientes (nombre_cliente, dni_cuit, telefono, direccion, email)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
        RETURNING id_cliente;
      `, [c.nombre_cliente, c.dni_cuit, c.telefono, c.direccion, c.email]);
      if (rows[0]) clientesIds.push(rows[0].id_cliente);
    }

    if (clientesIds.length === 0) {
      const { rows } = await client.query(`SELECT id_cliente FROM clientes WHERE id_cliente != '00000000-0000-0000-0000-000000000000'`);
      clientesIds.push(...rows.map(r => r.id_cliente));
    }

    console.log("[PG] Sembrando historial de ventas generales transaccionales...");
    const todosVendedoresIds = ["00000000-0000-0000-0000-000000000000", ...vendedoresIds];
    const todosClientesIds = ["00000000-0000-0000-0000-000000000000", ...clientesIds];

    for (let dia = 20; dia >= 0; dia--) {
      const cantVentas = randomEntre(2, 5);
      for (let i = 0; i < cantVentas; i++) {
        const metodo_pago = elegir(METODOS_PAGO);
        const id_vendedor = elegir(todosVendedoresIds);
        const id_cliente = metodo_pago === "Cuenta Corriente" ? elegir(clientesIds) : elegir(todosClientesIds);

        const total = randomEntre(4000, 35000);
        const fecha = diasAtras(dia);

        await client.query(`
          INSERT INTO ventas (id_vendedor, id_cliente, total, metodo_pago, fecha)
          VALUES ($1, $2, $3, $4, $5);
        `, [id_vendedor, id_cliente, total, metodo_pago, fecha]).catch(() => {});
      }
    }

    console.log("[Mongo] Sembrando catálogo de productos con stocks de bolsas y kilos a granel...");
    for (const p of PRODUCTOS) {
      await Producto.updateOne({ sku: p.sku }, { $setOnInsert: p }, { upsert: true });
    }

    console.log("[Mongo] Sembrando histórico de turnos de caja auditados...");
    const turnosData = Array.from({ length: 5 }, (_, i) => {
      const apertura = diasAtras(i + 1);
      apertura.setHours(8, 0, 0, 0);
      const cierre = new Date(apertura);
      cierre.setHours(18, 0, 0, 0);
      return {
        id_usuario: 601471,
        fecha_apertura: apertura,
        fecha_cierre: cierre,
        monto_inicial: 5000,
        monto_final_esperado: 95000,
        monto_final_real: 95000,
        diferencia_caja: 0,
        estado: "cerrado",
        auditoria_detalles: { ventas_del_dia: 90000 },
      };
    });

    await TurnoCaja.insertMany(turnosData);
    console.log("Sembrado híbrido PG + MongoDB completado con éxito absoluto.");

  } catch (error) {
    console.error("Error durante el sembrado:", error.message);
  } finally {
    client.release();
    await pool.end();
    await mongoose.disconnect();
  }
}

main();