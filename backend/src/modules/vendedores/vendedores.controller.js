import { VendedoresService } from './vendedores.service.js';

export const VendedoresController = {
  async getAll(req, res, next) {
    try {
      const vendedores = await VendedoresService.getAll();
      return res.json(vendedores);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { nombre_vendedor, comision_porcentaje } = req.body;

      const nuevoVendedor = await VendedoresService.create({ 
        nombre_vendedor, 
        comision_porcentaje 
      });
      
      return res.status(201).json(nuevoVendedor);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre_vendedor, comision_porcentaje, activo } = req.body;

      const datosSaneados = {};
      if (nombre_vendedor !== undefined) datosSaneados.nombre_vendedor = nombre_vendedor;
      if (comision_porcentaje !== undefined) datosSaneados.comision_porcentaje = comision_porcentaje;
      if (activo !== undefined) datosSaneados.activo = String(activo) === 'true';
      
      const vendedorActualizado = await VendedoresService.update(id, datosSaneados);
      return res.json(vendedorActualizado);
    } catch (error) {
      next(error);
    }
  }
};