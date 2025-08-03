const aiService = require("../services/aiService");

class AIController {
  // Process natural language query
  async processQuery(req, res) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          error: "Query is required and must be a string",
        });
      }

      if (query.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Query too long. Please keep queries under 500 characters.",
        });
      }

      const result = await aiService.processNaturalLanguageQuery(query);
      res.json(result);
    } catch (error) {
      console.error("Error in AI controller:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process query",
        details: error.message,
      });
    }
  }

  // Get sample queries for users
  async getSampleQueries(req, res) {
    try {
      const sampleQueries = [
        {
          category: "Medication Dosing",
          queries: [
            "What is the epinephrine dose for adult cardiac arrest?",
            "Show me all IV medications and their doses",
            "What medications are used for anaphylaxis?",
            "List all pediatric medication doses",
          ],
        },
        {
          category: "Protocol Information",
          queries: [
            "What protocols use epinephrine?",
            "Show me all emergency medicine protocols",
            "What is the STEMI protocol?",
            "List all cardiology protocols",
          ],
        },
        {
          category: "Department Overview",
          queries: [
            "What departments do we have?",
            "Show me all protocols in the pediatrics department",
            "What medications are in the emergency medicine department?",
            "Compare departments by number of protocols",
          ],
        },
        {
          category: "Route Analysis",
          queries: [
            "What medications are given IV?",
            "Show me all IM injections",
            "Compare oral vs IV medications",
            "What are the most common administration routes?",
          ],
        },
      ];

      res.json({
        success: true,
        data: sampleQueries,
        message:
          "Try asking these sample questions to explore the EMS database",
      });
    } catch (error) {
      console.error("Error getting sample queries:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get sample queries",
      });
    }
  }

  // Health check for AI service
  async healthCheck(req, res) {
    try {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      const keyLength = process.env.OPENAI_API_KEY?.length || 0;

      res.json({
        success: true,
        ai_service: "operational",
        openai_configured: hasOpenAIKey,
        api_key_length:
          keyLength > 0 ? `${keyLength} characters` : "not configured",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "AI service health check failed",
      });
    }
  }
  
  // Process natural language query with document parsing
  async processQueryWithDocuments(req, res) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          error: "Query is required and must be a string",
        });
      }

      if (query.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Query too long. Please keep queries under 500 characters.",
        });
      }

      const result = await aiService.processQueryWithDocuments(query);
      res.json(result);
    } catch (error) {
      console.error("Error in AI controller with documents:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process query with documents",
        details: error.message,
      });
    }
  }
}

module.exports = new AIController();
