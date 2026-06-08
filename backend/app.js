import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ClientesRouter from './routes/clientes.routes.js';
import ProveedoresRouter from './routes/proveedores.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
  res.render('index');
});


app.get('/clientes', (req, res) => {
  res.render('clientes');
});


app.get('/proveedores', (req, res) => {
  res.render('proveedores');
});

app.use('/api/clientes', ClientesRouter);
app.use('/api/proveedores', ProveedoresRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});