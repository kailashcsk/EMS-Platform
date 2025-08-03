const OpenAI = require("openai");
const pool = require("../config/database");
const documentParserService = require("./documentParserService");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.schemaContext = `
  You are an EMS (Emergency Medical Services) database assistant. You have access to a PostgreSQL database with the following schema:

  TABLES:
  1. departments (id, name, description, created_at, updated_at)
  2. protocols (id, department_id, name, description_summary, file_url, file_name, created_at, updated_at)
  3. medications (id, department_id, name, use_case, description_summary, file_url, file_name, created_at, updated_at)
  4. medication_doses (id, protocol_id, medication_id, amount, route, frequency, notes, created_at, updated_at)

  IMPORTANT: 
  - protocols.file_url contains attached protocol documents (PDFs, etc.)
  - medications.file_url contains attached medication information documents
  - When looking for protocol documents, SELECT p.file_url from protocols table
  - When looking for medication documents, SELECT m.file_url from medications table

  RELATIONSHIPS:
  - departments contain protocols and medications (1:many)
  - protocols have many medication_doses (1:many)
  - medications have many medication_doses (1:many)
  - medication_doses connect protocols and medications with specific dosage info

  SAMPLE DATA CONTEXT:
  Departments: Emergency Medicine, Cardiology, Pediatrics
  Common Protocols: Adult Cardiac Arrest, Anaphylaxis Treatment, STEMI Protocol, Advanced Cardiac Life Support Protocol
  Common Medications: Epinephrine, Atropine, Aspirin, Midazolam
  Routes: IV (intravenous), IM (intramuscular), PO (oral), SL (sublingual)
  
  When generating SQL queries:
  1. Always SELECT file_url when querying protocols or medications to check for attached documents
  2. Use proper JOINs to get related data
  3. Include meaningful column aliases
  4. Use ILIKE with % wildcards for flexible text searches
  5. Order results logically
  `;
  }

  async generateSQLFromQuery(userQuery) {
    try {
      const prompt = `
      ${this.schemaContext}
      
      User Question: "${userQuery}"
      
      CRITICAL: When users ask about protocol information, medications, or doses:
      1. ALWAYS SELECT the protocol's file_url to check for attached documents
      2. For protocol-specific queries, query the protocols table directly
      3. Only use medication_doses table if specifically asking about database dose records
      4. The protocol documents (PDFs) contain the actual medication information
      
      Generate a PostgreSQL SQL query. Rules:
      1. For protocol queries: SELECT id, name, description_summary, file_url, file_name FROM protocols
      2. Include file_url to enable document parsing
      3. Use ILIKE with % wildcards for text searches
      4. If asking about specific protocol ID, use WHERE id = X
      
      Examples:
      - "What medications are in protocol ID 8?" → SELECT from protocols WHERE id = 8 (to get file_url)
      - "ACLS protocol medications" → SELECT from protocols WHERE name ILIKE '%ACLS%'
      
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

  async processQueryWithDocuments(userQuery) {
    try {
      console.log("Processing query with document context:", userQuery);

      // Step 1: Generate and execute SQL query as before
      const sqlQuery = await this.generateSQLFromQuery(userQuery);
      const queryResults = await this.executeQuery(sqlQuery);

      // Step 2: Check if any results have file URLs
      const resultsWithDocuments = [];

      for (const row of queryResults) {
        if (row.file_url) {
          console.log("Found document URL:", row.file_url);

          // Parse the document
          const documentContent = await documentParserService.parseDocument(
            row.file_url
          );

          // Extract medical information
          const medicalInfo = await documentParserService.extractMedicalInfo(
            documentContent.text || "",
            `${row.protocol_name || row.medication_name || "Unknown"} document`
          );

          resultsWithDocuments.push({
            ...row,
            document_content: {
              text: documentContent.text
                ? documentContent.text.substring(0, 2000)
                : "", // Limit text length
              medical_info: medicalInfo,
              file_info: {
                type: documentContent.type,
                filename: documentContent.filename,
                pages: documentContent.pages || 1,
                success: documentContent.success,
              },
            },
          });
        } else {
          resultsWithDocuments.push(row);
        }
      }

      // Step 3: Generate enhanced insights with document context
      const enhancedInsight = await this.generateEnhancedInsight(
        resultsWithDocuments,
        userQuery
      );

      return {
        success: true,
        query: userQuery,
        sql: sqlQuery,
        data: resultsWithDocuments,
        insight: enhancedInsight,
        count: resultsWithDocuments.length,
        has_documents: resultsWithDocuments.some((r) => r.document_content),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error processing query with documents:", error);
      // Fallback to regular processing if document parsing fails
      return await this.processNaturalLanguageQuery(userQuery);
    }
  }

  async generateEnhancedInsight(queryDataWithDocs, originalQuestion) {
    try {
      // Prepare context for AI with document information
      const documentsContext = queryDataWithDocs
        .filter((row) => row.document_content)
        .map((row) => ({
          item: row.protocol_name || row.medication_name || "Item",
          document_text: row.document_content.text.substring(0, 1000), // Increased to 1000 chars
          medical_keywords: row.document_content.medical_info,
          file_type: row.document_content.file_info.type,
        }));

      const prompt = `
      As an EMS medical expert, provide comprehensive insights about this query result:
      
      Original Question: "${originalQuestion}"
      
      Database Results: ${JSON.stringify(
        queryDataWithDocs.map((r) => {
          const { document_content, ...cleanRow } = r;
          return cleanRow;
        }),
        null,
        2
      )}
      
      ${
        documentsContext.length > 0
          ? `
      Additional Document Context Found:
      ${documentsContext
        .map(
          (doc) => `
      Document for ${doc.item}:
      - File Type: ${doc.file_type}
      - Document Content Preview: "${doc.document_text}"
      - Medical Keywords Detected: ${JSON.stringify(doc.medical_keywords)}
      `
        )
        .join("\n")}
      `
          : "No documents with medical content found."
      }
      
      Provide a comprehensive response that:
      1. Answers the original question using the database information
      2. If documents contain relevant medical information, incorporate it
      3. If documents don't contain relevant medical info, focus on database results
      4. Add medical context and clinical guidelines from your knowledge
      5. Note when documents are attached but don't contain relevant medical information
      6. Provide actionable insights for EMS professionals
      
      Important: Even if attached documents don't contain relevant medical information, 
      still provide valuable medical insights based on the database results and your medical knowledge.
      
      Enhanced Medical Insight:
    `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating enhanced insight:", error);
      // Fallback to regular insight generation
      return await this.generateInsight(queryDataWithDocs, originalQuestion);
    }
  }
}

module.exports = new AIService();
