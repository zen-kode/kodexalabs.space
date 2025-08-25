import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Example HTTP function
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

// Example function for file upload handling
export const handleFileUpload = onRequest(async (request, response) => {
  try {
    const bucket = admin.storage().bucket();
    logger.info("File upload handler called");
    
    response.json({
      success: true,
      message: "File upload handler ready",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error in file upload handler:", error);
    response.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Health check function for the hybrid architecture
export const healthCheck = onRequest((request, response) => {
  response.json({
    status: "healthy",
    service: "firebase-functions",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});