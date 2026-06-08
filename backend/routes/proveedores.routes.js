import { Router } from 'express';
import { pool } from '../config/config.js';
import { redisClient } from '../config/config.redis.js';

const ProveedoresRouter = Router();

async function clearProveedoresCache() {
  try {
    const keys = await redisClient.keys('proveedores:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error al limpiar caché de proveedores:', error.message);
  }
}

ProveedoresRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const cacheKey = `proveedores:page:${page}:limit:${limit}`;

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
      SELECT id_proveedor, cuit, nombre_empresa, contacto_nombre, telefono 
      FROM proveedores 
      WHERE activo = true 
      ORDER BY id_proveedor DESC 
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

ProveedoresRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = 'SELECT * FROM proveedores WHERE id_proveedor = $1 AND activo = true';
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado o inactivo' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ProveedoresRouter.post('/', async (req, res) => {
  const { cuit, nombre_empresa, contacto_nombre, telefono } = req.body;
  try {
    const sql = `
      INSERT INTO proveedores (cuit, nombre_empresa, contacto_nombre, telefono)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [cuit, nombre_empresa, contacto_nombre || null, telefono || null];
    const result = await pool.query(sql, params);
    
    await clearProveedoresCache();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ProveedoresRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { cuit, nombre_empresa, contacto_nombre, telefono } = req.body;
  try {
    const sql = `
      UPDATE proveedores 
      SET cuit = $1, nombre_empresa = $2, contacto_nombre = $3, telefono = $4
      WHERE id_proveedor = $5 AND activo = true
      RETURNING *;
    `;
    const params = [cuit, nombre_empresa, contacto_nombre, telefono, id];
    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado o inactivo para actualizar' });
    }

    await clearProveedoresCache();

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ProveedoresRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      UPDATE proveedores 
      SET activo = false 
      WHERE id_proveedor = $1 AND activo = true
      RETURNING id_proveedor, nombre_empresa, activo;
    `;
    
    const result = await pool.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'El proveedor ya estaba eliminado o no existe' });
    }

    await clearProveedoresCache();

    res.json({ 
      message: 'Proveedor eliminado lógicamente con éxito', 
      proveedor: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default ProveedoresRouter;