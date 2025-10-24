const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * FUNGSI 1: GENERATE DOKUMEN BARU
 */
async function generateLegalDraft(query, context = '', docType = 'surat_perjanjian', targetLang = 'id') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // 1. Tentukan Bahasa & Format
    let languageFormatPrompt;
    switch (targetLang) {
      case 'ko':
        languageFormatPrompt = "PENTING: Dokumen HARUS dibuat dalam Bahasa Korea (Hangeul) dan mematuhi format hukum standar Korea Selatan (misalnya, penggunaan '갑' (Pihak Pertama) dan '을' (Pihak Kedua)).";
        break;
      case 'en':
        languageFormatPrompt = "PENTING: Dokumen HARUS dibuat dalam Bahasa Inggris (Legal English) dan mematuhi format standar kontrak Common Law (UK/US) (misalnya, 'This Agreement is made...', 'Party A', 'Party B').";
        break;
      default:
        languageFormatPrompt = "PENTING: Dokumen HARUS dibuat dalam Bahasa Indonesia dan mematuhi format hukum standar Indonesia (misal: 'PIHAK PERTAMA', 'PIHAK KEDUA').";
    }

    // 2. Tentukan Persona AI
    let personaPrompt;
    switch (docType) {
      case 'surat_kuasa':
        personaPrompt = "Kamu adalah notaris yang ahli membuat Surat Kuasa yang singkat, jelas, dan sah secara hukum.";
        break;
      case 'kontrak_kerja':
        personaPrompt = "Kamu adalah ahli HRD (Personalia) yang spesialis membuat Kontrak Kerja (PKWT) yang sesuai dengan UU Ketenagakerjaan.";
        break;
      case 'mou':
        personaPrompt = "Kamu adalah konsultan bisnis yang ahli membuat Memorandum of Understanding (MoU) atau Nota Kesepahaman.";
        break;
      case 'akta_pendirian':
        personaPrompt = "Kamu adalah notaris senior yang ahli dalam menyusun Akta Pendirian PT (Perseroan Terbatas) Perorangan.";
        break;
      default:
        personaPrompt = "Kamu adalah asisten hukum yang ahli dalam menyusun surat perjanjian resmi.";
    }

    // 3. Instruksi Styling (PROMPT TTD DIPERBARUI)
    const stylingInstructions = `
PENTING: Gunakan format berikut untuk memudahkan styling:
- Judul utama: [TITLE]...Judul...[/TITLE]
- Judul Pasal (jika ada): [HEADING]...Judul Pasal...[/HEADING]
- Teks tebal: [BOLD]...Teks...[/BOLD]
- Teks miring (italic): [ITALIC]...Teks...[/ITALIC]
- Paragraf penting: [IMPORTANT]...Teks...[/IMPORTANT]

INSTRUKSI TANDA TANGAN (SANGAT PENTING):
- JANGAN buat tabel atau format CSV di akhir.
- JANGAN tulis "The following table:".
- GANTIKAN bagian "Demikian Perjanjian ini..." dan seluruh blok tanda tangan dengan SATU BARIS tag [SIGNATURE_B2B] jika ini adalah dokumen B2B.
- Format: [SIGNATURE_B2B]Nama Pihak 1 | Jabatan Pihak 1 | Nama Pihak 2 | Jabatan Pihak 2[/SIGNATURE_B2B]
- Contoh: [SIGNATURE_B2B]Rahmat Hidayat | Direktur Utama | Arief Wibowo | Manajer Logistik[/SIGNATURE_B2B]

PENTING:
1.  JANGAN tambahkan kalimat pembuka atau sapaan.
2.  Langsung mulai respons Anda dengan tag [TITLE].
3.  Pastikan untuk menutup semua tag.
`;

    // 4. Gabungkan Prompt
    const prompt = `
${personaPrompt}
${languageFormatPrompt}

Gunakan referensi di bawah ini jika relevan.
=== REFERENSI ===
${context}

=== TUGAS ===
${query}

${stylingInstructions}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(`✅ Model berhasil generate teks (Tipe: ${docType}, Bahasa: ${targetLang})`);
    return response.text();

  } catch (error) {
    console.error('❌ Error calling Gemini API (Generate):', error);
    throw error;
  }
}


/**
 * FUNGSI 2: VALIDASI DOKUMEN
 */
async function validateDocument(query, validationType, docA, docB = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    let personaPrompt, taskInstructions;

    switch (validationType) {
      case 'comparison': // Validasi Kemiripan
        personaPrompt = "Kamu adalah Asisten Hukum yang sangat teliti. Tugasmu adalah membandingkan dua dokumen secara semantik dan klausal.";
        taskInstructions = `
=== DOKUMEN A ===
${docA}

=== DOKUMEN B ===
${docB}

=== TUGAS PERBANDINGAN ===
${query}

=== OUTPUT ===
Bandingkan Dokumen A dan Dokumen B. Berikan [BOLD]Ringkasan Perbandingan:[/BOLD] (Sebutkan apakah secara makna sama, mirip, atau sangat berbeda) dan [BOLD]Temuan Perbedaan Kunci:[/BOLD] (Jelaskan perbedaan klausa atau makna yang paling penting secara poin-poin).
`;
        break;
      
      case 'review': // Validasi Review
      default:
        personaPrompt = "Kamu adalah Asisten Hukum yang bertugas me-review dan memvalidasi draf dokumen yang diberikan pengguna.";
        taskInstructions = `
=== DOKUMEN UNTUK DI-REVIEW ===
${docA}

=== TUGAS VALIDASI/REVIEW ===
${query}

=== OUTPUT ===
Berikan analisis Anda. Gunakan format [BOLD]...[/BOLD] untuk judul temuan dan paragraf biasa untuk penjelasan.
Contoh:
[BOLD]Temuan Klausul Harga:[/BOLD]
Pasal 3 Ayat 1 tentang harga sudah jelas, namun belum mencantumkan PPN.
[BOLD]Saran Perbaikan:[/BOLD]
Sebaiknya tambahkan...
`;
    }

    const prompt = `${personaPrompt}\n${taskInstructions}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(`✅ Model berhasil validasi teks (Tipe: ${validationType})`);
    return response.text();

  } catch (error) {
    console.error('❌ Error calling Gemini API (Validate):', error);
    throw error;
  }
}

module.exports = {
  generateLegalDraft,
  validateDocument
};