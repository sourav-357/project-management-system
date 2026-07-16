
// * import required modules
import app from "./app.js"
import { connectDB } from "./config/db.js";



const PORT = process.env.PORT || 3000;
let server;



// ! handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error(`Uncaught Exception`, err);
    process.exit(1);
});



// * start server
const startServer = async () => {
    try {
        await connectDB(); // connect database
        server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(`Server startup failed: ${error.message}`);
        process.exit(1);
    }
}
startServer();



// ! handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection`, err);

    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});


