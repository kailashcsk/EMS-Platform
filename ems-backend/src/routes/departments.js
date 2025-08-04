const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const {
  authenticateToken,
  requireWritePermission,
} = require("../middleware/auth");

// GET /api/departments - Get all departments
router.get("/", authenticateToken, departmentController.getAllDepartments);

// GET /api/departments/:id - Get department by ID
router.get("/:id", authenticateToken, departmentController.getDepartmentById);

// POST /api/departments - Create new department
router.post(
  "/",
  authenticateToken,
  requireWritePermission,
  departmentController.createDepartment
);

// PUT /api/departments/:id - Update department
router.put("/:id", authenticateToken, requireWritePermission, departmentController.updateDepartment);

// DELETE /api/departments/:id - Delete department
router.delete('/:id', authenticateToken, requireWritePermission, departmentController.deleteDepartment);

module.exports = router;