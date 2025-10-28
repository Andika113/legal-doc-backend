// File: controllers/document.controller.js
const { translateDocument } = require('../services/qwenService'); 
const documentStyler = require('../services/documentStyler');
const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth'); 

/**
 * Helper function untuk ekstrak teks dari file yang di-upload
 */
async function extractTextFromFile(file) {
  if (!file) { throw new Error('File tidak ditemukan'); }
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: file.path });
    return result.value;
  }
  // Hanya mendukung .docx untuk penyederhanaan
  throw new Error('Tipe file tidak didukung untuk ekstraksi teks.');
}


// === Hanya Fungsi Translate Dokumen ===
exports.translateDocument = async (req, res) => {
  try {
    const { fileToTranslate } = req; 
    const { text, query, targetLang = 'ko', format = 'docx' } = req.body;
    let inputSource = 'text';
    let contentToTranslate = '';

    // Logika input: File > Text > Prompt
    if (fileToTranslate) {
      contentToTranslate = await extractTextFromFile(fileToTranslate);
      inputSource = 'file';
    } else if (text && text.trim()) {
      contentToTranslate = text;
      inputSource = 'text';
    } else if (query && query.trim()) {
      contentToTranslate = query;
      inputSource = 'prompt';
    } else {
      return res.status(400).json({ error: 'Input terjemahan (file, teks, atau prompt) diperlukan.' });
    }

    if (!contentToTranslate) {
       return res.status(400).json({ error: 'Gagal mengekstrak konten terjemahan.' });
    }
    
    const paragraphs = contentToTranslate.split('\n');
    console.log(`🌐 Menerjemahkan (${inputSource}) ke ${targetLang} dengan Qwen (Sworn Translator)...`);
    
    const result = await translateDocument(paragraphs, targetLang); 

    const translatedText = result.translatedParagraphs.join('\n');
    
    // Generate dokumen terjemahan
    const timestamp = Date.now();
    const outputFilename = `translated_${timestamp}.${format}`;
    const outputPath = path.join('output', outputFilename);

    if (format === 'pdf') {
      await documentStyler.generatePDF(translatedText, outputPath);
    } else {
      await documentStyler.generateDOCX(translatedText, outputPath);
    }

    res.json({
      success: true,
      message: `Terjemahan dari ${inputSource} berhasil`,
      data: {
        translatedText,
        file: outputPath,
        stats: {
          totalChars: result.totalChars,
          estimatedCost: result.estimatedCost
        }
      }
    });

  } catch (error) {
    // Menghapus file yang diupload jika terjadi error
    if (req.file) { await fs.unlink(req.file.path); }
    console.error('❌ Error in translateDocument:', error);
    res.status(500).json({ error: 'Gagal translate dokumen', details: error.message });
  }
};

// Kosongkan exports lain (semua dinonaktifkan)
exports.generateDocument = (req, res) => res.status(501).json({ error: 'Fitur dinonaktifkan.' });
exports.validateDocument = (req, res) => res.status(501).json({ error: 'Fitur dinonaktifkan.' });