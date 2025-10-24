const { validateDocument } = require('../services/geminiService');

exports.validateDoc = async (req, res) => {
  try {
    // Ambil data dari body
    // 'validationType' bisa 'review' atau 'comparison'
    const { query, validationType, docA, docB } = req.body;

    if (!query || !validationType || !docA) {
      return res.status(400).json({ 
        error: 'Input tidak lengkap. ' +
               'Dibutuhkan: query, validationType (\'review\' atau \'comparison\'), dan docA.' 
      });
    }
    
    // Untuk tipe comparison, docB juga wajib
    if (validationType === 'comparison' && !docB) {
      return res.status(400).json({ error: 'Untuk validasi perbandingan, docB wajib diisi.' });
    }

    console.log(`🔎 Memulai validasi... (Tipe: ${validationType})`);

    // Panggil service validasi yang baru
    const analysisText = await validateDocument(query, validationType, docA, docB);

    // Kembalikan hasil analisis sebagai JSON
    // Tidak perlu membuat file .docx, langsung kirim teks analisisnya
    res.json({
      success: true,
      validationType: validationType,
      analysis: analysisText
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Gagal memvalidasi dokumen',
      details: error.message
    });
  }
};