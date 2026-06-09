import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import ProveedoresRouter from "./modules/proveedores/proveedores.routes.js";
import ClientesRouter from "./modules/clientes/clientes.routes.js";
import ProductosRouter from './modules/productos/productos.routes.js';
import TurnosRouter from "./modules/turnos/turnos.routes.js";
import VentasRouter from "./modules/ventas/ventas.router.js";
import AuthRouter from './modules/auth/auth.routes.js';
import ReportesRouter from "./modules/reportes/reportes.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', AuthRouter);
app.use('/api/proveedores', ProveedoresRouter);
app.use('/api/clientes', ClientesRouter);
app.use('/api/productos', ProductosRouter);
app.use('/api/turnos', TurnosRouter);
app.use('/api/ventas', VentasRouter);
app.use('/api/reportes', ReportesRouter);

app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: 'Recurso no encontrado',
      status: 404
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error detectado en el pipeline:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      status: err.status || 500
    }
  });
});

export default app;