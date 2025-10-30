import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Move,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Heart,
  Zap,
  Frown,
  Smile,
  AlertTriangle,
  Meh,
  Settings,
  BarChart3,
  Maximize2,
  X,
  Loader,
  Package,
  FileDown
} from 'lucide-react';
import { apiService } from '../services/api';
import FullScreenImageViewer from '../components/FullScreenImageViewer';
import toast from 'react-hot-toast';

const Storyboard = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingFrame, setRegeneratingFrame] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [editingFrame, setEditingFrame] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedImageStyle, setSelectedImageStyle] = useState('realistic');
  const [availableStyles, setAvailableStyles] = useState([]);
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchAvailableStyles();
    }
  }, [projectId]);

  const fetchAvailableStyles = async () => {
    try {
      const response = await apiService.getImageStyles();
      if (response.data.success) {
        setAvailableStyles(response.data.styles);
      }
    } catch (error) {
      console.error('Error fetching image styles:', error);
      // Set default styles as fallback
      setAvailableStyles([
        { key: 'realistic', name: 'Realistic' },
        { key: 'cinematic', name: 'Cinematic' },
        { key: 'cartoon', name: 'Cartoon' },
        { key: 'comic', name: 'Comic Book' },
        { key: 'noir', name: 'Film Noir' },
        { key: 'anime', name: 'Anime' }
      ]);
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectResponse, framesResponse, scenesResponse] = await Promise.all([
        apiService.getProject(projectId),
        apiService.getStoryboardFrames(projectId),
        apiService.getProjectScenes(projectId)
      ]);

      setProject(projectResponse.data);
      setScenes(scenesResponse.data || []);
      
      // Validate and structure frames data
      const validatedFrames = (framesResponse.data || []).map((frame, index) => ({
        ...frame,
        id: frame.id || frame.sceneId || `frame-${index}`,
        sceneNumber: frame.sceneNumber || frame.scene_number || index + 1,
        emotion: frame.emotion || 'neutral',
        content: frame.content || frame.scene_content || '',
        customPrompt: frame.prompt || frame.custom_prompt || '', // Custom prompt from editing
        imageUrl: frame.imageUrl || frame.image_url || null
      }));
      setFrames(validatedFrames);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load storyboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (generating) return;
    
    setGenerating(true);
    toast.loading('Generating storyboard frames...', { duration: 30000 });

    try {
      const response = await apiService.generateStoryboard(projectId, selectedImageStyle);
      
      if (response.data.success) {
        // Ensure frames have proper structure with fallback IDs
        const validatedFrames = (response.data.frames || []).map((frame, index) => ({
          ...frame,
          id: frame.id || frame.sceneId || `generated-frame-${index}`,
          sceneNumber: frame.sceneNumber || index + 1,
          emotion: frame.emotion || 'neutral',
          content: frame.content || '',
          imageUrl: frame.imageUrl || null
        }));
        setFrames(validatedFrames);
        toast.success(`Generated ${validatedFrames.length} storyboard frames!`);
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate storyboard');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateFrame = async (frameId, sceneContent, emotion) => {
    if (regeneratingFrame === frameId) return;

    setRegeneratingFrame(frameId);
    toast.loading('Regenerating frame...', { duration: 15000 });

    try {
      const response = await apiService.regenerateFrame(frameId, null, selectedImageStyle);
      
      if (response.data.success) {
        // Update the frame in the local state
        setFrames(frames.map(frame => 
          frame.id === frameId 
            ? { ...frame, imageUrl: response.data.newImageUrl }
            : frame
        ));
        toast.success('Frame regenerated successfully!');
      } else {
        throw new Error(response.data.error || 'Regeneration failed');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      toast.error(error.response?.data?.error || 'Failed to regenerate frame');
    } finally {
      setRegeneratingFrame(null);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(frames);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFrames(items);

    try {
      const frameOrders = items.map((frame, index) => ({
        frameId: frame.id,
        order: index + 1
      }));

      await apiService.reorderFrames(frameOrders);
      toast.success('Frames reordered successfully!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save frame order');
      // Revert on error
      fetchProjectData();
    }
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: <Smile className="emotion-icon" />,
      sad: <Frown className="emotion-icon" />,
      angry: <AlertTriangle className="emotion-icon" />,
      fearful: <AlertTriangle className="emotion-icon" />,
      romantic: <Heart className="emotion-icon" />,
      dramatic: <Zap className="emotion-icon" />,
      neutral: <Meh className="emotion-icon" />
    };
    return icons[emotion] || <Meh className="emotion-icon" />;
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#10b981',
      sad: '#3b82f6',
      angry: '#ef4444',
      fearful: '#8b5cf6',
      romantic: '#ec4899',
      dramatic: '#f59e0b',
      neutral: '#6b7280'
    };
    return colors[emotion] || colors.neutral;
  };

  const handleOpenFullScreen = (frameIndex) => {
    setFullScreenIndex(frameIndex);
    setIsFullScreenOpen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreenOpen(false);
  };

  const handleNavigateFullScreen = (newIndex) => {
    setFullScreenIndex(newIndex);
  };

  const handleEditImage = (frame) => {
    setEditingFrame(frame);
    setEditPrompt(frame.customPrompt || frame.prompt || '');
  };

  const handleCancelEdit = () => {
    setEditingFrame(null);
    setEditPrompt('');
  };

  const handleSaveEditedImage = async () => {
    if (!editingFrame || !editPrompt.trim()) {
      toast.error('Please enter a prompt to regenerate the image');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await apiService.regenerateFrameWithPrompt(editingFrame.id, editPrompt.trim(), selectedImageStyle);
      
      if (response.data.success) {
        // Update the frame in the local state
        setFrames(prevFrames => 
          prevFrames.map(frame => 
            frame.id === editingFrame.id 
              ? { ...frame, imageUrl: response.data.imageUrl, customPrompt: editPrompt.trim(), prompt: editPrompt.trim() }
              : frame
          )
        );
        toast.success('Image regenerated successfully!');
        handleCancelEdit();
      } else {
        throw new Error(response.data.error || 'Failed to regenerate image');
      }
    } catch (error) {
      console.error('Image regeneration error:', error);
      toast.error(error.response?.data?.error || 'Failed to regenerate image');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportAllImages = async () => {
    setIsExporting(true);
    try {
      const validFrames = frames.filter(frame => frame.imageUrl);
      
      if (validFrames.length === 0) {
        toast.error('No images to export');
        return;
      }

      // Download images one by one
      for (let i = 0; i < validFrames.length; i++) {
        const frame = validFrames[i];
        try {
          const response = await fetch(`http://localhost:5000${frame.imageUrl}`);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_scene_${frame.sceneNumber}_${frame.emotion}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          // Small delay between downloads to prevent browser blocking
          if (i < validFrames.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to download image for scene ${frame.sceneNumber}:`, error);
        }
      }
      
      toast.success(`Successfully exported ${validFrames.length} images!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export images');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStoryboardPDF = async () => {
    const loadingToast = toast.loading('Generating PDF storyboard...');
    try {
      const response = await apiService.exportStoryboardPDF(projectId);
      
      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, '_')}_storyboard.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF storyboard exported successfully!', { id: loadingToast });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF storyboard', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="storyboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading storyboard...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error-state">
        <h2>Project not found</h2>
        <Link to="/projects" className="btn btn-primary">
          <ArrowLeft size={20} />
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="storyboard">
      <div className="storyboard-header">
        <div className="header-main">
          <Link to="/projects" className="back-btn">
            <ArrowLeft size={20} />
            Back to Projects
          </Link>
          
          <div className="project-info">
            <h1>{project.title}</h1>
            <div className="project-meta">
              <span>{frames && frames.length ? frames.length : 0} frames</span>
              {project.stats && (
                <span>{project.stats.sceneCount} scenes</span>
              )}
            </div>
          </div>

          {/* Image Style Selector */}
          <div className="style-selector">
            <label htmlFor="image-style">Image Style:</label>
            <select
              id="image-style"
              value={selectedImageStyle}
              onChange={(e) => setSelectedImageStyle(e.target.value)}
              className="style-select"
            >
              {availableStyles.map((style) => (
                <option key={style.key} value={style.key}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-ghost"
            onClick={handleExportAllImages}
            disabled={!frames.some(f => f.imageUrl) || isExporting}
            title="Export all images"
          >
            {isExporting ? (
              <Loader className="spinner" size={20} />
            ) : (
              <Package size={20} />
            )}
            Export Images
          </button>

          <button
            className="btn btn-ghost"
            onClick={handleExportStoryboardPDF}
            disabled={!frames.some(f => f.imageUrl)}
            title="Export as PDF"
          >
            <FileDown size={20} />
            Export PDF
          </button>

          <button
            className={`btn btn-ghost ${dragMode ? 'active' : ''}`}
            onClick={() => setDragMode(!dragMode)}
            title="Toggle drag mode"
          >
            <Move size={20} />
            {dragMode ? 'Exit Drag Mode' : 'Rearrange'}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {(!frames || frames.length === 0) ? (
            <button
              className="btn btn-primary"
              onClick={handleGenerateStoryboard}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="spinner" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon size={20} />
                  Generate Storyboard
                </>
              )}
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={handleGenerateStoryboard}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="spinner" size={20} />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Regenerate All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!frames || frames.length === 0 ? (
        <div className="empty-storyboard">
          <ImageIcon className="empty-icon" />
          <h3>No storyboard frames yet</h3>
          <p>Generate your first storyboard to see AI-created visuals based on your script's emotions</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerateStoryboard}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className="spinner" size={20} />
                Generating Storyboard...
              </>
            ) : (
              <>
                <ImageIcon size={20} />
                Generate Storyboard
              </>
            )}
          </button>
        </div>
      ) : (
        frames && frames.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="storyboard" direction="horizontal">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`storyboard-grid ${dragMode ? 'drag-mode' : ''} ${
                  snapshot.isDraggingOver ? 'drag-active' : ''
                }`}
              >
                {frames.map((frame, index) => {
                  // Ensure frame has proper id, fallback to index if needed
                  const frameId = frame.id || frame.sceneId || `frame-${index}`;
                  return (
                  <Draggable
                    key={frameId}
                    draggableId={String(frameId)}
                    index={index}
                    isDragDisabled={!dragMode}
                  >
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`storyboard-frame ${
                          snapshot.isDragging ? 'dragging' : ''
                        } ${regeneratingFrame === frameId ? 'regenerating' : ''}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {dragMode && (
                          <div {...provided.dragHandleProps} className="drag-handle">
                            <Move size={16} />
                          </div>
                        )}

                        <div className="frame-header">
                          <div className="scene-info">
                            <span className="scene-number">Scene {frame.sceneNumber}</span>
                            <div 
                              className="emotion-badge"
                              style={{ 
                                backgroundColor: `${getEmotionColor(frame.emotion)}20`,
                                color: getEmotionColor(frame.emotion)
                              }}
                            >
                              {getEmotionIcon(frame.emotion)}
                              {frame.emotion}
                            </div>
                          </div>
                          
                          {!dragMode && (
                            <div className="frame-actions">
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleEditImage(frame)}
                                title="Edit image with prompt"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleRegenerateFrame(frameId, frame.content, frame.emotion)}
                                disabled={regeneratingFrame === frameId}
                                title="Regenerate frame"
                              >
                                <RefreshCw 
                                  size={14} 
                                  className={regeneratingFrame === frameId ? 'spinner' : ''}
                                />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="frame-image">
                          {frame.imageUrl ? (
                            <div className="frame-image-container">
                              <img
                                src={`http://localhost:5000${frame.imageUrl}`}
                                alt={`Scene ${frame.sceneNumber} - ${frame.emotion}`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                              <button
                                className="fullscreen-btn"
                                onClick={() => handleOpenFullScreen(index)}
                                title="View in full screen"
                              >
                                <Maximize2 size={16} />
                              </button>
                            </div>
                          ) : null}
                          
                          <div className="image-placeholder" style={{ 
                            display: frame.imageUrl ? 'none' : 'flex' 
                          }}>
                            <ImageIcon size={32} />
                            <span>Failed to load</span>
                          </div>

                          {regeneratingFrame === frameId && (
                            <div className="regenerating-overlay">
                              <RefreshCw className="spinner" size={24} />
                              <span>Regenerating...</span>
                            </div>
                          )}
                        </div>

                        <div className="frame-content">
                          {frame.customPrompt ? (
                            <>
                              <p className="custom-prompt-label">
                                <Edit3 size={12} style={{ marginRight: '4px' }} />
                                Custom Prompt
                              </p>
                              <p>{frame.customPrompt.substring(0, 120)}...</p>
                            </>
                          ) : (
                            <p>{frame.content?.substring(0, 120)}...</p>
                          )}
                        </div>

                        {/* Cinematography Suggestions */}
                        {(() => {
                          const matchingScene = scenes.find(s => s.id === frame.scene_id || s.scene_number === frame.sceneNumber);
                          if (matchingScene && (matchingScene.camera_suggestion || matchingScene.lighting_suggestion)) {
                            return (
                              <div className="cinematography-suggestions">
                                <div className="suggestions-header">
                                  <Zap size={14} />
                                  <span>AI Cinematography Suggestions</span>
                                </div>
                                {matchingScene.camera_suggestion && (
                                  <div className="suggestion-item">
                                    <strong>📹 Camera:</strong>
                                    <p>{matchingScene.camera_suggestion}</p>
                                  </div>
                                )}
                                {matchingScene.lighting_suggestion && (
                                  <div className="suggestion-item">
                                    <strong>💡 Lighting:</strong>
                                    <p>{matchingScene.lighting_suggestion}</p>
                                  </div>
                                )}
                                {matchingScene.suggestion_reasoning && (
                                  <div className="suggestion-item reasoning">
                                    <strong>💭 Reasoning:</strong>
                                    <p>{matchingScene.suggestion_reasoning}</p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </motion.div>
                    )}
                  </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        )
      )}

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        isOpen={isFullScreenOpen}
        onClose={handleCloseFullScreen}
        frames={frames}
        currentIndex={fullScreenIndex}
        onNavigate={handleNavigateFullScreen}
      />

      {/* Edit Image Modal */}
      <AnimatePresence>
        {editingFrame && (
          <motion.div 
            className="edit-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelEdit}
          >
            <motion.div 
              className="edit-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="edit-modal-header">
                <h3>Edit Image - Scene {editingFrame.sceneNumber}</h3>
                <button className="close-btn" onClick={handleCancelEdit}>
                  <X size={20} />
                </button>
              </div>

              <div className="edit-modal-content">
                <div className="current-image">
                  {editingFrame.imageUrl && (
                    <img
                      src={`http://localhost:5000${editingFrame.imageUrl}`}
                      alt={`Scene ${editingFrame.sceneNumber}`}
                    />
                  )}
                </div>

                <div className="edit-form">
                  <label className="form-label">
                    <Edit3 size={16} />
                    Custom Prompt
                  </label>
                  <textarea
                    className="edit-prompt-input"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe how you want to change this image...

Examples:
- Change the lighting to golden hour
- Add rain and darker atmosphere
- Make it more colorful and vibrant
- Add more characters in the background"
                    rows={6}
                  />
                  <div className="character-count">
                    {editPrompt.length} characters
                  </div>
                </div>

                <div className="edit-modal-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={handleCancelEdit}
                    disabled={isRegenerating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEditedImage}
                    disabled={!editPrompt.trim() || isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader className="spinner" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Edit3 size={16} />
                        Generate New Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .storyboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-xl) 0;
        }

        .storyboard-loading,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--spacing-lg);
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--tertiary-bg);
          border-top: 3px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .storyboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-3xl);
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .header-main {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          flex: 1;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--secondary-text);
          text-decoration: none;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          transition: all var(--transition-normal);
        }

        .back-btn:hover {
          background: var(--secondary-bg);
          color: var(--primary-text);
        }

        .project-info h1 {
          margin: 0 0 var(--spacing-xs);
          font-size: 1.75rem;
        }

        .project-meta {
          display: flex;
          gap: var(--spacing-md);
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
          flex-wrap: wrap;
        }

        .btn.active {
          background: var(--accent-color);
          color: white;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-storyboard {
          text-align: center;
          padding: var(--spacing-3xl);
          color: var(--secondary-text);
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto var(--spacing-lg);
          color: var(--muted-text);
        }

        .empty-storyboard h3 {
          color: var(--primary-text);
          margin-bottom: var(--spacing-md);
        }

        .empty-storyboard p {
          margin-bottom: var(--spacing-xl);
          font-size: 1.125rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .storyboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-xl);
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          transition: all var(--transition-normal);
        }

        .storyboard-grid.drag-mode {
          background: rgba(245, 158, 11, 0.05);
          border: 2px dashed var(--accent-color);
        }

        .storyboard-grid.drag-active {
          background: rgba(245, 158, 11, 0.1);
        }

        .storyboard-frame {
          background: var(--gradient-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-normal);
          position: relative;
        }

        .storyboard-frame:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .storyboard-frame.dragging {
          transform: rotate(5deg);
          box-shadow: var(--shadow-xl);
          z-index: 1000;
        }

        .storyboard-frame.regenerating {
          opacity: 0.7;
        }

        .drag-handle {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          z-index: 10;
          background: var(--accent-color);
          color: white;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .frame-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .scene-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .scene-number {
          font-weight: 600;
          color: var(--primary-text);
          font-size: 0.875rem;
        }

        .emotion-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .emotion-icon {
          width: 12px;
          height: 12px;
        }

        .frame-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .frame-image {
          position: relative;
          aspect-ratio: 16/9;
          background: var(--tertiary-bg);
          overflow: hidden;
        }

        .frame-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .frame-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .frame-image:hover img {
          transform: scale(1.05);
        }

        .fullscreen-btn {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          padding: var(--spacing-xs);
          cursor: pointer;
          opacity: 0;
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .frame-image:hover .fullscreen-btn {
          opacity: 1;
        }

        .fullscreen-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .image-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          color: var(--secondary-text);
        }

        .regenerating-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          color: white;
        }

        .frame-content {
          padding: var(--spacing-md);
        }

        .frame-content p {
          margin: 0;
          color: var(--secondary-text);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .custom-prompt-label {
          display: flex;
          align-items: center;
          color: var(--primary-color) !important;
          font-weight: 600;
          font-size: 0.75rem !important;
          margin-bottom: var(--spacing-xs) !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Cinematography Suggestions */
        .cinematography-suggestions {
          padding: var(--spacing-md);
          border-top: 1px solid var(--border-color);
          background: linear-gradient(135deg, rgba(218, 165, 32, 0.05) 0%, rgba(218, 165, 32, 0.02) 100%);
        }

        .suggestions-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
          color: var(--primary-color);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .suggestion-item {
          margin-bottom: var(--spacing-sm);
        }

        .suggestion-item:last-child {
          margin-bottom: 0;
        }

        .suggestion-item strong {
          display: block;
          font-size: 0.75rem;
          color: var(--text-color);
          margin-bottom: 4px;
          font-weight: 600;
        }

        .suggestion-item p {
          margin: 0 !important;
          color: var(--secondary-text) !important;
          font-size: 0.813rem !important;
          line-height: 1.6 !important;
          padding-left: var(--spacing-sm);
        }

        .suggestion-item.reasoning {
          padding-top: var(--spacing-xs);
          border-top: 1px dashed var(--border-color);
          margin-top: var(--spacing-sm);
        }

        .suggestion-item.reasoning strong {
          color: var(--primary-color);
        }

        /* Edit Modal Styles */
        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
        }

        .edit-modal {
          background: var(--primary-bg);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
        }

        .edit-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
        }

        .edit-modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--primary-text);
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--secondary-text);
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          transition: all var(--transition-normal);
        }

        .close-btn:hover {
          background: var(--secondary-bg);
          color: var(--primary-text);
        }

        .edit-modal-content {
          padding: var(--spacing-xl);
          max-height: calc(90vh - 200px);
          overflow-y: auto;
        }

        .current-image {
          margin-bottom: var(--spacing-xl);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--tertiary-bg);
        }

        .current-image img {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 500;
          color: var(--primary-text);
          margin-bottom: var(--spacing-xs);
        }

        .edit-prompt-input {
          width: 100%;
          padding: var(--spacing-lg);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--primary-bg);
          color: var(--primary-text);
          font-size: 0.875rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 120px;
          transition: border-color var(--transition-normal);
        }

        .edit-prompt-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .edit-prompt-input::placeholder {
          color: var(--secondary-text);
        }

        .character-count {
          text-align: right;
          font-size: 0.75rem;
          color: var(--secondary-text);
          margin-top: var(--spacing-xs);
        }

        .edit-modal-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          margin-top: var(--spacing-xl);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .storyboard-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-main {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }

          .header-actions {
            justify-content: center;
          }

          .storyboard-grid {
            grid-template-columns: 1fr;
            padding: var(--spacing-md);
          }

          .project-info h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Storyboard;