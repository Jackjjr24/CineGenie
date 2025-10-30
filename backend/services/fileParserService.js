const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * File Parser Service
 * Handles parsing of various document formats (PDF, Word, RTF, etc.)
 */
class FileParserService {
  /**
   * Parse uploaded file and extract text content
   * @param {string} filePath - Path to the uploaded file
   * @param {string} originalName - Original filename
   * @returns {Promise<string>} Extracted text content
   */
  async parseFile(filePath, originalName) {
    const extension = path.extname(originalName).toLowerCase();
    
    console.log(`📄 Parsing file: ${originalName} (${extension})`);
    
    try {
      switch (extension) {
        case '.txt':
        case '.fountain':
        case '.fdx':
        case '.celtx':
          return await this.parseTextFile(filePath);
        
        case '.pdf':
          return await this.parsePDF(filePath);
        
        case '.doc':
        case '.docx':
          return await this.parseWord(filePath);
        
        case '.rtf':
          // RTF can be parsed as text in most cases
          return await this.parseTextFile(filePath);
        
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      console.error(`❌ Error parsing ${extension} file:`, error);
      throw new Error(`Failed to parse ${extension} file: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   * @param {string} filePath - Path to the text file
   * @returns {Promise<string>} Text content
   */
  async parseTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`✅ Text file parsed successfully (${content.length} characters)`);
      return content;
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  /**
   * Parse PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} Extracted text content
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      const textContent = data.text.trim();
      console.log(`✅ PDF parsed successfully (${data.numpages} pages, ${textContent.length} characters)`);
      
      if (!textContent || textContent.length < 10) {
        throw new Error('PDF appears to be empty or contains no extractable text');
      }
      
      return textContent;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Parse Word document (.doc, .docx)
   * @param {string} filePath - Path to the Word document
   * @returns {Promise<string>} Extracted text content
   */
  async parseWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const textContent = result.value.trim();
      
      console.log(`✅ Word document parsed successfully (${textContent.length} characters)`);
      
      if (result.messages.length > 0) {
        console.log('ℹ️ Parsing messages:', result.messages);
      }
      
      if (!textContent || textContent.length < 10) {
        throw new Error('Word document appears to be empty');
      }
      
      return textContent;
    } catch (error) {
      throw new Error(`Failed to parse Word document: ${error.message}`);
    }
  }

  /**
   * Validate file type based on extension
   * @param {string} filename - Original filename
   * @returns {boolean} Whether file type is supported
   */
  isSupported(filename) {
    const supportedExtensions = [
      '.txt', '.fountain', '.fdx', '.celtx',
      '.pdf', '.doc', '.docx', '.rtf'
    ];
    
    const extension = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(extension);
  }

  /**
   * Get file type description
   * @param {string} filename - Original filename
   * @returns {string} Human-readable file type
   */
  getFileType(filename) {
    const extension = path.extname(filename).toLowerCase();
    const fileTypes = {
      '.txt': 'Plain Text',
      '.fountain': 'Fountain Script',
      '.fdx': 'Final Draft',
      '.celtx': 'Celtx Script',
      '.pdf': 'PDF Document',
      '.doc': 'Word Document',
      '.docx': 'Word Document',
      '.rtf': 'Rich Text Format'
    };
    
    return fileTypes[extension] || 'Unknown';
  }
}

module.exports = new FileParserService();
