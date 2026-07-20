

// * import required modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
import authRouter from './router/user.route.js';
import adminRouter from './router/admin.route.js';
import studentRouter from './router/student.route.js';




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




// * uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




// * routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/student', studentRouter);




// ! error handler middleware
app.use(errorMiddleware);



export default app;
