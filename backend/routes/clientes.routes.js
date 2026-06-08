import { Router } from 'express';
import { pool } from '../config/config.js';
import { redisClient } from '../config/config.redis.js';

const ClientesRouter = Router();

async function clearClientesCache() {
  try {
    const keys = await redisClient.keys('clientes:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error al limpiar caché de clientes:', error.message);
  }
}

ClientesRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const cacheKey = `clientes:page:${page}:limit:${limit}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const data = JSON.parse(cachedData);
      data.origen = 'Redis';
      return res.json(data);
    }
  } catch (redisError) {
    console.error('Redis Error (Fallback activado):', redisError.message);
  }

  try {
    const sql = `
      SELECT id_cliente, nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia, fecha_creacion
      FROM clientes 
      WHERE activo = true 
      ORDER BY fecha_creacion DESC, id_cliente DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(sql, [limit, offset]);
    
    const responseData = {
      pag: page,
      limite: limit,
      datos: result.rows,
      origen: 'PostgreSQL'
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 120 });
    } catch (redisSetError) {
      console.error('Error al guardar en Redis:', redisSetError.message);
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ClientesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = 'SELECT * FROM clientes WHERE id_cliente = $1 AND activo = true';
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o inactivo' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ClientesRouter.post('/', async (req, res) => {
  const { nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia } = req.body;
  try {
    const sql = `
      INSERT INTO clientes (nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const params = [
      nombre_cliente, 
      dni_cuit, 
      telefono || null, 
      direccion || null, 
      email || null, 
      id_membresia || null
    ];
    
    const result = await pool.query(sql, params);
    
    await clearClientesCache();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ClientesRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_cliente, dni_cuit, telefono, direccion, email, id_membresia } = req.body;
  try {
    const sql = `
      UPDATE clientes 
      SET nombre_cliente = $1, dni_cuit = $2, telefono = $3, direccion = $4, email = $5, id_membresia = $6
      WHERE id_cliente = $7 AND activo = true
      RETURNING *;
    `;
    const params = [
      nombre_cliente, 
      dni_cuit, 
      telefono || null, 
      direccion || null, 
      email || null, 
      id_membresia || null, 
      id
    ];
    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado o inactivo para actualizar' });
    }

    await clearClientesCache();

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ClientesRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      UPDATE clientes 
      SET activo = false 
      WHERE id_cliente = $1 AND activo = true
      RETURNING id_cliente, nombre_cliente, activo;
    `;
    
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'El cliente ya estaba eliminado o no existe' });
    }

    await clearClientesCache();

    res.json({ 
      message: 'Cliente eliminado lógicamente con éxito', 
      cliente: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default ClientesRouter;