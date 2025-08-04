const express = require("express");
const router = express.Router();
const protocolController = require("../controllers/protocolController");
const upload = require("../middleware/upload");
const {
  authenticateToken,
  requireWritePermission,
} = require("../middleware/auth");

// GET /api/protocols - Get all protocols
router.get("/", authenticateToken, protocolController.getAllProtocols);

// GET /api/protocols/:id - Get protocol by ID
router.get("/:id", authenticateToken, protocolController.getProtocolById);

// POST /api/protocols - Create new protocol (with optional file upload)
router.post("/", authenticateToken, requireWritePermission, upload.single("file"), protocolController.createProtocol);

// PUT /api/protocols/:id - Update protocol (with optional file upload)
router.put("/:id", authenticateToken, requireWritePermission, upload.single("file"), protocolController.updateProtocol);

// DELETE /api/protocols/:id - Delete protocol
router.delete("/:id", authenticateToken, requireWritePermission, protocolController.deleteProtocol);

module.exports = router;
