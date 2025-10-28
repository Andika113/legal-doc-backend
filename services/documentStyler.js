// File: services/documentStyler.js
const { Document, Paragraph, TextRun, AlignmentType } = require('docx');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

class DocumentStyler {
  // ✅ Parse teks, mengabaikan semua tag styling yang rumit
  parseStyledText(text) {
    // Memecah teks hanya berdasarkan baris baru
    return text.split('\n').map(line => ({
      type: line.trim() ? 'normal' : 'empty',
      text: line.trim()
    }));
  }

  // ✅ Generate DOCX dengan styling dasar
  async generateDOCX(content, outputPath = 'output/document.docx') {
    const sections = this.parseStyledText(content);
    const children = [];

    // Header Dokumen Sederhana
    children.push(new Paragraph({
        text: 'TERJEMAHAN TERSUMPAH (AI DRAFT)',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }));
    
    for (const section of sections) {
      if (section.type === 'normal') {
        children.push(new Paragraph({
          children: [new TextRun({ text: section.text, size: 22, font: 'Times New Roman' })],
          spacing: { before: 80, after: 80 },
          alignment: AlignmentType.JUSTIFIED
        }));
      } else {
        children.push(new Paragraph({ text: '', spacing: { before: 100 } }));
      }
    }

    const doc = new Document({ sections: [{ children: children }] });
    const buffer = await require('docx').Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);
    console.log(`✅ DOCX berhasil disimpan: ${outputPath}`);
    return outputPath;
  }

  // ✅ Generate PDF dengan styling dasar
  async generatePDF(content, outputPath = 'output/document.pdf') {
    const sections = this.parseStyledText(content);
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); 
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    let yPosition = 800;
    const margin = 72;
    const fontSize = 12;

    // Judul
    page.drawText('TERJEMAHAN TERSUMPAH (AI DRAFT)', { x: margin, y: yPosition, size: 14, font: font });
    yPosition -= 30;

    for (const section of sections) {
      if (yPosition < 50) { page = pdfDoc.addPage(); yPosition = 800; }
      if (section.type === 'normal') {
        page.drawText(section.text, { x: margin, y: yPosition, size: fontSize, font: font });
        yPosition -= fontSize + 6;
      } else {
        yPosition -= 10;
      }
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`✅ PDF berhasil disimpan: ${outputPath}`);
    return outputPath;
  }
}

module.exports = new DocumentStyler();