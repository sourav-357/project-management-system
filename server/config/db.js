


// * import modules
import mongoose from 'mongoose';


export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('database connected successfully');
    } catch (error) {
        console.log('database connection failed');
        console.error(error.message);
        process.exit(1);
    }
}