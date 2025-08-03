const express = require("express");
const router = express.Router();
const medicationDoseController = require("../controllers/medicationDoseController");

// GET /api/medication-doses/search?q=term - Search doses
router.get("/search", medicationDoseController.searchDoses);

// GET /api/medication-doses/analysis/routes - Get dosing summary by route
router.get("/analysis/routes", medicationDoseController.getDosingByRoute);

// GET /api/medication-doses/protocol/:protocol_id - Get all doses for a protocol
router.get("/protocol/:protocol_id", medicationDoseController.getProtocolDoses);

// GET /api/medication-doses/medication/:medication_id - Get all protocols using a medication
router.get(
  "/medication/:medication_id",
  medicationDoseController.getMedicationUsage
);

// GET /api/medication-doses - Get all medication doses
router.get("/", medicationDoseController.getAllMedicationDoses);

// GET /api/medication-doses/:id - Get medication dose by ID
router.get("/:id", medicationDoseController.getMedicationDoseById);

// POST /api/medication-doses - Create new medication dose
router.post("/", medicationDoseController.createMedicationDose);

// PUT /api/medication-doses/:id - Update medication dose
router.put("/:id", medicationDoseController.updateMedicationDose);

// DELETE /api/medication-doses/:id - Delete medication dose
router.delete("/:id", medicationDoseController.deleteMedicationDose);

module.exports = router;