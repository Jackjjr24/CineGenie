const PDFDocument = require('pdfkit');
const archiver = require('archiver');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

class ExportService {
  constructor() {
    this.exportsPath = path.join(__dirname, '../../exports');
    fs.ensureDirSync(this.exportsPath);
    
    // Standard production formats
    this.formats = {
      'pdf_storyboard': {
        name: 'PDF Storyboard',
        description: 'Professional storyboard in PDF format',
        mimeType: 'application/pdf'
      },
      'pdf_presentation': {
        name: 'PDF Presentation',
        description: 'Presentation-ready storyboard with annotations',
        mimeType: 'application/pdf'
      },
      'images_zip': {
        name: 'Images Archive',
        description: 'All storyboard images in ZIP archive',
        mimeType: 'application/zip'
      },
      'production_package': {
        name: 'Production Package',
        description: 'Complete package with multiple formats',
        mimeType: 'application/zip'
      },
      'web_gallery': {
        name: 'Web Gallery',
        description: 'HTML gallery for web viewing',
        mimeType: 'text/html'
      },
      'video_preview': {
        name: 'Video Preview',
        description: 'Animated storyboard preview',
        mimeType: 'video/mp4'
      }
    };
    
    // Export templates
    this.templates = {
      'professional': {
        name: 'Professional',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        colors: { primary: '#2d3748', secondary: '#4a5568', accent: '#3182ce' },
        fonts: { header: 'Helvetica-Bold', body: 'Helvetica', caption: 'Helvetica-Oblique' }
      },
      'minimal': {
        name: 'Minimal',
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        colors: { primary: '#1a202c', secondary: '#718096', accent: '#e53e3e' },
        fonts: { header: 'Helvetica-Bold', body: 'Helvetica', caption: 'Helvetica' }
      },
      'cinematic': {
        name: 'Cinematic',
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        colors: { primary: '#000000', secondary: '#333333', accent: '#f7931e' },
        fonts: { header: 'Helvetica-Bold', body: 'Helvetica', caption: 'Helvetica-Oblique' }
      }
    };
  }

