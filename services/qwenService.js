// File: services/qwenService.js
const axios = require('axios');

const QWEN_API_BASE_URL = process.env.QWEN_API_BASE_URL;
const QWEN_AUTH_TOKEN = process.env.QWEN_AUTH_TOKEN;
const QWEN_MODEL_NAME = "eliceai/Qwen2.5-72B-Instruct-Ko"; 

if (!QWEN_AUTH_TOKEN || !QWEN_API_BASE_URL) {
    console.error("KRITIS: QWEN_AUTH_TOKEN atau QWEN_API_BASE_URL belum diatur di .env");
}

/**
 * Fungsi internal untuk memanggil API Qwen (core logic)
 */
async function callQwenAPI(messages, maxTokens = 8000) {
    if (!QWEN_AUTH_TOKEN) {
        throw new Error("Token autentikasi Qwen tidak ditemukan.");
    }

    const endpoint = `${QWEN_API_BASE_URL}/v1/chat/completions`;

    const payload = {
        "model": QWEN_MODEL_NAME,
        "messages": messages,
        "max_tokens": maxTokens,
        "temperature": 0.01 
    };

    const headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": `Bearer ${QWEN_AUTH_TOKEN}` // Menggunakan JWT Token Anda
    };

    try {
        const response = await axios.post(endpoint, payload, { headers: headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("❌ Qwen API PANGGILAN GAGAL:", error.response?.data || error.message);
        throw new Error(`Qwen API Error: ${error.response?.statusText || error.message}`);
    }
}

// ⬇️ ATURAN KHUSUS TRANSLATE KOREA (GlOSARIUM & FORMAT) ⬇️
const KOREAN_TRANSLATION_RULES = `
PANDUAN TERJEMAHAN WAJIB (INDONESIA KE KOREA):
1. Penulisan Angka:
    - Gunakan koma (,) sebagai pemisah ribuan dan titik (.) untuk desimal. (Contoh: 1,000,000 dan 2.5).
    - Satuan mata uang: ₩1,000,000 atau 1,000,000원.
    - Penulisan teks hukum: 금 일백만원정 (untuk 1 juta won).
    - Pengelompokan angka: Gunakan '만' (sepuluh ribu) dan '억' (seratus juta).
2. Penulisan Alamat:
    - Format Korea: [Provinsi] [Kabupaten/Kota] [Kecamatan/Desa] [Nomor].
    - Contoh: 경상북도 성주군 성주읍 예산리 139번지 (untuk 139-beonji, Yesan-ri, Seongju-eup, Seongju-gun, Gyeongsangbuk-do).
    - Format Indonesia (RT/RW): 12870 자카르타 자카르타 특별수도지역 트븟 멘텡달람 RT 007/ RW 002 라사말라 I로 57호 (untuk Jakarta Selatan, Tebet, Menteng Dalam).
3. Padanan Nama Kota (WAJIB IKUTI):
    - Jakarta Selatan: 남부 자카르타
    - Jakarta: 자카르타
    - Bekasi: 브카시
    - Cikarang: 치카랑
    - Bandung: 반둥
    - Surabaya: 수라바야
`;

/**
 * FUNGSI TRANSLATE UTAMA (Penerjemah Tersumpah)
 */
async function translateDocument(paragraphs, targetLang = 'ko') {
    const fullText = paragraphs.join('\n\n');
    let totalChars = fullText.length;

    const rules = (targetLang === 'ko') ? KOREAN_TRANSLATION_RULES : '';

    const systemPrompt = `
        Kamu adalah Penerjemah Tersumpah profesional yang berspesialisasi dalam dokumen hukum.
        Tugasmu adalah menerjemahkan teks berikut ke ${targetLang}. 
        
        ${rules}
        
        PASTIKAN kamu mengikuti semua PANDUAN TERJEMAHAN WAJIB di atas.
        JANGAN menambahkan komentar, catatan, atau ucapan lain.
    `;
    
    const messages = [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": fullText }
    ];

    const translatedText = await callQwenAPI(messages);
    const translatedParagraphs = translatedText.split('\n');

    console.log(`📢 Berhasil diterjemahkan oleh Qwen (Sworn Translator Mode)`);

    const estimatedCost = (totalChars / 1000) * 0.0001; 
    
    return { translatedParagraphs, totalChars, estimatedCost };
}

module.exports = {
  translateDocument: translateDocument
};