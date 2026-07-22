


// * import modules
import mongoose from 'mongoose';
import { seedDefaultUsers } from './seed.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('database connected successfully');
        await seedDefaultUsers();
    } catch (error) {
        console.log('database connection failed');
        console.error(error.message);
        process.exit(1);
    }
}