import { ProveedoresDAO } from './proveedores.dao.js';
import { redisClient } from '../../../config/db.redis.js';

async function clearProveedoresCache() {
  try {
    const keys = await redisClient.keys('proveedores:*');
    if (keys.length > 0) await redisClient.del(keys);
  } catch (error) {
    console.error('Error al limpiar caché de proveedores:', error.message);
  }
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
    } catch (err) {
      console.error('Redis Error (Fallback activado):', err.message);
    }


    const dbRows = await ProveedoresDAO.selectAll({ limit, offset });
    
    const responseData = {
      pag: page,
      limite: limit,
      datos: dbRows,
      origen: 'PostgreSQL'
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 120 });
    } catch (err) {
      console.error('Error al guardar en Redis:', err.message);
    }

    return responseData;
  },

  async getById(id) {
    return await ProveedoresDAO.selectById(id);
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

