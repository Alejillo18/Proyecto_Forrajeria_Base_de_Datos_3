import { TurnoCaja } from './turnos.model.js';

export const TurnosDAO = {
  async findActivoByUsuario(id_usuario) {
    return await TurnoCaja.findOne({ id_usuario, estado: 'abierto' });
  },

  async selectById(id) {
    return await TurnoCaja.findById(id);
  },

  async insert(data) {
    const nuevoTurno = new TurnoCaja(data);
    return await nuevoTurno.save();
  },

  async update(id, data) {
    return await TurnoCaja.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    );
  },

  async selectAll({ limit, offset }) {
    const datos = await TurnoCaja.find()
      .skip(offset)
      .limit(limit)
      .sort({ fecha_apertura: -1 });
    const total = await TurnoCaja.countDocuments();
    return { datos, total };
  }
};