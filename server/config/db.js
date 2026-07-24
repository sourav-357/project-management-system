import mongoose from 'mongoose';
import { seedDefaultUsers } from './seed.js';

let isSeeded = false;

export const connectDB = async () => {
    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected successfully');

        if (!isSeeded) {
            await seedDefaultUsers();
            isSeeded = true;
        }
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};