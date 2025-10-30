# 📄 Multi-Format Script Upload Feature

## Overview
The Film Storyboard AI now supports uploading scripts in multiple file formats, making it flexible for filmmakers who work with different screenwriting tools and document formats.

## Supported File Formats

### ✅ Currently Supported

1. **Plain Text (.txt)**
   - Universal text format
   - Directly readable
   - Max size: 10MB

2. **PDF Documents (.pdf)**
   - Portable Document Format
   - Text extraction using pdf-parse library
   - Supports multi-page documents
   - Max size: 10MB

3. **Microsoft Word (.doc, .docx)**
   - Word 97-2003 (.doc)
   - Word 2007+ (.docx)
   - Text extraction using mammoth library
   - Preserves paragraph structure
   - Max size: 10MB

4. **Rich Text Format (.rtf)**
   - Universal formatted text
   - Cross-platform compatibility
   - Max size: 10MB

5. **Screenwriting Formats**
   - **Fountain (.fountain)** - Plain text markup for screenplays
   - **Final Draft (.fdx)** - Industry-standard screenwriting software
   - **Celtx (.celtx)** - Pre-production software format
   - Max size: 10MB

## Technical Implementation

### Backend Components

#### 1. File Parser Service (`backend/services/fileParserService.js`)
```javascript
// Handles parsing of different file formats
- parseFile(filePath, originalName) - Main parsing method
- parseTextFile(filePath) - Plain text files
- parsePDF(filePath) - PDF documents
- parseWord(filePath) - Word documents
- isSupported(filename) - File type validation
- getFileType(filename) - File type description
```

#### 2. Multer Configuration (`backend/server.js`)
```javascript
// Updated file filter
allowedMimeTypes: [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/rtf'
]

allowedExtensions: [
  '.txt', '.fountain', '.pdf', '.doc', '.docx', '.rtf', '.fdx', '.celtx'
]
```

#### 3. Dependencies
- **pdf-parse**: Extracts text from PDF files
- **mammoth**: Converts Word documents to plain text

### Frontend Components

#### 1. ScriptUpload Component (`frontend/src/components/ScriptUpload.js`)

**Updated Dropzone Configuration:**
```javascript
accept: {
  'text/plain': ['.txt', '.fountain'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
  'application/x-fountain': ['.fountain'],
  'application/x-fdx': ['.fdx'],
  'application/x-celtx': ['.celtx']
}
maxSize: 10 * 1024 * 1024 // 10MB
```

**Enhanced Error Handling:**
- File size validation (10MB limit)
- File type validation
- User-friendly error messages

## Usage

### For Users

1. **Upload via File Selection:**
   - Click the upload area
   - Select a supported file format
   - The system automatically detects and parses the file

2. **Drag & Drop:**
   - Drag any supported file into the upload zone
   - File is validated and processed automatically

3. **Manual Input:**
   - Toggle to "Type Script" mode
   - Paste or type your script directly
   - No file parsing needed

### For Developers

#### Adding a New File Format

1. **Update Multer Configuration** (`backend/server.js`):
```javascript
// Add mime type and extension
allowedMimeTypes.push('application/your-format');
allowedExtensions.push('.yourext');
```

2. **Add Parser Method** (`backend/services/fileParserService.js`):
```javascript
async parseYourFormat(filePath) {
  // Implement parsing logic
  const content = // ... extract text
  return content;
}
```

3. **Update Switch Statement**:
```javascript
case '.yourext':
  return await this.parseYourFormat(filePath);
```

4. **Update Frontend** (`frontend/src/components/ScriptUpload.js`):
```javascript
accept: {
  'application/your-format': ['.yourext']
}
```

## File Processing Flow

```
Upload File
    ↓
Multer Validation (mime type, extension, size)
    ↓
File Parser Service (extract text)
    ↓
Emotion Analysis (NLP)
    ↓
Scene Detection
    ↓
Database Storage
    ↓
AI Image Generation
```

## Error Handling

### Backend Errors
- **File too large**: Returns 400 with file size error
- **Unsupported format**: Returns 400 with format error
- **Parsing failure**: Returns 500 with parsing error details
- **Empty content**: Returns error if extracted text < 10 characters

### Frontend Errors
- **File size exceeded**: Toast notification with 10MB limit
- **Invalid format**: Toast notification with supported formats
- **Upload failure**: Retry option with error details

## Performance Considerations

1. **File Size Limit**: 10MB to prevent server overload
2. **Async Processing**: All file parsing is asynchronous
3. **Memory Management**: Files are processed and deleted after upload
4. **Error Recovery**: Graceful degradation if parsing fails

## Security

1. **File Type Validation**: Double validation (mime type + extension)
2. **Size Limits**: Prevents DoS attacks via large files
3. **Path Sanitization**: Secure file storage
4. **Content Validation**: Ensures extracted text is meaningful

## Testing

### Test Different Formats
```bash
# Upload each supported format
- sample.txt
- screenplay.fountain
- script.pdf
- document.docx
- document.doc
- script.rtf
- final_draft.fdx
```

### Verify
- ✅ File uploads successfully
- ✅ Text is extracted correctly
- ✅ Scenes are detected
- ✅ Emotions are analyzed
- ✅ Images are generated

## Future Enhancements

### Potential Additions
- [ ] Excel/CSV format for scene lists
- [ ] Markdown (.md) support
- [ ] HTML script formats
- [ ] OpenOffice formats (.odt)
- [ ] Scrivener exports
- [ ] Movie Magic Screenwriter
- [ ] Image-based script extraction (OCR)

### Improvements
- [ ] Better PDF table handling
- [ ] Preserve formatting from Word docs
- [ ] Character encoding detection
- [ ] Multiple file upload
- [ ] Batch processing

## Troubleshooting

### Common Issues

**PDF text extraction fails:**
- Ensure PDF contains selectable text (not scanned images)
- Try re-saving PDF with text layer
- Consider OCR for image-based PDFs

**Word document formatting issues:**
- Mammoth focuses on text extraction
- Complex formatting may be simplified
- Use plain text export if needed

**Large file uploads timing out:**
- Compress document before upload
- Remove unnecessary images/formatting
- Split into multiple scripts if needed

## Dependencies

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.6.0",
  "multer": "^1.4.5-lts.1"
}
```

## API Reference

### POST /api/upload-script

**Request:**
```
Content-Type: multipart/form-data

Fields:
- script: File (required) - Any supported format
- title: String (required) - Project title
- language: String (optional, default: 'en') - Script language
- imageStyle: String (optional, default: 'realistic') - Image style
```

**Response:**
```json
{
  "success": true,
  "projectId": 123,
  "scenes": [...],
  "language": "en",
  "message": "Script analyzed successfully. Found 5 scenes."
}
```

## Conclusion

The multi-format upload feature significantly enhances the flexibility of Film Storyboard AI, allowing filmmakers to use their preferred screenwriting tools while maintaining seamless integration with our emotion analysis and storyboard generation system.
