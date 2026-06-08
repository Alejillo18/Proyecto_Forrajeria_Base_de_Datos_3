import { createClient } from 'redis';
import 'dotenv/config';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Error en Redis Client:', err));
await redisClient.connect();
console.log('Conectado a Redis');

export { redisClient };