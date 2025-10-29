// File: utils/fileUtils.js
// Utility untuk extract text dari berbagai format file

const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth'); // Untuk DOCX
const pdfParse = require('pdf-parse'); // Untuk PDF

/**
 * Extract text dari file (PDF, DOCX, TXT)
 * @param {Object} file - File object dari multer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(file) {
  try {
    const filePath = file.path;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log(`📂 Extracting text from: ${file.originalname} (${fileExtension})`);
    
    switch (fileExtension) {
      case '.txt':
        return await extractFromTxt(filePath);
      
      case '.pdf':
        return await extractFromPdf(filePath);
      
      case '.docx':
      case '.doc':
        return await extractFromDocx(filePath);
      
      default:
        throw new Error(`Format file tidak didukung: ${fileExtension}. Gunakan PDF, DOCX, atau TXT.`);
    }
    
  } catch (error) {
    console.error('❌ Error extracting text:', error);
    throw new Error(`Gagal extract text dari file: ${error.message}`);
  }
}

/**
 * Extract text dari file TXT
 */
async function extractFromTxt(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`✅ TXT extracted: ${content.length} characters`);
    return content;
  } catch (error) {
    throw new Error(`Gagal baca file TXT: ${error.message}`);
  }
}

/**
 * Extract text dari file PDF
 */
async function extractFromPdf(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text.trim();
    console.log(`✅ PDF extracted: ${text.length} characters, ${data.numpages} pages`);
    
    if (!text || text.length === 0) {
      throw new Error('PDF tidak memiliki text yang bisa di-extract (mungkin image-based PDF)');
    }
    
    return text;
  } catch (error) {
    throw new Error(`Gagal extract PDF: ${error.message}`);
  }
}

/**
 * Extract text dari file DOCX
 */
async function extractFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value.trim();
    
    console.log(`✅ DOCX extracted: ${text.length} characters`);
    
    if (result.messages && result.messages.length > 0) {
      console.log('⚠️  DOCX extraction warnings:', result.messages);
    }
    
    if (!text || text.length === 0) {
      throw new Error('DOCX tidak memiliki text yang bisa di-extract');
    }
    
    return text;
  } catch (error) {
    throw new Error(`Gagal extract DOCX: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile,
  extractFromTxt,
  extractFromPdf,
  extractFromDocx
};