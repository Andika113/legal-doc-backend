const { getContextFromRAG } = require('../services/ragService');
const { generateLegalDraft } = require('../services/geminiService'); // Hanya impor generateLegalDraft
const documentStyler = require('../services/documentStyler');
const path = require('path');

exports.generateDraft = async (req, res) => {
  try {
    // Hapus 'textToValidate' dan tambahkan 'targetLang'
    const { query, format = 'docx', docType = 'surat_perjanjian', targetLang = 'id' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query diperlukan' });
    }

    console.log(`🔍 Mencari konteks dari RAG... (Tipe: ${docType})`);
    const context = await getContextFromRAG(query);
    console.log(`📚 Konteks ditemukan: ${context}`);


    console.log(`✍️ Generate draft dengan Gemini... (Bahasa: ${targetLang})`);
    
    // Panggilan fungsi sekarang lebih bersih dan menyertakan targetLang
    const draftText = await generateLegalDraft(query, context, docType, targetLang);

    // Generate dokumen dengan styling
    const timestamp = Date.now();
    let filePath;

    if (format === 'pdf') {
      filePath = await documentStyler.generatePDF(
        draftText,
        path.join('output', `draft_${timestamp}.pdf`)
      );
    } else {
      filePath = await documentStyler.generateDOCX(
        draftText,
        path.join('output', `draft_${timestamp}.docx`)
      );
    }

    res.json({
      success: true,
      message: 'Draft berhasil dibuat',
      data: {
        text: draftText,
        file: filePath,
        format: format
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Gagal generate draft',
      details: error.message
    });
  }
};

exports.downloadDraft = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('output', filename);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading:', err);
        res.status(404).json({ error: 'File tidak ditemukan' });
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Gagal download file' });
  }
};