import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose from 'mongoose';
import { seedDefaultUsers } from './seed.js';

let isSeeded = false;

export const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/FYP-project';

    try {
        await mongoose.connect(mongoURI);

        if (!isSeeded) {
            await seedDefaultUsers();
            isSeeded = true;
        }
    } catch (error) {
        throw error;
    }
};