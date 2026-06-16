import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  nombre_producto: { type: String, required: true },
  peso_bolsa_kg: { type: Number, required: true },
  stock_bolsas_cerradas: { type: Number, default: 0 },
  stock_kilos_granel: { type: Number, default: 0 },
  precio_venta_bolsa: { type: Number, required: true },
  precio_venta_kilo: { type: Number, required: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export const Producto = mongoose.model('Producto', productoSchema);