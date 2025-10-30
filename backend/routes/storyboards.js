const express = require('express');
const router = express.Router();
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

    // Get the frame and associated scene
    const frame = await databaseService.getQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.id = ?
    `, [frameId]);

    if (!frame.length) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    const frameData = frame[0];

    // Generate new image
    const newImageUrl = await imageService.regenerateImage(
      frameData.scene_content,
      frameData.emotion,
      customPrompt,
      imageStyle
    );

    // Update frame in database
    await databaseService.updateFrameImage(frameId, newImageUrl);

    res.json({
      success: true,
      frameId,
      newImageUrl,
      message: 'Frame regenerated successfully'
    });

  } catch (error) {
    console.error('Regenerate frame error:', error);
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

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get the frame and associated scene
    const frame = await databaseService.getQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.id = ?
    `, [frameId]);

    if (!frame.length) {
      return res.status(404).json({ error: 'Frame not found' });
    }

    const frameData = frame[0];

    // Generate new image with custom prompt
    const newImageUrl = await imageService.generateImageWithCustomPrompt(
      frameData.scene_content,
      frameData.emotion,
      prompt.trim(),
      imageStyle
    );

    // Update frame in database with new image and prompt
    await databaseService.runQuery(`
      UPDATE storyboard_frames 
      SET image_url = ?, prompt = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [newImageUrl, prompt.trim(), frameId]);

    res.json({
      success: true,
      frameId,
      imageUrl: newImageUrl,
      prompt: prompt.trim(),
      message: 'Image regenerated with custom prompt successfully'
    });

  } catch (error) {
    console.error('Regenerate with custom prompt error:', error);
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
    
    // Get project details and frames
    const project = await databaseService.getOneQuery(`
      SELECT * FROM projects WHERE id = ?
    `, [projectId]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const frames = await databaseService.getQuery(`
      SELECT sf.*, s.content as scene_content, s.emotion
      FROM storyboard_frames sf
      JOIN scenes s ON sf.scene_id = s.id
      WHERE sf.project_id = ?
      ORDER BY sf.order_index ASC
    `, [projectId]);

    // For now, return a simple message - PDF generation would require additional libraries
    res.json({
      message: 'PDF export feature coming soon!',
      project: project.title,
      frameCount: frames.length,
      frames: frames.map(f => ({
        sceneNumber: f.scene_id,
        emotion: f.emotion,
        imageUrl: f.image_url,
        content: f.scene_content?.substring(0, 100) + '...'
      }))
    });

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;