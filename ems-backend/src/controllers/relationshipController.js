const pool = require("../config/database");

class RelationshipController {
  // Get protocol with all medications and doses
  async getProtocolWithMedications(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.*,
          d.name as department_name,
          json_agg(
            CASE 
              WHEN md.id IS NOT NULL THEN
                json_build_object(
                  'dose_id', md.id,
                  'medication_id', m.id,
                  'medication_name', m.name,
                  'medication_use_case', m.use_case,
                  'amount', md.amount,
                  'route', md.route,
                  'frequency', md.frequency,
                  'notes', md.notes
                )
              ELSE NULL
            END
          ) FILTER (WHERE md.id IS NOT NULL) as medications
        FROM protocols p
        JOIN departments d ON p.department_id = d.id
        LEFT JOIN medication_doses md ON p.id = md.protocol_id
        LEFT JOIN medications m ON md.medication_id = m.id
        WHERE p.id = $1
        GROUP BY p.id, d.name
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
      console.error("Error fetching protocol with medications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch protocol details",
      });
    }
  }

  // Get medication with all protocols that use it
  async getMedicationWithProtocols(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          m.*,
          d.name as department_name,
          json_agg(
            CASE 
              WHEN md.id IS NOT NULL THEN
                json_build_object(
                  'dose_id', md.id,
                  'protocol_id', p.id,
                  'protocol_name', p.name,
                  'protocol_description', p.description_summary,
                  'amount', md.amount,
                  'route', md.route,
                  'frequency', md.frequency,
                  'notes', md.notes
                )
              ELSE NULL
            END
          ) FILTER (WHERE md.id IS NOT NULL) as protocols
        FROM medications m
        JOIN departments d ON m.department_id = d.id
        LEFT JOIN medication_doses md ON m.id = md.medication_id
        LEFT JOIN protocols p ON md.protocol_id = p.id
        WHERE m.id = $1
        GROUP BY m.id, d.name
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
      console.error("Error fetching medication with protocols:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication details",
      });
    }
  }

  // Get complete department overview
  async getDepartmentOverview(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          d.*,
          (
            SELECT json_agg(
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description_summary', p.description_summary,
                'file_url', p.file_url,
                'created_at', p.created_at
              )
            )
            FROM protocols p 
            WHERE p.department_id = d.id
          ) as protocols,
          (
            SELECT json_agg(
              json_build_object(
                'id', m.id,
                'name', m.name,
                'use_case', m.use_case,
                'description_summary', m.description_summary,
                'file_url', m.file_url,
                'created_at', m.created_at
              )
            )
            FROM medications m 
            WHERE m.department_id = d.id
          ) as medications,
          (
            SELECT COUNT(*) FROM protocols WHERE department_id = d.id
          ) as protocol_count,
          (
            SELECT COUNT(*) FROM medications WHERE department_id = d.id
          ) as medication_count
        FROM departments d
        WHERE d.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error fetching department overview:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department overview",
      });
    }
  }
}

module.exports = new RelationshipController();
