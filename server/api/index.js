import app from '../app.js';
import { connectDB } from '../config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Serverless DB connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
  return app(req, res);
}
