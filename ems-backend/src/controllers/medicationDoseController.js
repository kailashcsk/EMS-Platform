const pool = require("../config/database");

class MedicationDoseController {
  // Get all medication doses
  async getAllMedicationDoses(req, res) {
    try {
      const { protocol_id, medication_id } = req.query;

      let query = `
        SELECT 
          md.*,
          p.name as protocol_name,
          m.name as medication_name,
          d.name as department_name
        FROM medication_doses md
        JOIN protocols p ON md.protocol_id = p.id
        JOIN medications m ON md.medication_id = m.id
        JOIN departments d ON p.department_id = d.id
      `;
      let params = [];
      let conditions = [];

      if (protocol_id) {
        conditions.push(`md.protocol_id = $${params.length + 1}`);
        params.push(protocol_id);
      }

      if (medication_id) {
        conditions.push(`md.medication_id = $${params.length + 1}`);
        params.push(medication_id);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += " ORDER BY p.name, m.name";

      const result = await pool.query(query, params);
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching medication doses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication doses",
      });
    }
  }

  // Get medication dose by ID
  async getMedicationDoseById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          md.*,
          p.name as protocol_name,
          p.description_summary as protocol_description,
          m.name as medication_name,
          m.use_case as medication_use_case,
          d.name as department_name
        FROM medication_doses md
        JOIN protocols p ON md.protocol_id = p.id
        JOIN medications m ON md.medication_id = m.id
        JOIN departments d ON p.department_id = d.id
        WHERE md.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Medication dose not found",
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error fetching medication dose:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication dose",
      });
    }
  }

  // Create new medication dose
  async createMedicationDose(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { protocol_id, medication_id, amount, route, frequency, notes } =
        req.body;

      if (!protocol_id || !medication_id || !amount) {
        return res.status(400).json({
          success: false,
          error: "protocol_id, medication_id, and amount are required",
        });
      }

      // Check if protocol exists
      const protocolCheck = await client.query(
        "SELECT id FROM protocols WHERE id = $1",
        [protocol_id]
      );
      if (protocolCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: "Protocol not found",
        });
      }

      // Check if medication exists
      const medicationCheck = await client.query(
        "SELECT id FROM medications WHERE id = $1",
        [medication_id]
      );
      if (medicationCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: "Medication not found",
        });
      }

      // Check for unique constraint (protocol + medication + route)
      const uniqueCheck = await client.query(
        "SELECT id FROM medication_doses WHERE protocol_id = $1 AND medication_id = $2 AND route = $3",
        [protocol_id, medication_id, route || ""]
      );
      if (uniqueCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error:
            "This protocol already has a dose for this medication with the same route",
        });
      }

      const query = `
        INSERT INTO medication_doses (protocol_id, medication_id, amount, route, frequency, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(query, [
        protocol_id,
        medication_id,
        amount,
        route,
        frequency,
        notes,
      ]);

      await client.query("COMMIT");
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Medication dose created successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating medication dose:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create medication dose",
      });
    } finally {
      client.release();
    }
  }

  // Update medication dose
  async updateMedicationDose(req, res) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { id } = req.params;
      const { protocol_id, medication_id, amount, route, frequency, notes } =
        req.body;

      // Check if medication dose exists
      const existingQuery = "SELECT * FROM medication_doses WHERE id = $1";
      const existingResult = await client.query(existingQuery, [id]);

      if (existingResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Medication dose not found",
        });
      }

      const existingDose = existingResult.rows[0];

      // Check unique constraint if protocol, medication, or route is being changed
      const newProtocolId = protocol_id || existingDose.protocol_id;
      const newMedicationId = medication_id || existingDose.medication_id;
      const newRoute = route !== undefined ? route : existingDose.route;

      if (protocol_id || medication_id || route !== undefined) {
        const uniqueCheck = await client.query(
          "SELECT id FROM medication_doses WHERE protocol_id = $1 AND medication_id = $2 AND route = $3 AND id != $4",
          [newProtocolId, newMedicationId, newRoute || "", id]
        );
        if (uniqueCheck.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            error:
              "This protocol already has a dose for this medication with the same route",
          });
        }
      }

      const updateQuery = `
        UPDATE medication_doses 
        SET protocol_id = $1, medication_id = $2, amount = $3, route = $4, 
            frequency = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        newProtocolId,
        newMedicationId,
        amount || existingDose.amount,
        newRoute,
        frequency !== undefined ? frequency : existingDose.frequency,
        notes !== undefined ? notes : existingDose.notes,
        id,
      ]);

      await client.query("COMMIT");
      res.json({
        success: true,
        data: result.rows[0],
        message: "Medication dose updated successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating medication dose:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update medication dose",
      });
    } finally {
      client.release();
    }
  }

  // Delete medication dose
  async deleteMedicationDose(req, res) {
    try {
      const { id } = req.params;

      // Check if medication dose exists
      const checkQuery = "SELECT * FROM medication_doses WHERE id = $1";
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Medication dose not found",
        });
      }

      // Delete medication dose
      const deleteQuery =
        "DELETE FROM medication_doses WHERE id = $1 RETURNING *";
      const result = await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        data: result.rows[0],
        message: "Medication dose deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting medication dose:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete medication dose",
      });
    }
  }

  // Get all doses for a specific protocol with full details
  async getProtocolDoses(req, res) {
    try {
      const { protocol_id } = req.params;

      const query = `
        SELECT 
          p.id as protocol_id,
          p.name as protocol_name,
          p.description_summary as protocol_description,
          d.name as department_name,
          json_agg(
            json_build_object(
              'dose_id', md.id,
              'medication_id', m.id,
              'medication_name', m.name,
              'medication_use_case', m.use_case,
              'amount', md.amount,
              'route', md.route,
              'frequency', md.frequency,
              'notes', md.notes,
              'created_at', md.created_at
            ) ORDER BY m.name
          ) as medication_doses
        FROM protocols p
        JOIN departments d ON p.department_id = d.id
        LEFT JOIN medication_doses md ON p.id = md.protocol_id
        LEFT JOIN medications m ON md.medication_id = m.id
        WHERE p.id = $1
        GROUP BY p.id, p.name, p.description_summary, d.name
      `;

      const result = await pool.query(query, [protocol_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Protocol not found",
        });
      }

      // Filter out null medication doses if protocol has no doses
      const protocolData = result.rows[0];
      if (
        protocolData.medication_doses[0] &&
        protocolData.medication_doses[0].dose_id === null
      ) {
        protocolData.medication_doses = [];
      }

      res.json({
        success: true,
        data: protocolData,
      });
    } catch (error) {
      console.error("Error fetching protocol doses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch protocol doses",
      });
    }
  }

  // Get all protocols that use a specific medication
  async getMedicationUsage(req, res) {
    try {
      const { medication_id } = req.params;

      const query = `
        SELECT 
          m.id as medication_id,
          m.name as medication_name,
          m.use_case as medication_use_case,
          m.description_summary as medication_description,
          d.name as medication_department,
          json_agg(
            json_build_object(
              'dose_id', md.id,
              'protocol_id', p.id,
              'protocol_name', p.name,
              'protocol_description', p.description_summary,
              'protocol_department', dp.name,
              'amount', md.amount,
              'route', md.route,
              'frequency', md.frequency,
              'notes', md.notes,
              'created_at', md.created_at
            ) ORDER BY p.name
          ) as protocol_usage
        FROM medications m
        JOIN departments d ON m.department_id = d.id
        LEFT JOIN medication_doses md ON m.id = md.medication_id
        LEFT JOIN protocols p ON md.protocol_id = p.id
        LEFT JOIN departments dp ON p.department_id = dp.id
        WHERE m.id = $1
        GROUP BY m.id, m.name, m.use_case, m.description_summary, d.name
      `;

      const result = await pool.query(query, [medication_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Medication not found",
        });
      }

      // Filter out null protocol usage if medication has no usage
      const medicationData = result.rows[0];
      if (
        medicationData.protocol_usage[0] &&
        medicationData.protocol_usage[0].dose_id === null
      ) {
        medicationData.protocol_usage = [];
      }

      res.json({
        success: true,
        data: medicationData,
      });
    } catch (error) {
      console.error("Error fetching medication usage:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication usage",
      });
    }
  }

  // Get dosing summary by route (useful for EMS protocols)
  async getDosingByRoute(req, res) {
    try {
      const query = `
        SELECT 
          md.route,
          COUNT(*) as total_doses,
          json_agg(
            json_build_object(
              'protocol', p.name,
              'medication', m.name,
              'amount', md.amount,
              'frequency', md.frequency,
              'department', d.name
            ) ORDER BY p.name, m.name
          ) as dose_details
        FROM medication_doses md
        JOIN protocols p ON md.protocol_id = p.id
        JOIN medications m ON md.medication_id = m.id
        JOIN departments d ON p.department_id = d.id
        WHERE md.route IS NOT NULL AND md.route != ''
        GROUP BY md.route
        ORDER BY total_doses DESC
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows,
        summary: {
          total_routes: result.rows.length,
          most_common_route: result.rows[0]?.route || "No routes found",
        },
      });
    } catch (error) {
      console.error("Error fetching dosing by route:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dosing by route",
      });
    }
  }

  // Search doses by medication name or protocol name
  async searchDoses(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query parameter "q" is required',
        });
      }

      const query = `
        SELECT 
          md.*,
          p.name as protocol_name,
          m.name as medication_name,
          d.name as department_name,
          CASE 
            WHEN p.name ILIKE $1 THEN 'protocol'
            WHEN m.name ILIKE $1 THEN 'medication'
            ELSE 'other'
          END as match_type
        FROM medication_doses md
        JOIN protocols p ON md.protocol_id = p.id
        JOIN medications m ON md.medication_id = m.id
        JOIN departments d ON p.department_id = d.id
        WHERE p.name ILIKE $1 OR m.name ILIKE $1 OR md.notes ILIKE $1
        ORDER BY 
          CASE 
            WHEN p.name ILIKE $1 THEN 1
            WHEN m.name ILIKE $1 THEN 2
            ELSE 3
          END,
          p.name, m.name
      `;

      const searchTerm = `%${q}%`;
      const result = await pool.query(query, [searchTerm]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        search_term: q,
      });
    } catch (error) {
      console.error("Error searching doses:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search doses",
      });
    }
  }
}

module.exports = new MedicationDoseController();
