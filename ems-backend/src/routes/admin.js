const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const admin = require("firebase-admin");

// GET /api/admin/users - List all users (admin only)
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const listUsers = await admin.auth().listUsers(1000);
    const users = listUsers.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
      customClaims: user.customClaims || {},
    }));
    res.json(users);
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/admin/users/promote - Promote user to admin
router.post(
  "/users/promote",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { uid, role } = req.body;

      if (!uid || !role) {
        return res.status(400).json({ error: "UID and role are required" });
      }

      const customClaims = {
        role: role,
        permissions: {
          read: true,
          write: role === "admin",
          ai_query: true,
          user_management: role === "admin",
        },
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);
      res.json({
        message: `User promoted to ${role} successfully`,
        customClaims,
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ error: "Failed to promote user" });
    }
  }
);

// POST /api/admin/users/revoke - Revoke admin privileges
router.post(
  "/users/revoke",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { uid } = req.body;

      if (!uid) {
        return res.status(400).json({ error: "UID is required" });
      }

      const customClaims = {
        role: "patient",
        permissions: {
          read: true,
          write: false,
          ai_query: true,
          user_management: false,
        },
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);
      res.json({
        message: "Admin privileges revoked successfully",
        customClaims,
      });
    } catch (error) {
      console.error("Error revoking privileges:", error);
      res.status(500).json({ error: "Failed to revoke privileges" });
    }
  }
);

module.exports = router;
