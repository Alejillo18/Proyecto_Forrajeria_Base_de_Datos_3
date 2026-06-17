import { Producto } from './productos.model.js';

export const ProductosDAO = {
  async selectAll({ limit, offset, search }) {
    const query = { activo: true };
    if (search) {
      query.$or = [
        { nombre_producto: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const datos = await Producto.find(query)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Producto.countDocuments(query);

    return { datos, total };
  },

  async selectById(id) {
    return await Producto.findOne({ _id: id, activo: true });
  },

  async selectBySku(sku) {
    return await Producto.findOne({ sku, activo: true });
  },

  async insert(data) {
    const nuevoProducto = new Producto(data);
    return await nuevoProducto.save();
  },

  async update(id, data) {
    return await Producto.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: data },
      { new: true }
    );
  },

  async deleteSoft(id) {
    return await Producto.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: { activo: false } },
      { new: true }
    );
  },

  async updatePricesMassive(porcentaje) {
    const factor = 1 + porcentaje / 100;
    
    return await Producto.updateMany(
      { activo: true },
      [
        {
          $set: {
            precio_venta_bolsa: { $round: [{ $multiply: ['$precio_venta_bolsa', factor] }, 2] },
            precio_venta_kilo: { $round: [{ $multiply: ['$precio_venta_kilo', factor] }, 2] }
          }
        }
      ]
    );
  }
};