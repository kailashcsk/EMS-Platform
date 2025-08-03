const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// POST /api/ai/query - Process natural language query
router.post("/query", aiController.processQuery);

// GET /api/ai/samples - Get sample queries
router.get("/samples", aiController.getSampleQueries);

// GET /api/ai/health - Health check for AI service
router.get("/health", aiController.healthCheck);

module.exports = router;
