import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();
BigInt.prototype.toJSON = function () {
  return this.toString();
};
export const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis error del cliente: ', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis: Conectado con éxito');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis: No se pudo establecer conexion: ", error.message);
  }
};