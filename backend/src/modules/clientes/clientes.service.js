import { ClientesDAO } from './clientes.dao.js';
import { redisClient } from '../../../config/db.redis.js';

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

export const ClientesService = {
  async getAll({ page, limit }) {
    const offset = (page - 1) * limit;
    const cacheKey = `clientes:page:${page}:limit:${limit}`;
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
    const dbRows = await ClientesDAO.selectAll({ limit, offset }); 
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
    return await ClientesDAO.selectById(id);
  },

  async create(data) {
    const nuevoCliente = await ClientesDAO.insert(data);
    await clearClientesCache();
    return nuevoCliente;
  },

  async update(id, data) {
    const clienteActualizado = await ClientesDAO.update(id, data);
    if (clienteActualizado) {
      await clearClientesCache();
    }
    return clienteActualizado;
  },

  async delete(id) {
    const clienteEliminado = await ClientesDAO.deleteSoft(id);
    if (clienteEliminado) {
      await clearClientesCache();
    }
    return clienteEliminado;
  },

  // --- Caso de Uso: Control de Cuenta Corriente (HU-13) ---
  async obtenerDetalleCuentaCorriente(id_cliente) {
    const cliente = await ClientesDAO.selectById(id_cliente);
    if (!cliente) {
      const error = new Error('Cliente no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const [saldo_deudor, historial] = await Promise.all([
      ClientesDAO.obtenerSaldoDeudor(id_cliente),
      ClientesDAO.selectHistorialCuentaCorriente(id_cliente)
    ]);

    return {
      id_cliente: cliente.id_cliente,
      nombre_cliente: cliente.nombre_cliente,
      dni_cuit: cliente.dni_cuit.toString(), // Mapeo preventivo para BigInt
      saldo_deudor,
      historial
    };
  }
};