const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const departmentRoutes = require("./src/routes/departments");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "EMS Backend Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/departments", departmentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EMS Backend Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Departments API: http://localhost:${PORT}/api/departments`);
});
