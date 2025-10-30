const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await databaseService.getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID with statistics
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const [project, stats] = await Promise.all([
      databaseService.getProject(projectId),
      databaseService.getProjectStats(projectId)
    ]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      ...project,
      stats
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get project scenes
router.get('/:id/scenes', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const scenes = await databaseService.getScenesByProject(projectId);
    res.json(scenes);
  } catch (error) {
    console.error('Get scenes error:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { title, scriptContent } = req.body;

    if (!title || !scriptContent) {
      return res.status(400).json({ error: 'Title and script content are required' });
    }

    await databaseService.updateProject(projectId, { title, scriptContent });
    
    const updatedProject = await databaseService.getProject(projectId);
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const project = await databaseService.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await databaseService.deleteProject(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update scene emotion
router.put('/:projectId/scenes/:sceneId/emotion', async (req, res) => {
  try {
    const sceneId = parseInt(req.params.sceneId);
    const { emotion, confidence } = req.body;

    if (!emotion) {
      return res.status(400).json({ error: 'Emotion is required' });
    }

    await databaseService.updateSceneEmotion(sceneId, emotion, confidence || 0.8);
    
    const updatedScene = await databaseService.getScene(sceneId);
    res.json(updatedScene);
  } catch (error) {
    console.error('Update scene emotion error:', error);
    res.status(500).json({ error: 'Failed to update scene emotion' });
  }
});

module.exports = router;