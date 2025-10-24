const { translateDocument } = require('../services/translationService');
const documentStyler = require('../services/documentStyler');
const { Document, Packer } = require('docx');
const fs = require('fs').promises;
const path = require('path');

exports.translateDoc = async (req, res) => {
  try {
    const { text, targetLang = 'ko', format = 'docx' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text diperlukan' });
    }

    console.log(`🌐 Menerjemahkan ke bahasa: ${targetLang}`);
    
    const paragraphs = text.split('\n');
    const result = await translateDocument(paragraphs, targetLang);

    const translatedText = result.translatedParagraphs.join('\n');
    
    // Generate dokumen terjemahan
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

    res.json({
      success: true,
      message: 'Terjemahan berhasil',
      data: {
        translatedText,
        file: filePath,
        stats: {
          totalChars: result.totalChars,
          estimatedCost: result.estimatedCost
        }
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Gagal translate dokumen',
      details: error.message
    });
  }
};