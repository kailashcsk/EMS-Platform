const pool = require("../config/database");
const s3Service = require("../services/s3Service");

class MedicationController {
  // Get all medications
  async getAllMedications(req, res) {
    try {
      const { department_id } = req.query;

      let query = `
        SELECT m.*, d.name as department_name 
        FROM medications m 
        JOIN departments d ON m.department_id = d.id
      `;
      let params = [];

      if (department_id) {
        query += " WHERE m.department_id = $1";
        params.push(department_id);
      }

      query += " ORDER BY m.name";

      const result = await pool.query(query, params);
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medications",
      });
    }
  }

  // Get medication by ID
  async getMedicationById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT m.*, d.name as department_name 
        FROM medications m 
        JOIN departments d ON m.department_id = d.id 
        WHERE m.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Medication not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error fetching medication:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication",
      });
    }
  }

  // Create new medication
  async createMedication(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { name, department_id, use_case, description_summary } = req.body;

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
            "medications"
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
        INSERT INTO medications (name, department_id, use_case, description_summary, file_url, file_name)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(query, [
        name,
        department_id,
        use_case,
        description_summary,
        fileUrl,
        fileName,
      ]);

      await client.query("COMMIT");
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Medication created successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating medication:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create medication",
      });
    } finally {
      client.release();
    }
  }

  // Update medication
  async updateMedication(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { name, department_id, use_case, description_summary } = req.body;

      // Check if medication exists
      const existingQuery = "SELECT * FROM medications WHERE id = $1";
      const existingResult = await client.query(existingQuery, [id]);

      if (existingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Medication not found",
        });
      }

      const existingMedication = existingResult.rows[0];
      let fileUrl = existingMedication.file_url;
      let fileName = existingMedication.file_name;

      // Handle new file upload
      if (req.file) {
        try {
          // Delete old file if it exists
          if (existingMedication.file_url) {
            await s3Service.deleteFile(existingMedication.file_url);
          }

          // Upload new file
          fileUrl = await s3Service.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "medications"
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
        UPDATE medications 
        SET name = $1, department_id = $2, use_case = $3, description_summary = $4,
            file_url = $5, file_name = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        name || existingMedication.name,
        department_id || existingMedication.department_id,
        use_case !== undefined ? use_case : existingMedication.use_case,
        description_summary !== undefined
          ? description_summary
          : existingMedication.description_summary,
        fileUrl,
        fileName,
        id,
      ]);

      await client.query("COMMIT");
      res.json({
        success: true,
        data: result.rows[0],
        message: "Medication updated successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating medication:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update medication",
      });
    } finally {
      client.release();
    }
  }

  // Delete medication
  async deleteMedication(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;

      // Get medication to delete associated file and check for related doses
      const medicationQuery = `
        SELECT m.*, 
               (SELECT COUNT(*) FROM medication_doses WHERE medication_id = m.id) as dose_count
        FROM medications m 
        WHERE m.id = $1
      `;
      const medicationResult = await client.query(medicationQuery, [id]);

      if (medicationResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Medication not found",
        });
      }

      const medication = medicationResult.rows[0];

      // Check if medication has related doses
      if (parseInt(medication.dose_count) > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: `Cannot delete medication. It has ${medication.dose_count} medication doses. Delete related doses first.`,
          details: {
            dose_count: parseInt(medication.dose_count),
          },
        });
      }

      // Delete from database first
      const deleteQuery = "DELETE FROM medications WHERE id = $1 RETURNING *";
      const result = await client.query(deleteQuery, [id]);

      // Delete file from S3 if it exists
      if (medication.file_url) {
        try {
          await s3Service.deleteFile(medication.file_url);
        } catch (s3Error) {
          console.error("Error deleting file from S3:", s3Error);
          // Don't rollback database transaction for S3 errors
        }
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        data: result.rows[0],
        message: "Medication deleted successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting medication:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete medication",
      });
    } finally {
      client.release();
    }
  }
}

module.exports = new MedicationController();
