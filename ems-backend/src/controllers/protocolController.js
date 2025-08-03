const pool = require("../config/database");
const s3Service = require("../services/s3Service");

class ProtocolController {
  // Get all protocols
  async getAllProtocols(req, res) {
    try {
      const { department_id } = req.query;

      let query = `
        SELECT p.*, d.name as department_name 
        FROM protocols p 
        JOIN departments d ON p.department_id = d.id
      `;
      let params = [];

      if (department_id) {
        query += " WHERE p.department_id = $1";
        params.push(department_id);
      }

      query += " ORDER BY p.created_at DESC";

      const result = await pool.query(query, params);
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching protocols:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch protocols",
      });
    }
  }

  // Get protocol by ID
  async getProtocolById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT p.*, d.name as department_name 
        FROM protocols p 
        JOIN departments d ON p.department_id = d.id 
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Protocol not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error fetching protocol:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch protocol",
      });
    }
  }

  // Create new protocol
  async createProtocol(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { name, department_id, description_summary } = req.body;

      if (!name || !department_id) {
        return res.status(400).json({
          success: false,
          error: "Name and department_id are required",
        });
      }

      // Check if department exists
      const deptCheck = await client.query(
        "SELECT id FROM departments WHERE id = $1",
        [department_id]
      );
      if (deptCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: "Department not found",
        });
      }

      let fileUrl = null;
      let fileName = null;

      // Handle file upload if present
      if (req.file) {
        try {
          fileUrl = await s3Service.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "protocols"
          );
          fileName = req.file.originalname;
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          await client.query("ROLLBACK");
          return res.status(500).json({
            success: false,
            error: "Failed to upload file",
          });
        }
      }

      const query = `
        INSERT INTO protocols (name, department_id, description_summary, file_url, file_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await client.query(query, [
        name,
        department_id,
        description_summary,
        fileUrl,
        fileName,
      ]);

      await client.query("COMMIT");
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Protocol created successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating protocol:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create protocol",
      });
    } finally {
      client.release();
    }
  }

  // Update protocol
  async updateProtocol(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { name, department_id, description_summary } = req.body;

      // Check if protocol exists
      const existingQuery = "SELECT * FROM protocols WHERE id = $1";
      const existingResult = await client.query(existingQuery, [id]);

      if (existingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Protocol not found",
        });
      }

      const existingProtocol = existingResult.rows[0];
      let fileUrl = existingProtocol.file_url;
      let fileName = existingProtocol.file_name;

      // Handle new file upload
      if (req.file) {
        try {
          // Delete old file if it exists
          if (existingProtocol.file_url) {
            await s3Service.deleteFile(existingProtocol.file_url);
          }

          // Upload new file
          fileUrl = await s3Service.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "protocols"
          );
          fileName = req.file.originalname;
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          await client.query("ROLLBACK");
          return res.status(500).json({
            success: false,
            error: "Failed to upload file",
          });
        }
      }

      const updateQuery = `
        UPDATE protocols 
        SET name = $1, department_id = $2, description_summary = $3, 
            file_url = $4, file_name = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        name || existingProtocol.name,
        department_id || existingProtocol.department_id,
        description_summary !== undefined
          ? description_summary
          : existingProtocol.description_summary,
        fileUrl,
        fileName,
        id,
      ]);

      await client.query("COMMIT");
      res.json({
        success: true,
        data: result.rows[0],
        message: "Protocol updated successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating protocol:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update protocol",
      });
    } finally {
      client.release();
    }
  }

  // Delete protocol
  async deleteProtocol(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;

      // Get protocol to delete associated file and check for related medication doses
      const protocolQuery = `
        SELECT p.*, 
               (SELECT COUNT(*) FROM medication_doses WHERE protocol_id = p.id) as dose_count
        FROM protocols p 
        WHERE p.id = $1
      `;
      const protocolResult = await client.query(protocolQuery, [id]);

      if (protocolResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Protocol not found",
        });
      }

      const protocol = protocolResult.rows[0];

      // Check if protocol has related medication doses
      if (parseInt(protocol.dose_count) > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: `Cannot delete protocol. It has ${protocol.dose_count} medication doses. Delete related doses first.`,
          details: {
            dose_count: parseInt(protocol.dose_count),
          },
        });
      }

      // Delete from database first
      const deleteQuery = "DELETE FROM protocols WHERE id = $1 RETURNING *";
      const result = await client.query(deleteQuery, [id]);

      // Delete file from S3 if it exists
      if (protocol.file_url) {
        try {
          await s3Service.deleteFile(protocol.file_url);
        } catch (s3Error) {
          console.error("Error deleting file from S3:", s3Error);
          // Don't rollback database transaction for S3 errors
        }
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        data: result.rows[0],
        message: "Protocol deleted successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting protocol:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete protocol",
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new ProtocolController();
