const express = require("express");
const router = express.Router();
const protocolController = require("../controllers/protocolController");
const upload = require("../middleware/upload");

// GET /api/protocols - Get all protocols
router.get("/", protocolController.getAllProtocols);

// GET /api/protocols/:id - Get protocol by ID
router.get("/:id", protocolController.getProtocolById);

// POST /api/protocols - Create new protocol (with optional file upload)
router.post("/", upload.single("file"), protocolController.createProtocol);

// PUT /api/protocols/:id - Update protocol (with optional file upload)
router.put("/:id", upload.single("file"), protocolController.updateProtocol);

// DELETE /api/protocols/:id - Delete protocol
router.delete("/:id", protocolController.deleteProtocol);

module.exports = router;
