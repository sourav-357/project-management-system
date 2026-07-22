import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initializeChatSockets } from './sockets/chatSocket.js';
import { initializeCallSockets } from './sockets/callSocket.js';

const PORT = process.env.PORT || 3000;
let httpServer;

// ! handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception', err);
    process.exit(1);
});

// * start server
const startServer = async () => {
    try {
        await connectDB(); // connect database

        httpServer = http.createServer(app);

        const io = new Server(httpServer, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
                credentials: true,
            },
        });

        initializeChatSockets(io);
        initializeCallSockets(io);

        httpServer.listen(PORT, () => {
            console.log(`Server & Socket.io running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(`Server startup failed: ${error.message}`);
        process.exit(1);
    }
};

startServer();

// ! handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection', err);

    if (httpServer) {
        httpServer.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});
