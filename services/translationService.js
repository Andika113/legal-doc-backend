const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ⬇️ ATURAN BARU DARI FILE .DOCX ANDA ⬇️
// Kita simpan aturan Korea di sini agar bisa dimasukkan ke prompt
const KOREAN_TRANSLATION_RULES = `
PANDUAN TERJEMAHAN WAJIB (INDONESIA KE KOREA):
1.  Penulisan Angka:
    - Gunakan koma (,) sebagai pemisah ribuan dan titik (.) untuk desimal. (Contoh: 1,000,000 dan 2.5).
    - Satuan mata uang: ₩1,000,000 atau 1,000,000원.
    - Penulisan teks hukum: 금 일백만원정 (untuk 1 juta won).
    - Pengelompokan angka: Gunakan '만' (sepuluh ribu) dan '억' (seratus juta).
2.  Penulisan Alamat:
    - Format Korea: [Provinsi] [Kabupaten/Kota] [Kecamatan/Desa] [Nomor].
    - Contoh: 경상북도 성주군 성주읍 예산리 139번지 (untuk 139-beonji, Yesan-ri, Seongju-eup, Seongju-gun, Gyeongsangbuk-do).
    - Format Indonesia (RT/RW): 12870 자카르타 자카르타 특별수도지역 트븟 멘텡달람 RT 007/ RW 002 라사말라 I로 57호 (untuk Jakarta Selatan, Tebet, Menteng Dalam).
3.  Padanan Nama Kota (WAJIB IKUTI):
    - Jakarta Selatan: 남부 자카르타
    - Jakarta: 자카르타
    - Bekasi: 브카시
    - Cikarang: 치카랑
    - Bandung: 반둥
    - Surabaya: 수라바야
`;

async function translateDocument(paragraphs, targetLang = 'ko') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const fullText = paragraphs.join('\n\n');
    let totalChars = fullText.length;

    // Tentukan apakah kita perlu aturan khusus
    let rules = '';
    if (targetLang === 'ko') {
      rules = KOREAN_TRANSLATION_RULES; // Masukkan aturan dari file Anda
    }

    const prompt = `
Kamu adalah Penerjemah Tersumpah profesional yang berspesialisasi dalam dokumen hukum.
Tugasmu adalah menerjemahkan teks berikut ke ${targetLang} dengan akurasi semantik dan terminologi hukum yang tepat.

${rules} // <-- ATURAN BARU DIMASUKKAN DI SINI

JANGAN menambahkan komentar atau catatan apapun. Hanya berikan hasil terjemahannya.

=== TEKS ASLI ===
${fullText}

=== TERJEMAHAN KE ${targetLang} ===
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();

    const translatedParagraphs = translatedText.split('\n');

    console.log(`📢 Berhasil diterjemahkan oleh Gemini (Sworn Translator + Custom Rules)`);
    
    const estimatedCost = (totalChars / 1000) * 0.00015;
    console.log(`💰 Estimasi biaya Gemini: $${estimatedCost.toFixed(6)}`);

    return { translatedParagraphs, totalChars, estimatedCost };
  } catch (error) {
    console.error('❌ Error in Gemini translation:', error);
    throw error;
  }
}

module.exports = { translateDocument };