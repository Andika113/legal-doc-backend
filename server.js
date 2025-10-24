const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Buat folder output jika belum ada
['uploads', 'output'].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Terjadi kesalahan pada server',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST /api/generate - Generate draft perjanjian`);
  console.log(`   POST /api/translate - Translate dokumen`);
  console.log(`   POST /api/validate - Validasi dokumen`); // <-- TAMBAHKAN BARIS INI
  console.log(`   GET  /api/download/:filename - Download hasil`);
});

module.exports = app;