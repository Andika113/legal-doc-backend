const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableCell, TableRow, WidthType, BorderStyle } = require('docx');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

class DocumentStyler {
  // ✅ Parse teks dengan tag styling (VERSI DIPERBARUI)
  parseStyledText(text) {
    const sections = [];
    // Hapus dulu baris pembuka "Berikut adalah..." jika ada
    const cleanedText = text.replace(/^(Berikut adalah|Baik, berikut adalah)[\s\S]*?:\n\n/i, '');
    const lines = cleanedText.split('\n');

    for (const line of lines) {
      // Membersihkan teks dari SEMUA tag styling dulu
      const cleanText = line.replace(/\[\/?(TITLE|HEADING|BOLD|ITALIC|IMPORTANT|SIGNATURE_B2B)\]/g, '').trim();

      if (line.includes('[TITLE]')) {
        sections.push({ type: 'title', text: cleanText });
      } else if (line.includes('[HEADING]') || line.trim().toUpperCase().startsWith('PASAL')) {
        sections.push({ type: 'heading', text: cleanText });
      } else if (line.includes('[BOLD]')) {
        sections.push({ type: 'bold', text: cleanText });
      } else if (line.includes('[IMPORTANT]')) {
        sections.push({ type: 'important', text: cleanText });
      } else if (line.includes('[ITALIC]')) {
        sections.push({ type: 'italic', text: cleanText });
      } else if (line.includes('[SIGNATURE_B2B]')) {
        // TAMBAHAN BARU: Parsing blok tanda tangan B2B
        const parts = cleanText.split('|').map(s => s.trim());
        if (parts.length === 4) {
          sections.push({
            type: 'signature_b2b',
            p1_name: parts[0],
            p1_title: parts[1],
            p2_name: parts[2],
            p2_title: parts[3],
          });
        }
      } else if (line.trim()) {
        sections.push({ type: 'normal', text: cleanText });
      } else {
        sections.push({ type: 'empty', text: '' });
      }
    }
    return sections;
  }

