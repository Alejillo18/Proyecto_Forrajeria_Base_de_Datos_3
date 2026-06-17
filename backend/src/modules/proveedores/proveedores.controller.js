import { ProveedoresService } from './proveedores.service.js';

export const ProveedoresController = {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const data = await ProveedoresService.getAll({ page, limit });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const proveedor = await ProveedoresService.getById(id);
      
      if (!proveedor) {
        return res.status(404).json({ message: 'Proveedor no encontrado o inactivo' });
      }
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const nuevoProveedor = await ProveedoresService.create(req.body);
      res.status(201).json(nuevoProveedor);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const proveedorActualizado = await ProveedoresService.update(id, req.body);
      
      if (!proveedorActualizado) {
        return res.status(404).json({ message: 'Proveedor no encontrado o inactivo para actualizar' });
      }
      res.json(proveedorActualizado);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const proveedorEliminado = await ProveedoresService.delete(id);
      
      if (!proveedorEliminado) {
        return res.status(404).json({ message: 'El proveedor ya estaba eliminado o no existe' });
      }
      res.json({ 
        message: 'Proveedor eliminado lógicamente con éxito', 
        proveedor: proveedorEliminado 
      });
    } catch (error) {
      next(error);
    }
  }
};