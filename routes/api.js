// File: routes/api.js (VERSI PERBAIKAN)

const express = require('express');
const router = express.Router();
const multer = require('multer'); // 1. Tambahkan Multer
const path = require('path');
const fs = require('fs'); // Diperlukan untuk Multer

// 2. Impor controller yang Anda gunakan
// (Pastikan nama file dan fungsi sesuai dengan struktur Anda)
const generateController = require('../controllers/generateController');
const translateController = require('../controllers/translateController');
const validationController = require('../controllers/validationController');
// 3. Impor middleware autentikasi Anda
// const { isAuthenticated } = require('../middlewares/authMiddleware'); // 🚨 NONAKTIFKAN SEMENTARA UNTUK TES

// --- Konfigurasi Multer (Pindahkan dari document.routes.js) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { 
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath); 
  },
  filename: function (req, file, cb) { 
    const extension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + extension);
  }
});

// Middleware Multer untuk file tunggal
const upload = multer({ storage: storage }).single('fileToTranslate');
// Middleware Multer untuk file ganda (validasi)
const uploadFields = multer({ storage: storage }).fields([{ name: 'file1' }, { name: 'file2' }]);

// === Translation endpoints ===
// 4. Terapkan middleware 'upload' di sini
// 🚨 KITA HILANGKAN 'isAuthenticated' SEMENTARA UNTUK MEMASTIKAN FUNGSI INTI BERJALAN
router.post('/translate', upload, translateController.translateDoc);

// === Generate endpoints ===
router.post('/generate', generateController.generateDraft);
router.get('/download/:filename', generateController.downloadDraft);

// === Validation endpoints ===
router.post('/validate', uploadFields, validationController.validateDoc);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API berjalan normal' });
});

module.exports = router;