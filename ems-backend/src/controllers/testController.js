const documentParserService = require("../services/documentParserService");
const pool = require("../config/database");

class TestController {
  // Test PDF parsing for a specific protocol
  async testPDFParsing(req, res) {
    try {
      const { protocol_id } = req.params;

      // Get protocol with file URL
      const query =
        "SELECT * FROM protocols WHERE id = $1 AND file_url IS NOT NULL";
      const result = await pool.query(query, [protocol_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Protocol not found or no file attached",
        });
      }

      const protocol = result.rows[0];
      console.log("Testing PDF parsing for:", protocol.name);
      console.log("File URL:", protocol.file_url);

      // Parse the document
      const parsedContent = await documentParserService.parseDocument(
        protocol.file_url
      );

      // Extract medical information
      const medicalInfo = await documentParserService.extractMedicalInfo(
        parsedContent.text || ""
      );

      res.json({
        success: true,
        protocol: {
          id: protocol.id,
          name: protocol.name,
          file_url: protocol.file_url,
        },
        parsing_result: {
          success: parsedContent.success,
          filename: parsedContent.filename,
          content_type: parsedContent.contentType,
          document_type: parsedContent.type,
          error: parsedContent.error || null,
          text_length: parsedContent.text ? parsedContent.text.length : 0,
          text_preview: parsedContent.text
            ? parsedContent.text.substring(0, 500) + "..."
            : "No text extracted",
          full_text: parsedContent.text || "No text content",
          pages: parsedContent.pages || "Unknown",
          medical_keywords: medicalInfo,
          extracted_at: parsedContent.extractedAt,
        },
      });
    } catch (error) {
      console.error("Error in PDF parsing test:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  // List all protocols with files for testing
  async listProtocolsWithFiles(req, res) {
    try {
      const query = `
        SELECT id, name, file_url, file_name, created_at
        FROM protocols 
        WHERE file_url IS NOT NULL 
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        count: result.rows.length,
        protocols: result.rows,
      });
    } catch (error) {
      console.error("Error listing protocols with files:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Test S3 file download only
  async testS3Download(req, res) {
    try {
      const { file_url } = req.body;

      if (!file_url) {
        return res.status(400).json({
          success: false,
          error: "file_url is required in request body",
        });
      }

      console.log("Testing S3 download for:", file_url);

      const downloadResult = await documentParserService.downloadFileFromS3(
        file_url
      );

      res.json({
        success: true,
        download_result: {
          filename: downloadResult.filename,
          content_type: downloadResult.contentType,
          buffer_size: downloadResult.buffer.length,
          buffer_first_bytes: downloadResult.buffer
            .slice(0, 50)
            .toString("hex"),
        },
      });
    } catch (error) {
      console.error("Error in S3 download test:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack,
      });
    }
  }

  // Test PDF parsing with raw buffer
  async testRawPDFParsing(req, res) {
    try {
      const { file_url } = req.body;

      if (!file_url) {
        return res.status(400).json({
          success: false,
          error: "file_url is required in request body",
        });
      }

      console.log("Testing raw PDF parsing for:", file_url);

      // Step 1: Download file
      const downloadResult = await documentParserService.downloadFileFromS3(
        file_url
      );
      console.log(
        "Downloaded file:",
        downloadResult.filename,
        "Size:",
        downloadResult.buffer.length
      );

      // Step 2: Parse PDF
      const pdfResult = await documentParserService.parsePDF(
        downloadResult.buffer
      );
      console.log("PDF parsed. Text length:", pdfResult.text?.length || 0);

      res.json({
        success: true,
        file_info: {
          filename: downloadResult.filename,
          content_type: downloadResult.contentType,
          size_bytes: downloadResult.buffer.length,
        },
        pdf_parsing: {
          text_length: pdfResult.text?.length || 0,
          pages: pdfResult.pages,
          text_preview: pdfResult.text
            ? pdfResult.text.substring(0, 1000)
            : "No text found",
          has_text: !!pdfResult.text && pdfResult.text.length > 0,
        },
      });
    } catch (error) {
      console.error("Error in raw PDF parsing test:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.stack,
      });
    }
  }
}

module.exports = new TestController();
