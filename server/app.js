

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

import authRouter from './router/user.route.js';
import adminRouter from './router/admin.route.js';
import studentRouter from './router/student.route.js';
import teacherRouter from './router/teacher.route.js';
import connectionRouter from './router/connection.route.js';
import chatRouter from './router/chat.route.js';
import meetingRouter from './router/meeting.route.js';

import { errorMiddleware } from './middlewares/error.js';





dotenv.config({ quiet: true });
const app = express();


app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Data sanitization against NoSQL query injection (Express 5 compatible)
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    if (req.query) mongoSanitize.sanitize(req.query);
    next();
});

// Gzip compression
app.use(compression());

// Body parser & cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

app.use('/api', apiLimiter);

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive in dev mode
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
}));

// // Uploads static directory setup
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const uploadsDir = path.join(__dirname, 'uploads');
// const tempDir = path.join(__dirname, 'uploads/temp');

// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/student', studentRouter);
app.use('/api/v1/teacher', teacherRouter);
app.use('/api/v1/connections', connectionRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/meetings', meetingRouter);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Academic Project Workflow Platform API is running smoothly',
        timestamp: new Date().toISOString(),
    });
});

// Centralized error middleware
app.use(errorMiddleware);

export default app;
