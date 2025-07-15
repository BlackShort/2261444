const mongoose = require("mongoose");
const logger = require("../../logging/logger");

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URL);
        logger.info("Database connected successfully", { 
            database: process.env.DB_URL,
            timestamp: new Date().toISOString()
        });
        console.log("Database is Connected");
    } catch (err) {
        logger.error("Database connection failed", { 
            error: err.message,
            stack: err.stack 
        });
        console.error("Database connection error:", err.message);
        throw err;
    }
}

module.exports = connectDB;

