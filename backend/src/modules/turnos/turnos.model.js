import mongoose from 'mongoose';

const TurnoCajaSchema = new mongoose.Schema({
  id_usuario: {
    type: Number,
    required: true
  },
  fecha_apertura: {
    type: Date,
    required: true,
    default: Date.now
  },
  fecha_cierre: {
    type: Date
  },
  monto_inicial: {
    type: Number,
    required: true,
    default: 0
  },
  monto_final_esperado: {
    type: Number,
    comment: 'Calculado automáticamente: inicial + ventas - egresos'
  },
  monto_final_real: {
    type: Number,
    comment: 'Lo que el empleado cuenta físicamente al cerrar'
  },
  diferencia_caja: {
    type: Number,
    comment: 'monto_final_real - monto_final_esperado'
  },
  estado: {
    type: String,
    required: true,
    enum: ['abierto', 'cerrado'],
    default: 'abierto'
  },

  auditoria_detalles: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  versionKey: false
});

TurnoCajaSchema.index({ id_usuario: 1, estado: 1 });

export const TurnoCaja = mongoose.model('TurnoCaja', TurnoCajaSchema);