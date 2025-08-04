const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const departmentRoutes = require("./src/routes/departments");
const protocolRoutes = require("./src/routes/protocols");
const medicationRoutes = require("./src/routes/medications");
const relationshipRoutes = require("./src/routes/relationships");
const medicationDoseRoutes = require("./src/routes/medicationDoses");
const aiRoutes = require("./src/routes/ai");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EMS Backend Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      departments: '/api/departments',
      protocols: '/api/protocols',
      medications: '/api/medications',
      'medication-doses': '/api/medication-doses',
      ai: '/api/ai'
    }
  });
});

// API routes
app.use("/api/departments", departmentRoutes);
app.use("/api/protocols", protocolRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/relationships", relationshipRoutes);
app.use("/api/medication-doses", medicationDoseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EMS Backend Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Departments API: http://localhost:${PORT}/api/departments`);
  console.log(`📄 Protocols API: http://localhost:${PORT}/api/protocols`);
  console.log(`💊 Medications API: http://localhost:${PORT}/api/medications`);
  console.log(
    `💉 Medication Doses API: http://localhost:${PORT}/api/medication-doses`
  );
  console.log(`🤖 AI Query API: http://localhost:${PORT}/api/ai`);
});