  /**
   * Export storyboard in specified format
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportStoryboard(projectId, frames, project, options = {}) {
    const {
      format = 'pdf_storyboard',
      template = 'professional',
      includeMetadata = true,
      resolution = 'high',
      language = 'en'
    } = options;

    try {
      switch (format) {
        case 'pdf_storyboard':
          return await this.exportPDFStoryboard(projectId, frames, project, { template, includeMetadata, language });
        
        case 'pdf_presentation':
          return await this.exportPDFPresentation(projectId, frames, project, { template, includeMetadata, language });
        
        case 'images_zip':
          return await this.exportImagesZip(projectId, frames, project, { resolution, language });
        
        case 'production_package':
          return await this.exportProductionPackage(projectId, frames, project, { template, resolution, language });
        
        case 'web_gallery':
          return await this.exportWebGallery(projectId, frames, project, { template, language });
        
        case 'video_preview':
          return await this.exportVideoPreview(projectId, frames, project, { resolution, language });
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export storyboard: ${error.message}`);
    }
  }

  /**
   * Export professional PDF storyboard
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportPDFStoryboard(projectId, frames, project, options = {}) {
    const { template = 'professional', includeMetadata = true, language = 'en' } = options;
    const templateConfig = this.templates[template];
    
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_storyboard_${Date.now()}.pdf`;
    const filepath = path.join(this.exportsPath, filename);
    
    const doc = new PDFDocument({
      size: 'A4',
      margins: templateConfig.margins,
      info: {
        Title: `${project.title} - Storyboard`,
        Author: 'Film Storyboard AI',
        Subject: 'AI-Generated Storyboard',
        Creator: 'Film Storyboard AI Platform',
        Producer: 'Film Storyboard AI',
        CreationDate: new Date()
      }
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add header
    await this.addPDFHeader(doc, project, templateConfig, language);
    
    // Add frames
    let frameCount = 0;
    for (const frame of frames) {
      if (frameCount > 0) {
        doc.addPage();
      }
      
      await this.addFrameToPDF(doc, frame, templateConfig, includeMetadata, language);
      frameCount++;
    }

    // Add footer with metadata
    if (includeMetadata) {
      await this.addPDFFooter(doc, project, frames, templateConfig, language);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          success: true,
          filepath,
          filename,
          url: `/exports/${filename}`,
          format: 'pdf_storyboard',
          fileSize: fs.statSync(filepath).size
        });
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Export presentation-ready PDF
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportPDFPresentation(projectId, frames, project, options = {}) {
    const { template = 'cinematic', includeMetadata = true, language = 'en' } = options;
    const templateConfig = this.templates[template];
    
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_presentation_${Date.now()}.pdf`;
    const filepath = path.join(this.exportsPath, filename);
    
    const doc = new PDFDocument({
      size: [1920, 1080], // 16:9 presentation format
      margins: { top: 80, bottom: 80, left: 120, right: 120 }
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Title slide
    await this.addPresentationTitleSlide(doc, project, templateConfig, language);
    
    // Frame slides with enhanced layout
    for (const frame of frames) {
      doc.addPage();
      await this.addFrameToPresentationPDF(doc, frame, templateConfig, language);
    }

    // Summary slide
    doc.addPage();
    await this.addPresentationSummarySlide(doc, project, frames, templateConfig, language);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({
          success: true,
          filepath,
          filename,
          url: `/exports/${filename}`,
          format: 'pdf_presentation',
          fileSize: fs.statSync(filepath).size
        });
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Export images as ZIP archive
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportImagesZip(projectId, frames, project, options = {}) {
    const { resolution = 'high', language = 'en' } = options;
    
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_images_${Date.now()}.zip`;
    const filepath = path.join(this.exportsPath, filename);
    
    const output = fs.createWriteStream(filepath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);

    // Add images with proper naming
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (frame.imageUrl) {
        try {
          const imagePath = path.join(__dirname, '../../generated_images', path.basename(frame.imageUrl));
          
          if (await fs.pathExists(imagePath)) {
            // Process image for desired resolution
            const processedImage = await this.processImageForExport(imagePath, resolution);
            const imageName = `scene_${String(frame.sceneNumber).padStart(3, '0')}_${frame.emotion}_${frame.id}.jpg`;
            
            archive.append(processedImage, { name: imageName });
          }
        } catch (error) {
          console.error(`Error processing image for frame ${frame.id}:`, error);
        }
      }
    }

    // Add metadata file
    const metadata = this.generateMetadata(project, frames, language);
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
    
    // Add README
    const readme = this.generateReadme(project, frames, language);
    archive.append(readme, { name: 'README.txt' });

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          success: true,
          filepath,
          filename,
          url: `/exports/${filename}`,
          format: 'images_zip',
          fileSize: archive.pointer()
        });
      });
      
      output.on('error', reject);
    });
  }

  /**
   * Export complete production package
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportProductionPackage(projectId, frames, project, options = {}) {
    const { template = 'professional', resolution = 'high', language = 'en' } = options;
    
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_production_package_${Date.now()}.zip`;
    const filepath = path.join(this.exportsPath, filename);
    
    const output = fs.createWriteStream(filepath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);

    // Export individual components
    const pdfStoryboard = await this.exportPDFStoryboard(projectId, frames, project, { template, language });
    const pdfPresentation = await this.exportPDFPresentation(projectId, frames, project, { template, language });
    
    // Add PDF files
    archive.file(pdfStoryboard.filepath, { name: `documents/${pdfStoryboard.filename}` });
    archive.file(pdfPresentation.filepath, { name: `documents/${pdfPresentation.filename}` });
    
    // Add images in different resolutions
    const resolutions = ['low', 'medium', 'high'];
    for (const res of resolutions) {
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame.imageUrl) {
          try {
            const imagePath = path.join(__dirname, '../../generated_images', path.basename(frame.imageUrl));
            
            if (await fs.pathExists(imagePath)) {
              const processedImage = await this.processImageForExport(imagePath, res);
              const imageName = `scene_${String(frame.sceneNumber).padStart(3, '0')}_${frame.emotion}.jpg`;
              
              archive.append(processedImage, { name: `images/${res}/${imageName}` });
            }
          } catch (error) {
            console.error(`Error processing image for frame ${frame.id}:`, error);
          }
        }
      }
    }
    
    // Add comprehensive metadata
    const metadata = {
      ...this.generateMetadata(project, frames, language),
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        format: 'production_package',
        template,
        resolution,
        language
      },
      technicalSpecs: {
        imageFormat: 'JPEG',
        pdfVersion: '1.7',
        colorSpace: 'sRGB',
        resolutions: {
          low: '1280x720',
          medium: '1920x1080',
          high: '3840x2160'
        }
      }
    };
    
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });
    
    // Add production notes
    const productionNotes = this.generateProductionNotes(project, frames, language);
    archive.append(productionNotes, { name: 'production_notes.md' });

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Clean up temporary files
        fs.remove(pdfStoryboard.filepath).catch(console.error);
        fs.remove(pdfPresentation.filepath).catch(console.error);
        
        resolve({
          success: true,
          filepath,
          filename,
          url: `/exports/${filename}`,
          format: 'production_package',
          fileSize: archive.pointer()
        });
      });
      
      output.on('error', reject);
    });
  }

  /**
   * Export web gallery
   * @param {string} projectId - Project ID
   * @param {Array} frames - Storyboard frames
   * @param {Object} project - Project details
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportWebGallery(projectId, frames, project, options = {}) {
    const { template = 'professional', language = 'en' } = options;
    
    const filename = `${project.title.replace(/[^a-z0-9]/gi, '_')}_gallery_${Date.now()}.zip`;
    const filepath = path.join(this.exportsPath, filename);
    
    const output = fs.createWriteStream(filepath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);

    // Generate HTML gallery
    const html = this.generateHTMLGallery(project, frames, template, language);
    archive.append(html, { name: 'index.html' });
    
    // Add CSS
    const css = this.generateGalleryCSS(template);
    archive.append(css, { name: 'styles.css' });
    
    // Add JavaScript
    const js = this.generateGalleryJS();
    archive.append(js, { name: 'script.js' });
    
    // Add images
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (frame.imageUrl) {
        try {
          const imagePath = path.join(__dirname, '../../generated_images', path.basename(frame.imageUrl));
          
          if (await fs.pathExists(imagePath)) {
            const processedImage = await this.processImageForExport(imagePath, 'medium');
            const imageName = `scene_${String(frame.sceneNumber).padStart(3, '0')}.jpg`;
            
            archive.append(processedImage, { name: `images/${imageName}` });
          }
        } catch (error) {
          console.error(`Error processing image for frame ${frame.id}:`, error);
        }
      }
    }

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          success: true,
          filepath,
          filename,
          url: `/exports/${filename}`,
          format: 'web_gallery',
          fileSize: archive.pointer()
        });
      });
      
      output.on('error', reject);
    });
  }

  /**
   * Process image for export with specified resolution
   * @param {string} imagePath - Path to source image
   * @param {string} resolution - Target resolution
   * @returns {Buffer} Processed image buffer
   */
  async processImageForExport(imagePath, resolution) {
    const resolutionMap = {
      'low': { width: 1280, height: 720, quality: 70 },
      'medium': { width: 1920, height: 1080, quality: 85 },
      'high': { width: 3840, height: 2160, quality: 95 }
    };
    
    const config = resolutionMap[resolution] || resolutionMap.medium;
    
    return await sharp(imagePath)
      .resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: config.quality })
      .toBuffer();
  }

  /**
   * Add header to PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Object} project - Project details
   * @param {Object} templateConfig - Template configuration
   * @param {string} language - Language
   */
  async addPDFHeader(doc, project, templateConfig, language) {
    const texts = this.getLocalizedTexts(language);
    
    doc.fontSize(24)
       .font(templateConfig.fonts.header)
       .fillColor(templateConfig.colors.primary)
       .text(project.title, templateConfig.margins.left, templateConfig.margins.top);
    
    doc.fontSize(12)
       .font(templateConfig.fonts.body)
       .fillColor(templateConfig.colors.secondary)
       .text(`${texts.storyboard} - ${texts.generatedBy}`, templateConfig.margins.left, templateConfig.margins.top + 40)
       .text(`${texts.date}: ${new Date().toLocaleDateString()}`, templateConfig.margins.left, templateConfig.margins.top + 55);
    
    // Add separator line
    doc.moveTo(templateConfig.margins.left, templateConfig.margins.top + 80)
       .lineTo(doc.page.width - templateConfig.margins.right, templateConfig.margins.top + 80)
       .strokeColor(templateConfig.colors.accent)
       .stroke();
  }

  /**
   * Add frame to PDF
   * @param {PDFDocument} doc - PDF document
   * @param {Object} frame - Frame data
   * @param {Object} templateConfig - Template configuration
   * @param {boolean} includeMetadata - Whether to include metadata
   * @param {string} language - Language
   */
  async addFrameToPDF(doc, frame, templateConfig, includeMetadata, language) {
    const texts = this.getLocalizedTexts(language);
    const startY = templateConfig.margins.top + 100;
    
    // Scene header
    doc.fontSize(16)
       .font(templateConfig.fonts.header)
       .fillColor(templateConfig.colors.primary)
       .text(`${texts.scene} ${frame.sceneNumber}`, templateConfig.margins.left, startY);
    
    // Emotion badge
    doc.fontSize(10)
       .font(templateConfig.fonts.caption)
       .fillColor(templateConfig.colors.accent)
       .text(`${texts.emotion}: ${frame.emotion}`, templateConfig.margins.left, startY + 25);
    
    // Image
    if (frame.imageUrl) {
      try {
        const imagePath = path.join(__dirname, '../../generated_images', path.basename(frame.imageUrl));
        
        if (await fs.pathExists(imagePath)) {
          const imageBuffer = await sharp(imagePath)
            .resize(400, 225, { fit: 'inside' })
            .jpeg({ quality: 90 })
            .toBuffer();
          
          doc.image(imageBuffer, templateConfig.margins.left, startY + 50, {
            width: 400,
            height: 225
          });
        }
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        
        // Add placeholder rectangle
        doc.rect(templateConfig.margins.left, startY + 50, 400, 225)
           .strokeColor(templateConfig.colors.secondary)
           .stroke();
        
        doc.fontSize(12)
           .fillColor(templateConfig.colors.secondary)
           .text(texts.imageNotAvailable, templateConfig.margins.left + 150, startY + 150);
      }
    }
    
    // Scene description
    doc.fontSize(11)
       .font(templateConfig.fonts.body)
       .fillColor(templateConfig.colors.primary)
       .text(frame.content, templateConfig.margins.left, startY + 290, {
         width: doc.page.width - templateConfig.margins.left - templateConfig.margins.right,
         align: 'left'
       });
    
    // Metadata
    if (includeMetadata && frame.metadata) {
      const metadataY = startY + 350;
      
      doc.fontSize(9)
         .font(templateConfig.fonts.caption)
         .fillColor(templateConfig.colors.secondary);
      
      if (frame.metadata.cameraAngle) {
        doc.text(`${texts.cameraAngle}: ${frame.metadata.cameraAngle}`, templateConfig.margins.left, metadataY);
      }
      
      if (frame.metadata.lighting) {
        doc.text(`${texts.lighting}: ${frame.metadata.lighting}`, templateConfig.margins.left, metadataY + 15);
      }
      
      if (frame.metadata.colorPalette) {
        doc.text(`${texts.colorPalette}: ${frame.metadata.colorPalette}`, templateConfig.margins.left, metadataY + 30);
      }
    }
  }

  /**
   * Generate metadata object
   * @param {Object} project - Project details
   * @param {Array} frames - Storyboard frames
   * @param {string} language - Language
   * @returns {Object} Metadata
   */
  generateMetadata(project, frames, language) {
    const texts = this.getLocalizedTexts(language);
    
    return {
      project: {
        title: project.title,
        id: project.id,
        language: project.language || language,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      },
      storyboard: {
        totalFrames: frames.length,
        emotions: [...new Set(frames.map(f => f.emotion))],
        avgConfidence: frames.reduce((sum, f) => sum + (f.confidence || 0), 0) / frames.length
      },
      frames: frames.map(frame => ({
        id: frame.id,
        sceneNumber: frame.sceneNumber,
        emotion: frame.emotion,
        confidence: frame.confidence,
        hasImage: !!frame.imageUrl,
        metadata: frame.metadata || {}
      })),
      export: {
        timestamp: new Date().toISOString(),
        generator: 'Film Storyboard AI v1.0.0',
        language
      }
    };
  }

  /**
   * Generate README content
   * @param {Object} project - Project details
   * @param {Array} frames - Storyboard frames
   * @param {string} language - Language
   * @returns {string} README content
   */
  generateReadme(project, frames, language) {
    const texts = this.getLocalizedTexts(language);
    
    return `${texts.storyboardExport}
${texts.project}: ${project.title}
${texts.totalFrames}: ${frames.length}
${texts.exportDate}: ${new Date().toLocaleDateString()}

${texts.fileDescription}:
- ${texts.imageFiles}: scene_XXX_emotion_id.jpg
- metadata.json: ${texts.technicalDetails}

${texts.generatedBy}: Film Storyboard AI Platform
${texts.website}: https://film-storyboard-ai.com
`;
  }

  /**
   * Generate production notes
   * @param {Object} project - Project details
   * @param {Array} frames - Storyboard frames
   * @param {string} language - Language
   * @returns {string} Production notes
   */
  generateProductionNotes(project, frames, language) {
    const texts = this.getLocalizedTexts(language);
    
    let notes = `# ${texts.productionNotes}\n\n`;
    notes += `## ${texts.project}: ${project.title}\n\n`;
    
    // Scene breakdown
    notes += `## ${texts.sceneBreakdown}\n\n`;
    frames.forEach(frame => {
      notes += `### ${texts.scene} ${frame.sceneNumber}\n`;
      notes += `- **${texts.emotion}**: ${frame.emotion}\n`;
      if (frame.metadata) {
        if (frame.metadata.cameraAngle) notes += `- **${texts.cameraAngle}**: ${frame.metadata.cameraAngle}\n`;
        if (frame.metadata.lighting) notes += `- **${texts.lighting}**: ${frame.metadata.lighting}\n`;
        if (frame.metadata.colorPalette) notes += `- **${texts.colorPalette}**: ${frame.metadata.colorPalette}\n`;
      }
      notes += `- **${texts.description}**: ${frame.content.substring(0, 200)}...\n\n`;
    });
    
    // Technical specifications
    notes += `## ${texts.technicalSpecs}\n\n`;
    notes += `- ${texts.imageFormat}: JPEG\n`;
    notes += `- ${texts.aspectRatio}: 16:9\n`;
    notes += `- ${texts.colorSpace}: sRGB\n`;
    notes += `- ${texts.generationTool}: AI Stable Diffusion\n\n`;
    
    notes += `---\n`;
    notes += `${texts.generatedBy}: Film Storyboard AI Platform\n`;
    notes += `${texts.exportDate}: ${new Date().toISOString()}\n`;
    
    return notes;
  }

  /**
   * Get localized texts for different languages
   * @param {string} language - Language code
   * @returns {Object} Localized texts
   */
  getLocalizedTexts(language) {
    const texts = {
      'en': {
        storyboard: 'Storyboard',
        generatedBy: 'Generated by Film Storyboard AI',
        date: 'Date',
        scene: 'Scene',
        emotion: 'Emotion',
        cameraAngle: 'Camera Angle',
        lighting: 'Lighting',
        colorPalette: 'Color Palette',
        imageNotAvailable: 'Image not available',
        storyboardExport: 'Storyboard Export',
        project: 'Project',
        totalFrames: 'Total Frames',
        exportDate: 'Export Date',
        fileDescription: 'File Description',
        imageFiles: 'Image Files',
        technicalDetails: 'Technical details and metadata',
        website: 'Website',
        productionNotes: 'Production Notes',
        sceneBreakdown: 'Scene Breakdown',
        description: 'Description',
        technicalSpecs: 'Technical Specifications',
        imageFormat: 'Image Format',
        aspectRatio: 'Aspect Ratio',
        colorSpace: 'Color Space',
        generationTool: 'Generation Tool'
      },
      'es': {
        storyboard: 'Storyboard',
        generatedBy: 'Generado por Film Storyboard AI',
        date: 'Fecha',
        scene: 'Escena',
        emotion: 'Emoción',
        cameraAngle: 'Ángulo de Cámara',
        lighting: 'Iluminación',
        colorPalette: 'Paleta de Colores',
        imageNotAvailable: 'Imagen no disponible',
        storyboardExport: 'Exportación de Storyboard',
        project: 'Proyecto',
        totalFrames: 'Total de Fotogramas',
        exportDate: 'Fecha de Exportación',
        fileDescription: 'Descripción de Archivos',
        imageFiles: 'Archivos de Imagen',
        technicalDetails: 'Detalles técnicos y metadatos',
        website: 'Sitio Web',
        productionNotes: 'Notas de Producción',
        sceneBreakdown: 'Desglose de Escenas',
        description: 'Descripción',
        technicalSpecs: 'Especificaciones Técnicas',
        imageFormat: 'Formato de Imagen',
        aspectRatio: 'Relación de Aspecto',
        colorSpace: 'Espacio de Color',
        generationTool: 'Herramienta de Generación'
      },
      'fr': {
        storyboard: 'Storyboard',
        generatedBy: 'Généré par Film Storyboard AI',
        date: 'Date',
        scene: 'Scène',
        emotion: 'Émotion',
        cameraAngle: 'Angle de Caméra',
        lighting: 'Éclairage',
        colorPalette: 'Palette de Couleurs',
        imageNotAvailable: 'Image non disponible',
        storyboardExport: 'Export du Storyboard',
        project: 'Projet',
        totalFrames: 'Total des Images',
        exportDate: 'Date d\'Export',
        fileDescription: 'Description des Fichiers',
        imageFiles: 'Fichiers d\'Image',
        technicalDetails: 'Détails techniques et métadonnées',
        website: 'Site Web',
        productionNotes: 'Notes de Production',
        sceneBreakdown: 'Répartition des Scènes',
        description: 'Description',
        technicalSpecs: 'Spécifications Techniques',
        imageFormat: 'Format d\'Image',
        aspectRatio: 'Ratio d\'Aspect',
        colorSpace: 'Espace Colorimétrique',
        generationTool: 'Outil de Génération'
      }
    };
    
    return texts[language] || texts['en'];
  }

  /**
   * Generate HTML gallery
   * @param {Object} project - Project details
   * @param {Array} frames - Storyboard frames
   * @param {string} template - Template name
   * @param {string} language - Language
   * @returns {string} HTML content
   */
  generateHTMLGallery(project, frames, template, language) {
    const texts = this.getLocalizedTexts(language);
    
    return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - ${texts.storyboard}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body class="${template}">
    <header class="gallery-header">
        <h1>${project.title}</h1>
        <p>${texts.storyboard} - ${frames.length} ${texts.totalFrames}</p>
        <p>${texts.generatedBy}</p>
    </header>
    
    <main class="gallery-main">
        <div class="frames-grid">
            ${frames.map((frame, index) => `
                <div class="frame-card" data-scene="${frame.sceneNumber}">
                    <div class="frame-header">
                        <span class="scene-number">${texts.scene} ${frame.sceneNumber}</span>
                        <span class="emotion-badge emotion-${frame.emotion}">${frame.emotion}</span>
                    </div>
                    <div class="frame-image">
                        <img src="images/scene_${String(frame.sceneNumber).padStart(3, '0')}.jpg" 
                             alt="${texts.scene} ${frame.sceneNumber}" 
                             onclick="openModal(${index})">
                    </div>
                    <div class="frame-description">
                        <p>${frame.content.substring(0, 150)}...</p>
                    </div>
                </div>
            `).join('')}
        </div>
    </main>
    
    <div id="modal" class="modal" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
            <span class="close" onclick="closeModal()">&times;</span>
            <img id="modal-image" src="" alt="">
            <div class="modal-info">
                <h3 id="modal-title"></h3>
                <p id="modal-description"></p>
            </div>
            <div class="modal-nav">
                <button onclick="prevImage()">&larr; ${texts.scene}</button>
                <button onclick="nextImage()">${texts.scene} &rarr;</button>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;
  }

  /**
   * Generate CSS for gallery
   * @param {string} template - Template name
   * @returns {string} CSS content
   */
  generateGalleryCSS(template) {
    const templateConfig = this.templates[template];
    
    return `
:root {
    --primary: ${templateConfig.colors.primary};
    --secondary: ${templateConfig.colors.secondary};
    --accent: ${templateConfig.colors.accent};
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Helvetica', sans-serif;
    background: #f5f5f5;
    color: var(--primary);
    line-height: 1.6;
}

.gallery-header {
    background: white;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.gallery-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--primary);
}

.gallery-header p {
    color: var(--secondary);
    font-size: 1.1rem;
}

.gallery-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.frames-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 1rem;
}

.frame-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.frame-card:hover {
    transform: translateY(-5px);
}

.frame-header {
    padding: 1rem;
    background: var(--primary);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.emotion-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 15px;
    font-size: 0.8rem;
    background: var(--accent);
}

.frame-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.frame-image img:hover {
    transform: scale(1.05);
}

.frame-description {
    padding: 1rem;
}

.frame-description p {
    color: var(--secondary);
    font-size: 0.9rem;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
}

.modal-content {
    position: relative;
    margin: 5% auto;
    max-width: 80%;
    max-height: 80%;
    background: white;
    border-radius: 10px;
    overflow: hidden;
}

.modal-content img {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: contain;
}

.modal-info {
    padding: 1rem;
}

.modal-nav {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
}

.modal-nav button {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.close {
    position: absolute;
    top: 10px;
    right: 20px;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    z-index: 1001;
}

@media (max-width: 768px) {
    .frames-grid {
        grid-template-columns: 1fr;
    }
    
    .modal-content {
        margin: 10% auto;
        max-width: 95%;
    }
}
`;
  }

  /**
   * Generate JavaScript for gallery
   * @returns {string} JavaScript content
   */
  generateGalleryJS() {
    return `
let currentIndex = 0;
const frames = document.querySelectorAll('.frame-card');

function openModal(index) {
    currentIndex = index;
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    
    const frame = frames[index];
    const img = frame.querySelector('img');
    const sceneNumber = frame.dataset.scene;
    const description = frame.querySelector('.frame-description p').textContent;
    
    modalImage.src = img.src;
    modalTitle.textContent = \`Scene \${sceneNumber}\`;
    modalDescription.textContent = description;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function nextImage() {
    currentIndex = (currentIndex + 1) % frames.length;
    openModal(currentIndex);
}

function prevImage() {
    currentIndex = (currentIndex - 1 + frames.length) % frames.length;
    openModal(currentIndex);
}

document.addEventListener('keydown', function(e) {
    if (document.getElementById('modal').style.display === 'block') {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    }
});
`;
  }

  /**
   * Get available export formats
   * @returns {Object} Available formats
   */
  getAvailableFormats() {
    return this.formats;
  }

  /**
   * Get available templates
   * @returns {Object} Available templates
   */
  getAvailableTemplates() {
    return this.templates;
  }

  /**
   * Clean up old export files
   * @param {number} maxAge - Maximum age in milliseconds
   */
  async cleanupOldExports(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      const files = await fs.readdir(this.exportsPath);
      const now = Date.now();
      
      for (const file of files) {
        const filepath = path.join(this.exportsPath, file);
        const stats = await fs.stat(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filepath);
          console.log(`Cleaned up old export: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new ExportService();