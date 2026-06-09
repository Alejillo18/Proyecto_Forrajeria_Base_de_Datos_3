import { ClientesService } from './clientes.service.js';

export const ClientesController = {
  async getAll(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const data = await ClientesService.getAll({ page, limit });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const cliente = await ClientesService.getById(id);
      
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado o inactivo' });
      }
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const nuevoCliente = await ClientesService.create(req.body);
      res.status(201).json(nuevoCliente);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const clienteActualizado = await ClientesService.update(id, req.body);
      
      if (!clienteActualizado) {
        return res.status(404).json({ message: 'Cliente no encontrado o inactivo para actualizar' });
      }
      res.json(clienteActualizado);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const clienteEliminado = await ClientesService.delete(id);
      
      if (!clienteEliminado) {
        return res.status(404).json({ message: 'El cliente ya estaba eliminado o no existe' });
      }
      res.json({ 
        message: 'Cliente eliminado lógicamente con éxito', 
        cliente: clienteEliminado 
      });
    } catch (error) {
      next(error);
    }
  },

  async getCuentaCorriente(req, res, next) {
    try {
      const { id } = req.params;
      const cuentaCorriente = await ClientesService.obtenerDetalleCuentaCorriente(id);
      res.json(cuentaCorriente);
    } catch (error) {
      next(error);
    }
  }
};