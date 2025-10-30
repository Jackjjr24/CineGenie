const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs-extra');
const databaseService = require('../services/databaseService');
const imageService = require('../services/imageService');

// Get storyboard frames for a project
router.get('/project/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const frames = await databaseService.getFramesByProject(projectId);
    res.json(frames);
  } catch (error) {
    console.error('Get storyboard frames error:', error);
    res.status(500).json({ error: 'Failed to fetch storyboard frames' });
  }
});

// Regenerate image for a specific frame
router.post('/frame/:frameId/regenerate', async (req, res) => {
  try {
    const frameId = parseInt(req.params.frameId);
    const { customPrompt, imageStyle = 'realistic' } = req.body;

    console.log(`🔄 Regenerating frame ${frameId}...`);

    // Get the frame and associated scene
    const frameData = await databaseService.getOneQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.id = ?
    `, [frameId]);

    if (!frameData) {
      console.log(`❌ Frame ${frameId} not found`);
      return res.status(404).json({ error: 'Frame not found' });
    }

    console.log(`✅ Found frame ${frameId}, scene: ${frameData.scene_content?.substring(0, 50)}...`);
    console.log(`   Emotion: ${frameData.emotion}`);

    // Generate new image
    const newImageUrl = await imageService.regenerateImage(
      frameData.scene_content,
      frameData.emotion,
      customPrompt,
      imageStyle
    );

    console.log(`✅ Generated new image: ${newImageUrl}`);

    // Update frame in database
    await databaseService.updateFrameImage(frameId, newImageUrl);

    console.log(`✅ Frame ${frameId} regenerated successfully`);

    res.json({
      success: true,
      frameId,
      newImageUrl,
      message: 'Frame regenerated successfully'
    });

  } catch (error) {
    console.error('❌ Regenerate frame error:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate frame',
      details: error.message 
    });
  }
});

// Regenerate image with custom prompt
router.post('/frame/:frameId/regenerate-with-prompt', async (req, res) => {
  try {
    const frameId = parseInt(req.params.frameId);
    const { prompt, imageStyle = 'realistic' } = req.body;

    console.log(`🔄 Regenerating frame ${frameId} with custom prompt...`);

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get the frame and associated scene
    const frameData = await databaseService.getOneQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.id = ?
    `, [frameId]);

    if (!frameData) {
      console.log(`❌ Frame ${frameId} not found`);
      return res.status(404).json({ error: 'Frame not found' });
    }

    console.log(`✅ Found frame ${frameId}, scene: ${frameData.scene_content?.substring(0, 50)}...`);
    console.log(`   Emotion: ${frameData.emotion}`);
    console.log(`   Custom prompt: ${prompt.trim()}`);

    // Generate new image with custom prompt
    const newImageUrl = await imageService.generateImageWithCustomPrompt(
      frameData.scene_content,
      frameData.emotion,
      prompt.trim(),
      imageStyle
    );

    console.log(`✅ Generated new image: ${newImageUrl}`);

    // Update frame in database with new image and custom prompt
    await databaseService.runQuery(`
      UPDATE storyboard_frames 
      SET image_url = ?, prompt = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [newImageUrl, prompt.trim(), frameId]);

    console.log(`✅ Frame ${frameId} regenerated with custom prompt successfully`);

    res.json({
      success: true,
      frameId,
      imageUrl: newImageUrl,
      prompt: prompt.trim(),
      message: 'Image regenerated with custom prompt successfully'
    });

  } catch (error) {
    console.error('❌ Regenerate with custom prompt error:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate image with custom prompt',
      details: error.message 
    });
  }
});

// Update frame order (for rearranging storyboard)
router.put('/frame/:frameId/order', async (req, res) => {
  try {
    const frameId = parseInt(req.params.frameId);
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      return res.status(400).json({ error: 'New order must be a number' });
    }

    await databaseService.updateFrameOrder(frameId, newOrder);

    res.json({
      success: true,
      frameId,
      newOrder,
      message: 'Frame order updated successfully'
    });

  } catch (error) {
    console.error('Update frame order error:', error);
    res.status(500).json({ error: 'Failed to update frame order' });
  }
});

// Delete a storyboard frame
router.delete('/frame/:frameId', async (req, res) => {
  try {
    const frameId = parseInt(req.params.frameId);

    // Check if frame exists
    const frame = await databaseService.getQuery(
      'SELECT id FROM storyboard_frames WHERE id = ?',
      [frameId]
    );

    if (!frame.length) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    await databaseService.deleteFrame(frameId);

    res.json({
      success: true,
      frameId,
      message: 'Frame deleted successfully'
    });

  } catch (error) {
    console.error('Delete frame error:', error);
    res.status(500).json({ error: 'Failed to delete frame' });
  }
});

// Bulk update frame orders (for drag-and-drop reordering)
router.put('/frames/reorder', async (req, res) => {
  try {
    const { frameOrders } = req.body;

    if (!Array.isArray(frameOrders)) {
      return res.status(400).json({ error: 'Frame orders must be an array' });
    }

    // Update all frame orders in a transaction-like manner
    const updatePromises = frameOrders.map(({ frameId, order }) => 
      databaseService.updateFrameOrder(frameId, order)
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      updatedCount: frameOrders.length,
      message: 'Frame order updated successfully'
    });

  } catch (error) {
    console.error('Bulk reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder frames' });
  }
});

// Get frame analytics for a project
router.get('/project/:id/analytics', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const emotionStats = await databaseService.getQuery(`
      SELECT 
        s.emotion,
        COUNT(*) as frame_count,
        AVG(s.confidence) as avg_confidence
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.project_id = ?
      GROUP BY s.emotion
      ORDER BY frame_count DESC
    `, [projectId]);

    const totalFrames = await databaseService.getOneQuery(`
      SELECT COUNT(*) as total
      FROM storyboard_frames
      WHERE project_id = ?
    `, [projectId]);

    res.json({
      emotionStats,
      totalFrames: totalFrames.total,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Export storyboard as PDF
router.get('/project/:id/export/pdf', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    console.log(`📄 Exporting storyboard ${projectId} to PDF...`);
    
    // Get project details and frames
    const project = await databaseService.getOneQuery(`
      SELECT * FROM projects WHERE id = ?
    `, [projectId]);

    if (!project) {
      console.log(`❌ Project ${projectId} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }

    const frames = await databaseService.getQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion, s.scene_number
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.project_id = ?
      ORDER BY s.scene_number ASC
    `, [projectId]);

    if (frames.length === 0) {
      return res.status(404).json({ error: 'No frames found for this project' });
    }

    console.log(`✅ Found ${frames.length} frames for project "${project.title}"`);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Set response headers for PDF download
    const filename = `storyboard_${project.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title page
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('STORYBOARD', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(18)
       .font('Helvetica')
       .text(project.title, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#666')
       .text(`${frames.length} Frames`, { align: 'center' });

    doc.moveDown(2);

    // Add each frame to the PDF
    const imagesDir = path.join(__dirname, '../../generated_images');
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // Add page break if not first frame
      if (i > 0) {
        doc.addPage();
      } else {
        doc.addPage(); // New page after title
      }

      console.log(`  Adding frame ${i + 1}/${frames.length} to PDF...`);

      // Frame header
      doc.fontSize(14)
         .fillColor('#000')
         .font('Helvetica-Bold')
         .text(`Scene ${frame.scene_number || i + 1}`, 50, 50);

      // Emotion badge
      doc.fontSize(10)
         .fillColor('#666')
         .font('Helvetica')
         .text(`Emotion: ${frame.emotion}`, 50, 70);

      // Add image if it exists
      const imagePath = path.join(imagesDir, path.basename(frame.image_url));
      
      if (await fs.pathExists(imagePath)) {
        try {
          // Add image with proper sizing
          const imageY = 100;
          const maxWidth = 495; // A4 width minus margins
          const maxHeight = 280;
          
          doc.image(imagePath, 50, imageY, {
            fit: [maxWidth, maxHeight],
            align: 'center'
          });

          // Scene description below image
          const textY = imageY + maxHeight + 20;
          doc.fontSize(10)
             .fillColor('#333')
             .font('Helvetica')
             .text(frame.scene_content || 'No description', 50, textY, {
               width: maxWidth,
               align: 'left'
             });

        } catch (imgError) {
          console.error(`   ❌ Error adding image for frame ${i + 1}:`, imgError.message);
          doc.fontSize(10)
             .fillColor('#999')
             .text('[Image not available]', 50, 100);
          
          doc.fontSize(10)
             .fillColor('#333')
             .font('Helvetica')
             .text(frame.scene_content || 'No description', 50, 130, {
               width: 495,
               align: 'left'
             });
        }
      } else {
        console.log(`   ⚠️ Image not found: ${imagePath}`);
        doc.fontSize(10)
           .fillColor('#999')
           .text('[Image not found]', 50, 100);
        
        doc.fontSize(10)
           .fillColor('#333')
           .font('Helvetica')
           .text(frame.scene_content || 'No description', 50, 130, {
             width: 495,
             align: 'left'
           });
      }
    }

    // Finalize PDF
    doc.end();
    
    console.log(`✅ PDF export complete: ${filename}`);

  } catch (error) {
    console.error('❌ PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF', details: error.message });
  }
});

module.exports = router;