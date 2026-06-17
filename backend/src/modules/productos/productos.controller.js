import { ProductosService } from './productos.service.js';

export const ProductosController = {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || null;
      
      const data = await ProductosService.getAll({ page, limit, search });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const producto = await ProductosService.getById(id);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado o inactivo' });
      }
      res.json(producto);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const nuevoProducto = await ProductosService.create(req.body);
      res.status(201).json(nuevoProducto);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const productoActualizado = await ProductosService.update(id, req.body);
      if (!productoActualizado) {
        return res.status(404).json({ message: 'Producto no encontrado o inválido para actualizar' });
      }
      res.json(productoActualizado);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const productoEliminado = await ProductosService.delete(id);
      if (!productoEliminado) {
        return res.status(404).json({ message: 'El producto no existe o ya fue eliminado' });
      }
      res.json({
        message: 'Producto dado de baja lógicamente con éxito',
        producto: productoEliminado
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePricesMassive(req, res, next) {
    try {
      const { porcentaje } = req.body;
      if (typeof porcentaje !== 'number') {
        return res.status(400).json({ message: 'El porcentaje debe ser un valor numérico válido' });
      }
      await ProductosService.actualizarPreciosMasivo({ porcentaje });
      res.json({ message: 'Precios actualizados masivamente con éxito en todo el catálogo' });
    } catch (error) {
      next(error);
    }
  },

  async inventoryAdjustment(req, res, next) {
    try {
      const { id } = req.params;
      const { cantidad, unidad, tipo_ajuste, motivo } = req.body;
      
      const resultado = await ProductosService.ajustarInventarioManual(id, {
        cantidad: Number(cantidad),
        unidad,
        tipo_ajuste,
        motivo
      });
      
      res.json({
        message: 'Ajuste manual de inventario procesado correctamente',
        ...resultado
      });
    } catch (error) {
      next(error);
    }
  }
};