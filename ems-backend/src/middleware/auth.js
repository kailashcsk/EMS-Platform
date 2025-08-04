const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "patient",
      permissions: decodedToken.permissions || {
        read: true,
        write: false,
        ai_query: true,
        user_management: false,
      },
    };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(403).json({ error: "Invalid token" });
  }
};

const requireWritePermission = (req, res, next) => {
  if (!req.user?.permissions?.write) {
    return res.status(403).json({ error: "Write permission required" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required for this operation.",
    });
  }
  next();
};

module.exports = { authenticateToken, requireWritePermission, requireAdmin };
