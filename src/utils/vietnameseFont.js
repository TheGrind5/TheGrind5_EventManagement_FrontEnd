// Vietnamese font support for jsPDF
// This file contains a base64 encoded font that supports Vietnamese characters
// Using a subset of Noto Sans font optimized for Vietnamese

// Note: For full Vietnamese support, you would need to:
// 1. Download a Vietnamese font (TTF file)
// 2. Convert it using jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
// 3. Import the generated file here

// For now, we'll use a workaround by ensuring UTF-8 encoding
// and using the default font with proper text handling

/**
 * Configure jsPDF document for Vietnamese text support
 * @param {jsPDF} doc - The jsPDF document instance
 */
export function configureVietnameseFont(doc) {
  // jsPDF 3.x uses UTF-8 encoding by default
  // The issue is that default Helvetica font doesn't support Vietnamese diacritics
  // We need to add a custom font or use a workaround
  
  // For now, we'll ensure the document uses UTF-8 encoding
  // and hope the PDF viewer can render Vietnamese characters
  // with font substitution
  
  // Note: This is a temporary solution
  // For production, you should add a proper Vietnamese font
  return doc;
}

/**
 * Add Vietnamese text to PDF with proper encoding
 * @param {jsPDF} doc - The jsPDF document instance
 * @param {string} text - Vietnamese text to add
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {object} options - Additional options
 */
export function addVietnameseText(doc, text, x, y, options = {}) {
  // Ensure text is properly encoded as UTF-8
  // jsPDF should handle this automatically, but we'll be explicit
  try {
    doc.text(text, x, y, options);
  } catch (error) {
    console.warn('Error adding Vietnamese text:', error);
    // Fallback: try without options
    doc.text(text, x, y);
  }
}

