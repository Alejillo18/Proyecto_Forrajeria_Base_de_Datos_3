import { VendedoresDAO } from './vendedores.dao.js';

export const VendedoresService = {
  async getAll() {
    return await VendedoresDAO.selectAll();
  },

  async create({ nombre_vendedor, comision_porcentaje }) {
    if (!nombre_vendedor) {
      const error = new Error('El nombre del vendedor es requerido');
      error.status = 400;
      throw error;
    }
    
    // Convertimos preventivamente a flotante por el tipo Decimal de Postgres
    const comision = parseFloat(comision_porcentaje) || 0;
    
    return await VendedoresDAO.insert({
      nombre_vendedor,
      comision_porcentaje: comision
    });
  },

  async update(id, data) {
    const payload = { ...data };
    if (data.comision_porcentaje !== undefined) {
      payload.comision_porcentaje = parseFloat(data.comision_porcentaje) || 0;
    }
    return await VendedoresDAO.update(id, payload);
  }
};