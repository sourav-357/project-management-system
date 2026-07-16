

// * import required modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
import authRouter from './router/user.route.js';




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




// * routers
app.use('/api/v1/auth', authRouter);




// ! error handler middleware
app.use(errorMiddleware);



export default app;
