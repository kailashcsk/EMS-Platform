const pool = require("../config/database");

class DepartmentController {
  // Get all departments
  async getAllDepartments(req, res) {
    try {
      const query = "SELECT * FROM departments ORDER BY name";
      const result = await pool.query(query);
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch departments",
      });
    }
  }

  // Get department by ID
  async getDepartmentById(req, res) {
    try {
      const { id } = req.params;
      const query = "SELECT * FROM departments WHERE id = $1";
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
      console.error("Error fetching department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch department",
      });
    }
  }

  // Create new department
  async createDepartment(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Name is required",
        });
      }

      const query = `
        INSERT INTO departments (name, description)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await pool.query(query, [name, description]);
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Department created successfully",
      });
    } catch (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return res.status(400).json({
          success: false,
          error: "Department name already exists",
        });
      }
      console.error("Error creating department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create department",
      });
    }
  }
  // Update department
  async updateDepartment(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Check if department exists first
      const checkQuery = "SELECT * FROM departments WHERE id = $1";
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      // Simple approach - update both fields if provided
      let query;
      let values;

      if (name && description) {
        query = `
        UPDATE departments 
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
        values = [name, description, id];
      } else if (name) {
        query = `
        UPDATE departments 
        SET name = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
        values = [name, id];
      } else if (description) {
        query = `
        UPDATE departments 
        SET description = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
        values = [description, id];
      } else {
        return res.status(400).json({
          success: false,
          error: "No fields to update",
        });
      }

      const result = await pool.query(query, values);

      res.json({
        success: true,
        data: result.rows[0],
        message: "Department updated successfully",
      });
    } catch (error) {
      console.error("Error updating department:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Department name already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to update department",
        details: error.message,
      });
    }
  }
  
  // Delete department
  async deleteDepartment(req, res) {
    try {
      const { id } = req.params;

      // Check if department exists
      const checkQuery = "SELECT * FROM departments WHERE id = $1";
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Department not found",
        });
      }

      // Check if department has related protocols or medications
      const relatedQuery = `
        SELECT 
          (SELECT COUNT(*) FROM protocols WHERE department_id = $1) as protocol_count,
          (SELECT COUNT(*) FROM medications WHERE department_id = $1) as medication_count
      `;
      const relatedResult = await pool.query(relatedQuery, [id]);
      const { protocol_count, medication_count } = relatedResult.rows[0];

      if (parseInt(protocol_count) > 0 || parseInt(medication_count) > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete department. It has ${protocol_count} protocols and ${medication_count} medications. Delete related items first.`,
          details: {
            protocol_count: parseInt(protocol_count),
            medication_count: parseInt(medication_count),
          },
        });
      }

      // Delete department
      const deleteQuery = "DELETE FROM departments WHERE id = $1 RETURNING *";
      const result = await pool.query(deleteQuery, [id]);

      res.json({
        success: true,
        data: result.rows[0],
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete department",
      });
    }
  }
}



module.exports = new DepartmentController();
