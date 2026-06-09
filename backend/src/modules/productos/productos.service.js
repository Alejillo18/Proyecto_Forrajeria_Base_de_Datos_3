import { ProductosDAO } from './productos.dao.js';
import { redisClient } from '../../../config/db.redis.js';

async function clearProductosCache() {
  try {
    const keys = await redisClient.keys('productos:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error al limpiar caché de productos:', error.message);
  }
}

export const ProductosService = {
  async getAll({ page, limit, search }) {
    const offset = (page - 1) * limit;
    if (search) {
      const { datos, total } = await ProductosDAO.selectAll({ limit, offset, search });
      return { pag: page, limite: limit, total, datos, origen: 'MongoDB' };
    }
    const cacheKey = `productos:page:${page}:limit:${limit}`;
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        data.origen = 'Redis';
        return data;
      }
    } catch (err) {
      console.error('Redis Error (Productos Fallback):', err.message);
    }
    const { datos, total } = await ProductosDAO.selectAll({ limit, offset }); 
    const responseData = {
      pag: page,
      limite: limit,
      total,
      datos,
      origen: 'MongoDB'
    };
    try {
      await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 120 });
    } catch (err) {
      console.error('Error al guardar catálogo en Redis:', err.message);
    }
    return responseData;
  },

  async getById(id) {
    return await ProductosDAO.selectById(id);
  },

  async create(data) {
    const existeSku = await ProductosDAO.selectBySku(data.sku);
    if (existeSku) {
      const error = new Error('El SKU especificado ya se encuentra registrado');
      error.status = 400;
      throw error;
    }

    const nuevoProducto = await ProductosDAO.insert(data);
    await clearProductosCache();
    return nuevoProducto;
  },

  async update(id, data) {
    if (data.sku) delete data.sku;

    const productoActualizado = await ProductosDAO.update(id, data);
    if (productoActualizado) {
      await clearProductosCache();
    }
    return productoActualizado;
  },

  async delete(id) {
    const productoEliminado = await ProductosDAO.deleteSoft(id);
    if (productoEliminado) {
      await clearProductosCache();
    }
    return productoEliminado;
  },

  async reabastecerStock(id, { bolsasParaStock, bolsasParaGranel }) {
    const producto = await ProductosDAO.selectById(id);
    if (!producto || !producto.activo) {
      const error = new Error('Producto no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const kilosNuevosGranel = bolsasParaGranel * producto.peso_bolsa_kg;

    const dataActualizada = {
      stock_bolsas_cerradas: producto.stock_bolsas_cerradas + bolsasParaStock,
      stock_kilos_granel: producto.stock_kilos_granel + kilosNuevosGranel
    };

    const productoActualizado = await ProductosDAO.update(id, dataActualizada);
    if (productoActualizado) {
      await clearProductosCache();
    }
    return productoActualizado;
  },

  async actualizarPreciosMasivo({ porcentaje }) {
    const resultado = await ProductosDAO.updatePricesMassive(porcentaje);
    await clearProductosCache();
    return resultado;
  },

  async ajustarInventarioManual(id, { cantidad, unidad, tipo_ajuste, motivo }) {
    if (!motivo || motivo.trim() === '') {
      const error = new Error('El motivo del ajuste es obligatorio');
      error.status = 400;
      throw error;
    }

    const producto = await ProductosDAO.selectById(id);
    if (!producto || !producto.activo) {
      const error = new Error('Producto no encontrado o inactivo');
      error.status = 404;
      throw error;
    }

    const campoStock = unidad === 'bolsa' ? 'stock_bolsas_cerradas' : 'stock_kilos_granel';
    const stockActual = producto[campoStock];
    let nuevoStock = stockActual;

    if (tipo_ajuste === 'ingreso') {
      nuevoStock += cantidad;
    } else if (tipo_ajuste === 'egreso') {
      if (stockActual < cantidad) {
        const error = new Error(`Stock insuficiente para realizar el egreso manual de ${unidad}s`);
        error.status = 400;
        throw error;
      }
      nuevoStock -= cantidad;
    } else {
      const error = new Error('Tipo de ajuste no válido. Debe ser ingreso o egreso');
      error.status = 400;
      throw error;
    }

    const dataActualizada = { [campoStock]: nuevoStock };
    const productoActualizado = await ProductosDAO.update(id, dataActualizada);
    
    if (productoActualizado) {
      await clearProductosCache();
    }

    return {
      producto: productoActualizado,
      ajuste: {
        tipo_ajuste,
        unidad,
        cantidad,
        motivo
      }
    };
  }
};