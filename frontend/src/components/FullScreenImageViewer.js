import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const FullScreenImageViewer = ({ isOpen, onClose, frames, currentIndex, onNavigate }) => {
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const currentFrame = frames[currentIndex];

  React.useEffect(() => {
    if (isOpen) {
      // Reset zoom and position when opening
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    if (currentFrame?.imageUrl) {
      try {
        const response = await fetch(`http://localhost:5000${currentFrame.imageUrl}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `storyboard-scene-${currentFrame.sceneNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (currentIndex > 0) onNavigate(currentIndex - 1);
        break;
      case 'ArrowRight':
        if (currentIndex < frames.length - 1) onNavigate(currentIndex + 1);
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleReset();
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, currentIndex, isDragging, dragStart, zoomLevel]);

  if (!isOpen || !currentFrame) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fullscreen-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-info">
            <h3>Scene {currentFrame.sceneNumber}</h3>
            <span className={`emotion-tag emotion-${currentFrame.emotion}`}>
              {currentFrame.emotion}
            </span>
            <span className="frame-counter">
              {currentIndex + 1} of {frames.length}
            </span>
          </div>
          
          <div className="viewer-controls">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              title="Zoom Out (-)"
            >
              <ZoomOut size={18} />
            </button>
            
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 5}
              title="Zoom In (+)"
            >
              <ZoomIn size={18} />
            </button>
            
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              title="Reset (0)"
            >
              <RotateCcw size={18} />
            </button>
            
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download size={18} />
            </button>
            
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="image-container"
          onMouseDown={handleMouseDown}
          style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {currentFrame.imageUrl ? (
            <motion.img
              src={`http://localhost:5000${currentFrame.imageUrl}`}
              alt={`Scene ${currentFrame.sceneNumber} - ${currentFrame.emotion}`}
              style={{
                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                transformOrigin: 'center center'
              }}
              className="fullscreen-image"
              draggable={false}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="no-image">
              <p>No image available</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="navigation">
          <button
            className="btn btn-ghost nav-btn"
            onClick={() => onNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            title="Previous (←)"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            className="btn btn-ghost nav-btn"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex === frames.length - 1}
            title="Next (→)"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Scene Content */}
        <div className="scene-content">
          <p>{currentFrame.content}</p>
        </div>

        <style jsx>{`
          .fullscreen-viewer {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999;
            display: flex;
            flex-direction: column;
          }

          .viewer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-lg);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
          }

          .viewer-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
          }

          .viewer-info h3 {
            margin: 0;
            color: var(--primary-text);
            font-size: 1.125rem;
          }

          .emotion-tag {
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
          }

          .frame-counter {
            color: var(--secondary-text);
            font-size: 0.875rem;
          }

          .viewer-controls {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
          }

          .zoom-level {
            color: var(--secondary-text);
            font-size: 0.875rem;
            min-width: 50px;
            text-align: center;
          }

          .image-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
          }

          .fullscreen-image {
            max-width: 90vw;
            max-height: 70vh;
            object-fit: contain;
            transition: transform 0.2s ease-out;
            user-select: none;
          }

          .no-image {
            color: var(--secondary-text);
            text-align: center;
          }

          .navigation {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            justify-content: space-between;
            padding: 0 var(--spacing-lg);
            pointer-events: none;
          }

          .nav-btn {
            pointer-events: auto;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-normal);
          }

          .nav-btn:hover:not(:disabled) {
            background: rgba(0, 0, 0, 0.9);
            transform: scale(1.1);
          }

          .nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .scene-content {
            padding: var(--spacing-lg);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            border-top: 1px solid var(--border-color);
            max-height: 120px;
            overflow-y: auto;
          }

          .scene-content p {
            margin: 0;
            color: var(--secondary-text);
            line-height: 1.5;
            font-size: 0.875rem;
          }

          /* Emotion styles */
          .emotion-happy { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }
          .emotion-sad { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
          .emotion-angry { background: rgba(239, 68, 68, 0.2); color: var(--error-color); }
          .emotion-fearful { background: rgba(147, 51, 234, 0.2); color: #9333ea; }
          .emotion-romantic { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
          .emotion-dramatic { background: rgba(245, 158, 11, 0.2); color: var(--accent-color); }
          .emotion-neutral { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
          .emotion-mysterious { background: rgba(147, 51, 234, 0.2); color: #9333ea; }
          .emotion-tense { background: rgba(239, 68, 68, 0.2); color: var(--error-color); }
          .emotion-peaceful { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }

          @media (max-width: 768px) {
            .viewer-header {
              flex-direction: column;
              gap: var(--spacing-md);
              align-items: stretch;
            }

            .viewer-info {
              justify-content: center;
            }

            .viewer-controls {
              justify-content: center;
              flex-wrap: wrap;
            }

            .fullscreen-image {
              max-width: 95vw;
              max-height: 60vh;
            }

            .navigation {
              padding: 0 var(--spacing-md);
            }

            .nav-btn {
              width: 40px;
              height: 40px;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullScreenImageViewer;