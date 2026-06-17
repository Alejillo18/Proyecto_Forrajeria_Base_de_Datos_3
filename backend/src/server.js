import app from './app.js';
import { connectMongo } from '../config/db.mongoose.js';
import { connectRedis } from '../config/db.redis.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  console.log('Iniciando servicios');
  await connectMongo();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Servidor corriendo de forma profesional en el puerto: ${PORT}`);
    console.log(`URL Base: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
};

startServer();