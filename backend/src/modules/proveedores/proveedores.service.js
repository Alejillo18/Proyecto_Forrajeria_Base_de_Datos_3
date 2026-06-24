import { ProveedoresDAO } from './proveedores.dao.js';
import { redisClient } from '../../../config/db.redis.js';

async function clearProveedoresCache() {
  try {
    const keys = await redisClient.keys('proveedores:*');
    if (keys.length > 0) await redisClient.del(keys);
  } catch (error) {}
}

export const ProveedoresService = {
  async getAll({ page, limit }) {
    const offset = (page - 1) * limit;
    const cacheKey = `proveedores:page:${page}:limit:${limit}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        data.origen = 'Redis';
        return data;
      }
    } catch (err) {}

    const dbRows = await ProveedoresDAO.selectAll({ limit, offset });
    
    const responseData = {
      pag: page,
      limite: limit,
      datos: dbRows,
      origen: 'PostgreSQL'
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 120 });
    } catch (err) {}

    return responseData;
  },

  async getById(id) {
    const cacheKey = `proveedores:id:${id}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (err) {}

    const proveedor = await ProveedoresDAO.selectById(id);

    if (proveedor) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(proveedor), { EX: 3600 });
      } catch (err) {}
    }

    return proveedor;
  },

  async create(data) {
    const nuevoProveedor = await ProveedoresDAO.insert(data);
    await clearProveedoresCache();
    return nuevoProveedor;
  },

  async update(id, data) {
    const proveedorActualizado = await ProveedoresDAO.update(id, data);
    if (proveedorActualizado) await clearProveedoresCache();
    return proveedorActualizado;
  },

  async delete(id) {
    const proveedorEliminado = await ProveedoresDAO.deleteSoft(id);
    if (proveedorEliminado) await clearProveedoresCache();
    return proveedorEliminado;
  }
};