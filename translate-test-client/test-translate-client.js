// File: test-translate-client.js
// Express.js Client untuk Testing Translate API

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'temp-uploads/' });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ========== KONFIGURASI ==========
const BACKEND_URL = 'http://localhost:3000'; // URL backend translate Anda
const TRANSLATE_ENDPOINT = `${BACKEND_URL}/api/translate`;

// ========== ROUTE UNTUK TESTING ==========

// Homepage - Form Upload
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Translate API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          border-bottom: 3px solid #4CAF50;
          padding-bottom: 10px;
        }
        .test-section {
          margin: 30px 0;
          padding: 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
        }
        .test-section h2 {
          color: #4CAF50;
          margin-top: 0;
        }
        label {
          display: block;
          margin: 15px 0 5px;
          font-weight: bold;
          color: #555;
        }
        input[type="file"],
        input[type="text"],
        textarea,
        select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          box-sizing: border-box;
        }
        textarea {
          min-height: 100px;
          font-family: monospace;
        }
        button {
          background: #4CAF50;
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
        }
        button:hover {
          background: #45a049;
        }
        .result {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-left: 4px solid #4CAF50;
          border-radius: 5px;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 12px;
        }
        .error {
          border-left-color: #f44336;
          background: #ffebee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔄 Test Translate API Client</h1>
        
        <!-- TEST 1: Upload File -->
        <div class="test-section">
          <h2>📄 Test 1: Upload File</h2>
          <form action="/test/upload-file" method="POST" enctype="multipart/form-data">
            <label>File (PDF, DOCX, TXT):</label>
            <input type="file" name="file" required>
            
            <label>Target Language:</label>
            <select name="targetLang">
              <option value="ko">Korea (한국어)</option>
              <option value="en">English</option>
              <option value="id" selected>Indonesia</option>
            </select>
            
            <label>Output Format:</label>
            <select name="format">
              <option value="docx" selected>DOCX</option>
              <option value="pdf">PDF</option>
            </select>
            
            <button type="submit">🚀 Test Upload File</button>
          </form>
        </div>

        <!-- TEST 2: Translate Text -->
        <div class="test-section">
          <h2>📝 Test 2: Translate Text</h2>
          <form action="/test/translate-text" method="POST">
            <label>Text to Translate:</label>
            <textarea name="text" placeholder="Masukkan teks yang ingin diterjemahkan..." required>SURAT PERJANJIAN KERJA SAMA

Yang bertanda tangan di bawah ini:

PIHAK PERTAMA
Nama: PT Maju Bersama
Alamat: Jl. Sudirman No. 123, Jakarta Selatan

PIHAK KEDUA  
Nama: CV Karya Mandiri
Alamat: Jl. Gatot Subroto No. 45, Bandung

Telah sepakat untuk mengadakan kerja sama...</textarea>
            
            <label>Target Language:</label>
            <select name="targetLang">
              <option value="ko" selected>Korea (한국어)</option>
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
            
            <label>Output Format:</label>
            <select name="format">
              <option value="docx" selected>DOCX</option>
              <option value="pdf">PDF</option>
            </select>
            
            <button type="submit">🚀 Test Translate Text</button>
          </form>
        </div>

        <!-- TEST 3: Translate via Query -->
        <div class="test-section">
          <h2>💬 Test 3: Translate via Query</h2>
          <form action="/test/translate-query" method="POST">
            <label>Query/Prompt:</label>
            <input type="text" name="query" 
                   placeholder="Contoh: Translate dokumen perjanjian sewa menyewa..." 
                   value="Translate dokumen perjanjian sewa menyewa properti antara PT ABC dengan Tuan Budi Santoso"
                   required>
            
            <label>Target Language:</label>
            <select name="targetLang">
              <option value="ko" selected>Korea (한국어)</option>
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
            
            <label>Output Format:</label>
            <select name="format">
              <option value="docx" selected>DOCX</option>
              <option value="pdf">PDF</option>
            </select>
            
            <button type="submit">🚀 Test Translate Query</button>
          </form>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ========== TEST ENDPOINTS ==========

// Test 1: Upload File
app.post('/test/upload-file', upload.single('file'), async (req, res) => {
  try {
    const { targetLang, format } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).send('❌ No file uploaded');
    }

    console.log('📤 Sending file to backend...');
    console.log('File:', file.originalname);
    console.log('Target:', targetLang);
    console.log('Format:', format);

    // Buat FormData untuk kirim file
    const formData = new FormData();
    
    // ✅ Field name sesuai backend: 'fileToTranslate'
    formData.append('fileToTranslate', fs.createReadStream(file.path), file.originalname);
    formData.append('targetLang', targetLang);
    formData.append('format', format);

    // Kirim ke backend
    const response = await axios.post(TRANSLATE_ENDPOINT, formData, {
      headers: formData.getHeaders(),
      timeout: 300000 // 5 menit
    });

    // Hapus file temporary
    fs.unlinkSync(file.path);

    // Tampilkan hasil
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Result</title>
        <style>
          body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; }
          .result { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          pre { background: #f5f5f5; padding: 15px; overflow-x: auto; border-radius: 5px; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ TEST BERHASIL!</h1>
          <div class="result">
            <h3>📊 Response dari Backend:</h3>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          </div>
          <div class="result">
            <h3>📝 Preview Hasil (300 karakter pertama):</h3>
            <p>${response.data.data?.translatedText?.substring(0, 300) || 'N/A'}...</p>
          </div>
          <div class="result">
            <h3>📁 File Output:</h3>
            <p>${response.data.data?.file || 'N/A'}</p>
          </div>
          <p><a href="/">← Kembali ke Test Form</a></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Hapus file temporary jika ada error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Error</title>
        <style>
          body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; }
          .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; }
          pre { background: #fff; padding: 15px; overflow-x: auto; border: 1px solid #ddd; }
          a { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ TEST GAGAL!</h1>
          <h3>Error Message:</h3>
          <pre>${error.message}</pre>
          <h3>Response:</h3>
          <pre>${error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data'}</pre>
          <p><a href="/">← Kembali ke Test Form</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Test 2: Translate Text
app.post('/test/translate-text', async (req, res) => {
  try {
    const { text, targetLang, format } = req.body;

    console.log('📤 Sending text to backend...');
    console.log('Text length:', text.length);
    console.log('Target:', targetLang);

    const response = await axios.post(TRANSLATE_ENDPOINT, {
      text,
      targetLang,
      format
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 120000
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Result</title>
        <style>
          body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; }
          .result { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          pre { background: #f5f5f5; padding: 15px; overflow-x: auto; white-space: pre-wrap; }
          a { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ TRANSLATE TEXT BERHASIL!</h1>
          <div class="result">
            <h3>📊 Full Response:</h3>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          </div>
          <div class="result">
            <h3>📝 Hasil Translate:</h3>
            <pre>${response.data.data?.translatedText || 'N/A'}</pre>
          </div>
          <p><a href="/">← Kembali ke Test Form</a></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.message}</pre>
      <pre>${JSON.stringify(error.response?.data, null, 2)}</pre>
      <a href="/">← Back</a>
    `);
  }
});

// Test 3: Translate Query
app.post('/test/translate-query', async (req, res) => {
  try {
    const { query, targetLang, format } = req.body;

    console.log('📤 Sending query to backend...');
    console.log('Query:', query);

    const response = await axios.post(TRANSLATE_ENDPOINT, {
      query,
      targetLang,
      format
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 120000
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Result</title>
        <style>
          body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; }
          .result { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          pre { background: #f5f5f5; padding: 15px; overflow-x: auto; white-space: pre-wrap; }
          a { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ TRANSLATE QUERY BERHASIL!</h1>
          <div class="result">
            <h3>📊 Response:</h3>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          </div>
          <p><a href="/">← Kembali ke Test Form</a></p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.message}</pre>
      <a href="/">← Back</a>
    `);
  }
});

// ========== START SERVER ==========
const PORT = 4000; // Port berbeda dari backend
app.listen(PORT, () => {
  console.log('');
  console.log('════════════════════════════════════════');
  console.log('   🚀 Test Client Server Running');
  console.log('════════════════════════════════════════');
  console.log(`   📍 Local: http://localhost:${PORT}`);
  console.log(`   🎯 Backend: ${BACKEND_URL}`);
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('📝 Buka browser dan akses:');
  console.log(`   http://localhost:${PORT}`);
  console.log('');
});