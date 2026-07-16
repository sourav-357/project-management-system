

// * import required modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';



// * middleware
const app = express();
dotenv.config({ quiet: true });

app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));




// * databse connection
connectDB();