import { VentasService } from './ventas.service.js';

export const VentasController = {
  async crearVenta(req, res, next) {
    try {
      const { id_usuario, id_cliente, monto_total, metodo_pago, detalles } = req.body;

      if (!id_usuario || !monto_total || !metodo_pago || !detalles || detalles.length === 0) {
        return res.status(400).json({ message: 'Datos de la venta incompletos o sin artículos' });
      }

      const resultado = await VentasService.procesarVenta({
        id_usuario,
        id_cliente,
        monto_total,
        metodo_pago,
        detalles
      });

      res.status(201).json({
        message: 'Venta procesada con éxito y stock actualizado',
        venta: resultado
      });
    } catch (error) {
      next(error);
    }
  },

  async getPendientesComision(req, res, next) {
    try {
      const { id_usuario } = req.params;
      if (!id_usuario) {
        return res.status(400).json({ message: 'El ID del distribuidor es obligatorio' });
      }

      const liquidacion = await VentasService.obtenerComisionesPendientes(id_usuario);
      res.json(liquidacion);
    } catch (error) {
      next(error);
    }
  },

  async liquidarComisiones(req, res, next) {
    try {
      const { id_usuario } = req.params;
      if (!id_usuario) {
        return res.status(400).json({ message: 'El ID del distribuidor es obligatorio' });
      }

      const resultado = await VentasService.liquidarComisionesDistribuidor(id_usuario);
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }
};