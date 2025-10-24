const express = require('express');
const router = express.Router();

// Impor semua controller
const generateController = require('../controllers/generateController');
const translateController = require('../controllers/translateController');
const validationController = require('../controllers/validationController'); // <-- TAMBAKAN INI

// Generate endpoints
router.post('/generate', generateController.generateDraft);
router.get('/download/:filename', generateController.downloadDraft);

// Translation endpoints
router.post('/translate', translateController.translateDoc);

// Validation endpoints
router.post('/validate', validationController.validateDoc); // <-- TAMBAKAN INI

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API berjalan normal' });
});

module.exports = router;