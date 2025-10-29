// File: controllers/translateController.js (UPDATED - SUPPORT FILE UPLOAD)

const { translateDocument } = require('../services/translationService');
const { extractTextFromFile } = require('../utils/fileUtils'); // Import file extractor
const documentStyler = require('../services/documentStyler');
const fs = require('fs').promises;
const path = require('path');

exports.translateDoc = async (req, res) => {
  let cleanupFilePath = null; // Untuk cleanup file temporary
  
  try {
    const { text, targetLang = 'ko', format = 'docx' } = req.body;
    const uploadedFile = req.file; // File dari multer (jika ada)
    
    let contentToTranslate = '';
    let inputSource = 'unknown';
    console.log(uploadedFile)
    // Prioritas: File > Text
    if (uploadedFile) {
      // 📄 MODE 1: Upload File
      console.log(`📄 File diterima: ${uploadedFile.originalname}`);
      cleanupFilePath = uploadedFile.path;
      
      // Extract text dari file
      contentToTranslate = await extractTextFromFile(uploadedFile);
      inputSource = 'file';
      
      if (!contentToTranslate || contentToTranslate.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Gagal extract text dari file atau file kosong' 
        });
      }
      
    } else if (text && text.trim()) {
      // 📝 MODE 2: Text Langsung
      console.log(`📝 Text diterima (${text.length} characters)`);
      contentToTranslate = text;
      inputSource = 'text';
      
    } 
    // else {
    //   // ❌ Tidak ada input
    //   return res.status(400).json({ 
    //     error: 'Input diperlukan. Kirim file (fileToTranslate) atau text.' 
    //   });
    // }

    // Translate
    console.log(`🌐 Menerjemahkan ke bahasa: ${targetLang}`);
    console.log(`📊 Input source: ${inputSource}`);
    console.log(`📏 Content length: ${contentToTranslate.length} characters`);
    
    const paragraphs = contentToTranslate.split('\n');
    const result = await translateDocument(paragraphs, targetLang);

    const translatedText = result.translatedParagraphs.join('\n');
    
    // Generate dokumen output
    const timestamp = Date.now();
    let filePath;

    if (format === 'pdf') {
      filePath = await documentStyler.generatePDF(
        translatedText,
        path.join('output', `translated_${timestamp}.pdf`)
      );
    } else {
      filePath = await documentStyler.generateDOCX(
        translatedText,
        path.join('output', `translated_${timestamp}.docx`)
      );
    }

    // Cleanup file upload jika ada
    if (cleanupFilePath) {
      await fs.unlink(cleanupFilePath).catch(err => 
        console.error('⚠️  Gagal hapus file temporary:', err)
      );
    }

    // Response
    res.json({
      success: true,
      message: `Terjemahan dari ${inputSource} berhasil`,
      data: {
        translatedText,
        file: filePath,
        inputSource: inputSource,
        usedEngine: 'Gemini 2.0 Flash',
        stats: {
          totalChars: result.totalChars,
          estimatedCost: result.estimatedCost
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in translateDoc:', error);
    
    // Cleanup file jika ada error
    if (cleanupFilePath) {
      await fs.unlink(cleanupFilePath).catch(err => 
        console.error('⚠️  Gagal hapus file saat error:', err)
      );
    }
    
    res.status(500).json({
      error: 'Gagal translate dokumen',
      details: error.message
    });
  }
};