  // ✅ Generate DOCX dengan styling profesional (VERSI DIPERBARUI)
  async generateDOCX(content, outputPath = 'output/document.docx') {
    const sections = this.parseStyledText(content);
    const children = [];

    // Hapus header "SURAT PERJANJIAN" yang di-hardcode
    // Kita akan bergantung pada [TITLE] dari AI

    // Proses setiap section
    for (const section of sections) {
      switch (section.type) {
        case 'title':
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, bold: true, size: 32, font: 'Times New Roman' })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 400 } // Beri jarak lebih setelah judul
            })
          );
          break;
        case 'heading':
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, bold: true, size: 24, font: 'Times New Roman' })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 240, after: 120 }
            })
          );
          break;
        case 'bold':
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, bold: true, size: 22, font: 'Times New Roman' })
              ],
              spacing: { before: 120, after: 120 }
            })
          );
          break;
        case 'important':
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, bold: true, italics: true, size: 22, font: 'Times New Roman' })
              ],
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
          break;
        case 'italic':
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, italics: true, size: 22, font: 'Times New Roman' })
              ],
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
          break;

        // TAMBAHAN BARU: Membuat layout 2 kolom untuk tanda tangan
        case 'signature_b2b':
          const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { // Sembunyikan semua border
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  // Kolom Kiri (Pihak Pertama)
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ text: 'PIHAK PERTAMA,', alignment: AlignmentType.CENTER, spacing: { after: 1200 } }), // Jarak untuk TTD
                      new Paragraph({ text: section.p1_name, bold: true, alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: section.p1_title, italics: true, alignment: AlignmentType.CENTER }),
                    ],
                  }),
                  // Kolom Kanan (Pihak Kedua)
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ text: 'PIHAK KEDUA,', alignment: AlignmentType.CENTER, spacing: { after: 1200 } }), // Jarak untuk TTD
                      new Paragraph({ text: section.p2_name, bold: true, alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: section.p2_title, italics: true, alignment: AlignmentType.CENTER }),
                    ],
                  }),
                ],
              }),
            ],
          });
          children.push(new Paragraph({ text: '', spacing: { before: 400 } })); // Spasi sebelum tabel
          children.push(table);
          break;

        case 'empty':
          children.push(
            new Paragraph({ text: '', spacing: { before: 120, after: 120 } })
          );
          break;
        default:
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: section.text, size: 22, font: 'Times New Roman' })
              ],
              spacing: { before: 80, after: 80 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
      }
    }
    
    // HAPUS BLOK TANDA TANGAN GENERIK
    // (Blok "Pihak Pertama, ______" yang ada di versi lama Anda sudah dihapus)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: children
      }]
    });

    const buffer = await require('docx').Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);
    console.log(`✅ DOCX berhasil disimpan: ${outputPath}`);
    return outputPath;
  }

  // ✅ Generate PDF dengan styling profesional (VERSI DIPERBARUI)
  async generatePDF(content, outputPath = 'output/document.pdf') {
    const sections = this.parseStyledText(content);
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    
    let yPosition = 800;
    const margin = 72; // 1 inch
    const maxWidth = 595.28 - (margin * 2);

    // Helper function untuk wrap text
    const wrapText = (text, font, fontSize, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, fontSize);

        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Hapus Judul utama "SURAT PERJANJIAN" yang di-hardcode
    
    // Proses setiap section
    for (const section of sections) {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = 800;
      }

      let font = timesRomanFont;
      let fontSize = 12;
      let alignment = 'left';

      switch (section.type) {
        case 'title':
          font = timesRomanBold;
          fontSize = 16;
          alignment = 'center';
          yPosition -= 20; // Beri spasi sebelum judul
          break;
        case 'heading':
          font = timesRomanBold;
          fontSize = 14;
          yPosition -= 10;
          break;
        case 'bold':
          font = timesRomanBold;
          fontSize = 12;
          break;
        case 'important':
          font = timesRomanItalic;
          fontSize = 12;
          break;
        case 'italic':
          font = timesRomanItalic;
          fontSize = 12;
          break;
        // Case untuk 'signature_b2b' di PDF (versi simpel, 2 kolom sulit di pdf-lib)
        case 'signature_b2b':
          yPosition -= 40;
          const p1_text = `PIHAK PERTAMA,\n\n\n\n${section.p1_name}\n${section.p1_title}`;
          const p2_text = `PIHAK KEDUA,\n\n\n\n${section.p2_name}\n${section.p2_title}`;
          
          // Menggambar 2 kolom secara manual
          const col1_x = margin;
          const col2_x = margin + (maxWidth / 2) + 20; // Posisi kolom 2
          const col_y_start = yPosition;

          const p1_lines = wrapText(p1_text, font, fontSize, maxWidth/2);
          for (const line of p1_lines) {
             page.drawText(line, { x: col1_x, y: yPosition, size: fontSize, font: font, color: rgb(0, 0, 0) });
             yPosition -= fontSize + 6;
          }
          
          yPosition = col_y_start; // Reset Y ke atas
          
          const p2_lines = wrapText(p2_text, font, fontSize, maxWidth/2);
           for (const line of p2_lines) {
             page.drawText(line, { x: col2_x, y: yPosition, size: fontSize, font: font, color: rgb(0, 0, 0) });
             yPosition -= fontSize + 6;
          }
          yPosition -= 8;
          continue; // Lompat ke section berikutnya

        case 'empty':
          yPosition -= 15;
          continue;
        default:
          // Teks normal (default)
          break; 
      }

      const lines = wrapText(section.text, font, fontSize, maxWidth);
      
      for (const line of lines) {
        let xPosition = margin;
        if (alignment === 'center') {
          xPosition = 595.28 / 2 - font.widthOfTextAtSize(line, fontSize) / 2;
        }

        page.drawText(line, {
          x: xPosition,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= fontSize + 6;
      }

      yPosition -= 8;
    }

    // Hapus blok tanda tangan generik

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`✅ PDF berhasil disimpan: ${outputPath}`);
    return outputPath;
  }
}

module.exports = new DocumentStyler();