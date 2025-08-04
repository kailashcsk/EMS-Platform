const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const upload = require("../middleware/upload");
const {
  authenticateToken,
  requireWritePermission,
} = require("../middleware/auth");


// GET /api/medications - Get all medications
router.get("/", authenticateToken, medicationController.getAllMedications);

// GET /api/medications/:id - Get medication by ID
router.get("/:id", authenticateToken, medicationController.getMedicationById);

// POST /api/medications - Create new medication (with optional file upload)
router.post("/", authenticateToken, requireWritePermission, upload.single("file"), medicationController.createMedication);

// PUT /api/medications/:id - Update medication (with optional file upload)
router.put(
  "/:id",
  authenticateToken,
  requireWritePermission,
  upload.single("file"),
  medicationController.updateMedication
);

// DELETE /api/medications/:id - Delete medication
router.delete("/:id", authenticateToken, requireWritePermission, medicationController.deleteMedication);

module.exports = router;
