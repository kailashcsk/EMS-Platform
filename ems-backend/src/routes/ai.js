const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { authenticateToken } = require("../middleware/auth");

// POST /api/ai/query - Process natural language query
router.post("/query", authenticateToken, aiController.processQuery);

// GET /api/ai/samples - Get sample queries
router.get("/samples", authenticateToken, aiController.getSampleQueries);

// GET /api/ai/health - Health check for AI service
router.get("/health", aiController.healthCheck);

// POST /api/ai/query-with-docs - Process natural language query with document parsing
router.post("/query-with-docs", authenticateToken, aiController.processQueryWithDocuments);

module.exports = router;
