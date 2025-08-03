const OpenAI = require("openai");
const pool = require("../config/database");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    // Database schema context for AI
    this.schemaContext = `
    You are an EMS (Emergency Medical Services) database assistant. You have access to a PostgreSQL database with the following schema:

    TABLES:
    1. departments (id, name, description, created_at, updated_at)
    2. protocols (id, department_id, name, description_summary, file_url, file_name, created_at, updated_at)
    3. medications (id, department_id, name, use_case, description_summary, file_url, file_name, created_at, updated_at)
    4. medication_doses (id, protocol_id, medication_id, amount, route, frequency, notes, created_at, updated_at)

    RELATIONSHIPS:
    - departments contain protocols and medications (1:many)
    - protocols have many medication_doses (1:many)
    - medications have many medication_doses (1:many)
    - medication_doses connect protocols and medications with specific dosage info

    SAMPLE DATA CONTEXT:
    Departments: Emergency Medicine, Cardiology, Pediatrics
    Common Protocols: Adult Cardiac Arrest, Anaphylaxis Treatment, STEMI Protocol
    Common Medications: Epinephrine, Atropine, Aspirin, Midazolam
    Routes: IV (intravenous), IM (intramuscular), PO (oral), SL (sublingual)
    
    When generating SQL queries:
    1. Always use proper JOINs to get related data
    2. Include meaningful column aliases
    3. Return relevant columns for the question
    4. Use ILIKE for case-insensitive text searches
    5. Order results logically
    `;
  }

  async generateSQLFromQuery(userQuery) {
    try {
      const prompt = `
        ${this.schemaContext}
        
        User Question: "${userQuery}"
        
        Generate a PostgreSQL SQL query to answer this question. Rules:
        1. Return ONLY the SQL query, no explanation or markdown
        2. Use proper JOINs when accessing related tables
        3. Include column aliases for clarity (e.g., p.name as protocol_name)
        4. Use ILIKE for text searches (case-insensitive)
        5. Order results logically
        6. Limit to reasonable number of results if needed
        
        Examples:
        - "What medications are used for cardiac arrest?" → Query protocols table for cardiac arrest, JOIN with medication_doses and medications
        - "Show me epinephrine doses" → Query medications for epinephrine, JOIN with medication_doses and protocols
        - "List all pediatric protocols" → Query departments for pediatrics, JOIN with protocols
        
        SQL Query:
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.1,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating SQL:", error);
      throw new Error("Failed to generate SQL query");
    }
  }

  async executeQuery(sqlQuery) {
    try {
      // Clean the SQL query (remove any markdown formatting)
      const cleanSQL = sqlQuery
        .replace(/```sql\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      console.log("Executing SQL:", cleanSQL);
      const result = await pool.query(cleanSQL);
      return result.rows;
    } catch (error) {
      console.error("Error executing query:", error);
      throw new Error("Failed to execute database query: " + error.message);
    }
  }

  async generateInsight(queryData, originalQuestion) {
    try {
      const prompt = `
        As an EMS medical expert, provide insights about this query result:
        
        Original Question: "${originalQuestion}"
        
        Data Retrieved: ${JSON.stringify(queryData, null, 2)}
        
        Provide a helpful, medical-focused response that:
        1. Directly answers the original question
        2. Summarizes the key findings from the data
        3. Adds relevant medical context, safety considerations, or clinical notes
        4. Mentions any important protocols, contraindications, or guidelines
        5. Keeps response professional but accessible
        6. If no data found, suggest related alternatives
        
        Format your response in clear paragraphs, not bullet points.
        
        Medical Insight:
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating insight:", error);
      return "Unable to generate medical insights at this time.";
    }
  }

  async processNaturalLanguageQuery(userQuery) {
    try {
      console.log("Processing query:", userQuery);

      // Step 1: Generate SQL from natural language
      const sqlQuery = await this.generateSQLFromQuery(userQuery);
      console.log("Generated SQL:", sqlQuery);

      // Step 2: Execute the SQL query
      const queryResults = await this.executeQuery(sqlQuery);
      console.log("Query results count:", queryResults.length);

      // Step 3: Generate medical insights
      const medicalInsight = await this.generateInsight(
        queryResults,
        userQuery
      );

      return {
        success: true,
        query: userQuery,
        sql: sqlQuery,
        data: queryResults,
        insight: medicalInsight,
        count: queryResults.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error processing natural language query:", error);
      return {
        success: false,
        query: userQuery,
        error: error.message,
        suggestion:
          'Try rephrasing your question. Ask about departments, protocols, medications, or dosages. Examples: "What is the epinephrine dose for cardiac arrest?" or "Show me all pediatric protocols"',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new AIService();
