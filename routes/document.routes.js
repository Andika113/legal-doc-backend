// File: routes/document.routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { translateDocument } = require('../controllers/document.controller.js');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Asumsi middleware ini ada

const router = express.Router();

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { 
    const extension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extension);
  }
});
// Hanya menerima 1 file dengan nama field 'fileToTranslate'
const upload = multer({ storage: storage }).single('fileToTranslate');

// === Translate API ===
router.post('/translate', isAuthenticated, upload, translateDocument);

// Nonaktifkan rute lain
router.post('/generate', (req, res) => res.status(501).json({ error: 'Fitur dinonaktifkan.' }));
router.post('/validate', (req, res) => res.status(501).json({ error: 'Fitur dinonaktifkan.' }));

module.exports = router;