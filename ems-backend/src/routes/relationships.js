const express = require("express");
const router = express.Router();
const relationshipController = require("../controllers/relationshipController");
const {
  authenticateToken,
  requireWritePermission,
} = require("../middleware/auth");

// GET /api/relationships/protocols/:id/medications - Get protocol with all medications
router.get(
  "/protocols/:id/medications",
  authenticateToken,
  relationshipController.getProtocolWithMedications
);

// GET /api/relationships/medications/:id/protocols - Get medication with all protocols
router.get(
  "/medications/:id/protocols",
  authenticateToken,
  relationshipController.getMedicationWithProtocols
);

// GET /api/relationships/departments/:id/overview - Get complete department overview
router.get(
  "/departments/:id/overview",
  authenticateToken,
  relationshipController.getDepartmentOverview
);

module.exports = router;
