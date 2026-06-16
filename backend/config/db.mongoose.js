import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectMongo = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB: Conectado con éxito');
  } catch (error) {
    console.error('MongoDB: Error de conexión: ', error.message);
    process.exit(1);
  }
};