const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const upload = require("../middleware/upload");

// GET /api/medications - Get all medications
router.get("/", medicationController.getAllMedications);

// GET /api/medications/:id - Get medication by ID
router.get("/:id", medicationController.getMedicationById);

// POST /api/medications - Create new medication (with optional file upload)
router.post("/", upload.single("file"), medicationController.createMedication);

// PUT /api/medications/:id - Update medication (with optional file upload)
router.put(
  "/:id",
  upload.single("file"),
  medicationController.updateMedication
);

// DELETE /api/medications/:id - Delete medication
router.delete("/:id", medicationController.deleteMedication);

module.exports = router;
