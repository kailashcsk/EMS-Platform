const AWS = require("aws-sdk");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { s3Client, bucketName } = require("../config/aws");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

class DocumentParserService {
  constructor() {
    // Configure AWS Textract for advanced document analysis
    this.textract = new AWS.Textract({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  // Download file from S3
  async downloadFileFromS3(fileUrl) {
    try {
      // Extract key from URL
      const key = fileUrl.split(".amazonaws.com/")[1];
      if (!key) {
        throw new Error("Invalid S3 URL format");
      }

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      return {
        buffer: Buffer.concat(chunks),
        contentType: response.ContentType,
        filename: key.split("/").pop(),
      };
    } catch (error) {
      console.error("Error downloading file from S3:", error);
      throw new Error("Failed to download file from S3");
    }
  }

  // Parse PDF content
  async parsePDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
      };
    } catch (error) {
      console.error("Error parsing PDF:", error);
      throw new Error("Failed to parse PDF content");
    }
  }

  // Parse Word document content
  async parseWordDocument(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
        messages: result.messages,
      };
    } catch (error) {
      console.error("Error parsing Word document:", error);
      throw new Error("Failed to parse Word document content");
    }
  }

  // Simple image text extraction (without Textract for now)
  async parseImage(buffer, contentType) {
    try {
      // For now, return a placeholder since Textract setup is complex
      return {
        text: "Image content parsing requires AWS Textract setup. File uploaded successfully but text extraction not available.",
        tables: 0,
        forms: 0,
        blocks: 0,
        note: "Textract integration can be enabled for production use",
      };
    } catch (error) {
      console.error("Error parsing image:", error);
      return {
        text: "Unable to extract text from image.",
        tables: 0,
        forms: 0,
        blocks: 0,
        error: "Image parsing not available",
      };
    }
  }

  // Main document parsing function
  async parseDocument(fileUrl) {
    try {
      console.log("Parsing document:", fileUrl);

      // Download file from S3
      const { buffer, contentType, filename } = await this.downloadFileFromS3(
        fileUrl
      );

      let parsedContent = {};

      // Parse based on content type
      if (contentType === "application/pdf") {
        parsedContent = await this.parsePDF(buffer);
        parsedContent.type = "PDF";
      } else if (
        contentType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        contentType === "application/msword"
      ) {
        parsedContent = await this.parseWordDocument(buffer);
        parsedContent.type = "Word Document";
      } else if (contentType.startsWith("image/")) {
        parsedContent = await this.parseImage(buffer, contentType);
        parsedContent.type = "Image";
      } else {
        // For other file types, just note the file exists
        parsedContent = {
          text: `Document of type ${contentType} uploaded successfully. Content parsing may require additional configuration.`,
          type: contentType,
        };
      }

      return {
        success: true,
        filename,
        contentType,
        ...parsedContent,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in document parsing:", error);
      return {
        success: false,
        error: error.message,
        filename: "unknown",
        text: `Error parsing document: ${error.message}`,
      };
    }
  }

  // Extract key medical information from document text
  async extractMedicalInfo(documentText, documentContext = "") {
    try {
      const medicalKeywords = {
        dosages: this.extractDosages(documentText),
        medications: this.extractMedications(documentText),
        contraindications: this.extractContraindications(documentText),
        procedures: this.extractProcedures(documentText),
        vitals: this.extractVitalSigns(documentText),
      };

      return medicalKeywords;
    } catch (error) {
      console.error("Error extracting medical info:", error);
      return {
        dosages: [],
        medications: [],
        contraindications: [],
        procedures: [],
        vitals: [],
      };
    }
  }

  // Helper functions for medical information extraction
  extractDosages(text) {
    const dosagePattern = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?|iu)\b/gi;
    const matches = text.match(dosagePattern) || [];
    return [...new Set(matches)].slice(0, 10);
  }

  extractMedications(text) {
    const commonMeds = [
      "epinephrine",
      "atropine",
      "aspirin",
      "midazolam",
      "morphine",
      "lidocaine",
      "amiodarone",
      "adenosine",
      "naloxone",
      "dextrose",
      "albuterol",
      "nitroglycerin",
    ];

    const found = commonMeds.filter((med) =>
      text.toLowerCase().includes(med.toLowerCase())
    );

    return found;
  }

  extractContraindications(text) {
    const contraindicationPatterns = [
      /contraindicated?.*?(?:\.|$)/gi,
      /do not.*?(?:\.|$)/gi,
      /avoid.*?(?:\.|$)/gi,
      /should not.*?(?:\.|$)/gi,
    ];

    let contraindications = [];
    contraindicationPatterns.forEach((pattern) => {
      const matches = text.match(pattern) || [];
      contraindications.push(...matches);
    });

    return contraindications.slice(0, 5);
  }

  extractProcedures(text) {
    const procedureKeywords = [
      "intubation",
      "iv access",
      "cpr",
      "defibrillation",
      "cardioversion",
      "chest compression",
      "airway management",
      "ventilation",
    ];

    return procedureKeywords.filter((proc) =>
      text.toLowerCase().includes(proc.toLowerCase())
    );
  }

  extractVitalSigns(text) {
    const vitalPatterns = {
      heartRate: /(\d+)\s*bpm/gi,
      bloodPressure: /(\d+\/\d+)\s*mmhg/gi,
      temperature: /(\d+(?:\.\d+)?)\s*[°]?[cf]/gi,
      oxygenSat: /(\d+)%?\s*o2/gi,
    };

    let vitals = {};
    Object.keys(vitalPatterns).forEach((vital) => {
      const matches = text.match(vitalPatterns[vital]);
      if (matches) {
        vitals[vital] = matches.slice(0, 3);
      }
    });

    return vitals;
  }
}

module.exports = new DocumentParserService();