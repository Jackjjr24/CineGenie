import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit3,
  Camera,
  Sun,
  Palette,
  Wand2,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Sparkles,
  Loader,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const FrameEditor = ({ 
  frame, 
  isOpen, 
  onClose, 
  onFrameUpdated, 
  language = 'en' 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState(null);
  
  // Form state
  const [editOptions, setEditOptions] = useState({
    style: 'cinematic',
    cameraAngle: '',
    lighting: '',
    colorPalette: '',
    customPrompt: '',
    aspectRatio: '16:9'
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGenerationOptions();
      if (frame) {
        loadSuggestions();
        
        // Initialize form with existing metadata
        if (frame.metadata) {
          setEditOptions(prev => ({
            ...prev,
            style: frame.metadata.style || 'cinematic',
            cameraAngle: frame.metadata.cameraAngle || '',
            lighting: frame.metadata.lighting || '',
            colorPalette: frame.metadata.colorPalette || '',
            aspectRatio: frame.metadata.aspectRatio || '16:9'
          }));
        }
      }
    }
  }, [isOpen, frame]);

  const loadGenerationOptions = async () => {
    try {
      const response = await apiService.getGenerationOptions();
      setGenerationOptions(response.data.options);
    } catch (error) {
      console.error('Failed to load generation options:', error);
    }
  };

  const loadSuggestions = async () => {
    if (!frame) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await apiService.getFrameSuggestions(
        frame.emotion,
        frame.content,
        language
      );
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast.error('Failed to load AI suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleOptionChange = (option, value) => {
    setEditOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleApplySuggestion = (type, value) => {
    setEditOptions(prev => ({
      ...prev,
      [type]: value
    }));
    toast.success(`Applied ${type} suggestion: ${value}`);
  };

  const handleRegenerateFrame = async () => {
    if (!frame) return;
    
    setIsGenerating(true);
    try {
      const response = await apiService.regenerateFrameEnhanced(frame.id, {
        ...editOptions,
        language
      });
      
      if (response.data.success) {
        toast.success('Frame regenerated successfully!');
        onFrameUpdated({
          ...frame,
          imageUrl: response.data.newImageUrl,
          metadata: response.data.metadata
        });
      }
    } catch (error) {
      console.error('Frame regeneration error:', error);
      toast.error('Failed to regenerate frame');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeCurrentImage = async () => {
    if (!frame?.imageUrl) return;
    
    try {
      const response = await apiService.analyzeImage(frame.imageUrl);
      const analysis = response.data.suggestions;
      
      setEditOptions(prev => ({
        ...prev,
        ...analysis
      }));
      
      toast.success('Image analyzed! Applied suggestions to form.');
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Failed to analyze image');
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic', icon: Edit3 },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'lighting', label: 'Lighting', icon: Sun },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  if (!isOpen || !frame) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="frame-editor-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="frame-editor-modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="frame-editor-header">
            <div className="header-info">
              <h2>Edit Frame - Scene {frame.sceneNumber}</h2>
              <div className="emotion-badge">
                <Sparkles size={14} />
                {frame.emotion}
              </div>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewMode(!previewMode)}
                title="Toggle preview mode"
              >
                <Eye size={16} />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={onClose}
                title="Close editor"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="frame-editor-body">
            {/* Current Image */}
            <div className="current-image-section">
              <div className="image-container">
                {frame.imageUrl ? (
                  <img
                    src={`http://localhost:5000${frame.imageUrl}`}
                    alt={`Scene ${frame.sceneNumber}`}
                    className="current-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <Camera size={48} />
                    <span>No image generated</span>
                  </div>
                )}
                
                <div className="image-overlay-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleAnalyzeCurrentImage}
                    title="Analyze current image for suggestions"
                  >
                    <Wand2 size={14} />
                    Analyze
                  </button>
                </div>
              </div>
              
              <div className="scene-info">
                <h4>Scene Description</h4>
                <p>{frame.content}</p>
              </div>
            </div>

            {/* Editing Panel */}
            <div className="editing-panel">
              {/* Tabs */}
              <div className="editor-tabs">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'basic' && (
                  <BasicEditingPanel
                    options={editOptions}
                    onChange={handleOptionChange}
                    generationOptions={generationOptions}
                    suggestions={suggestions}
                    loadingSuggestions={loadingSuggestions}
                    onApplySuggestion={handleApplySuggestion}
                  />
                )}

                {activeTab === 'camera' && (
                  <CameraEditingPanel
                    options={editOptions}
                    onChange={handleOptionChange}
                    suggestions={suggestions?.cameraAngles}
                    onApplySuggestion={handleApplySuggestion}
                    generationOptions={generationOptions}
                  />
                )}

                {activeTab === 'lighting' && (
                  <LightingEditingPanel
                    options={editOptions}
                    onChange={handleOptionChange}
                    suggestions={suggestions?.lighting}
                    onApplySuggestion={handleApplySuggestion}
                    generationOptions={generationOptions}
                  />
                )}

                {activeTab === 'color' && (
                  <ColorEditingPanel
                    options={editOptions}
                    onChange={handleOptionChange}
                    suggestions={suggestions?.colorPalettes}
                    onApplySuggestion={handleApplySuggestion}
                    generationOptions={generationOptions}
                  />
                )}

                {activeTab === 'advanced' && (
                  <AdvancedEditingPanel
                    options={editOptions}
                    onChange={handleOptionChange}
                    generationOptions={generationOptions}
                    frame={frame}
                    language={language}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="frame-editor-footer">
            <div className="footer-info">
              <Info size={14} />
              <span>Changes will regenerate the image using AI</span>
            </div>
            
            <div className="footer-actions">
              <button
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </button>
              
              <button
                className="btn btn-primary"
                onClick={handleRegenerateFrame}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader className="spinner" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Regenerate Frame
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .frame-editor-overlay {
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

        .frame-editor-modal {
          background: var(--primary-bg);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .frame-editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-info h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--primary-text);
        }

        .emotion-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          background: var(--accent-color);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .frame-editor-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
          padding: var(--spacing-xl);
          flex: 1;
          overflow: hidden;
        }

        .current-image-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .image-container {
          position: relative;
          background: var(--tertiary-bg);
          border-radius: var(--radius-md);
          overflow: hidden;
          aspect-ratio: 16/9;
        }

        .current-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--secondary-text);
        }

        .image-overlay-actions {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          display: flex;
          gap: var(--spacing-xs);
        }

        .scene-info h4 {
          margin: 0 0 var(--spacing-sm);
          color: var(--primary-text);
          font-size: 1rem;
        }

        .scene-info p {
          margin: 0;
          color: var(--secondary-text);
          font-size: 0.875rem;
          line-height: 1.5;
          max-height: 100px;
          overflow-y: auto;
        }

        .editing-panel {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          overflow: hidden;
        }

        .editor-tabs {
          display: flex;
          gap: var(--spacing-xs);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-xs);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: none;
          background: none;
          color: var(--secondary-text);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-size: 0.875rem;
        }

        .tab:hover {
          background: var(--secondary-bg);
          color: var(--primary-text);
        }

        .tab.active {
          background: var(--accent-color);
          color: white;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md) 0;
        }

        .frame-editor-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg) var(--spacing-xl);
          border-top: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .footer-actions {
          display: flex;
          gap: var(--spacing-md);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .frame-editor-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .frame-editor-body {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
          }

          .editor-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .tab {
            white-space: nowrap;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

// Basic Editing Panel Component
const BasicEditingPanel = ({ 
  options, 
  onChange, 
  generationOptions, 
  suggestions, 
  loadingSuggestions, 
  onApplySuggestion 
}) => (
  <div className="editing-panel-content">
    <div className="form-group">
      <label className="form-label">
        <Wand2 size={14} />
        Style
      </label>
      <select
        value={options.style}
        onChange={(e) => onChange('style', e.target.value)}
        className="form-select"
      >
        {generationOptions?.styles?.map(style => (
          <option key={style} value={style}>
            {style.charAt(0).toUpperCase() + style.slice(1)}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label className="form-label">
        <Edit3 size={14} />
        Custom Prompt
      </label>
      <textarea
        value={options.customPrompt}
        onChange={(e) => onChange('customPrompt', e.target.value)}
        placeholder="Add specific details or modifications..."
        className="form-textarea"
        rows={3}
      />
    </div>

    <div className="form-group">
      <label className="form-label">
        Aspect Ratio
      </label>
      <select
        value={options.aspectRatio}
        onChange={(e) => onChange('aspectRatio', e.target.value)}
        className="form-select"
      >
        {generationOptions?.aspectRatios?.map(ratio => (
          <option key={ratio} value={ratio}>
            {ratio}
          </option>
        ))}
      </select>
    </div>

    {suggestions && (
      <div className="suggestions-section">
        <h4>AI Suggestions</h4>
        {loadingSuggestions ? (
          <div className="loading-suggestions">
            <Loader className="spinner" size={16} />
            Loading suggestions...
          </div>
        ) : (
          <div className="suggestions-grid">
            <SuggestionCard
              title="Camera Angle"
              suggestions={suggestions.cameraAngles}
              onApply={(value) => onApplySuggestion('cameraAngle', value)}
            />
            <SuggestionCard
              title="Lighting"
              suggestions={suggestions.lighting}
              onApply={(value) => onApplySuggestion('lighting', value)}
            />
            <SuggestionCard
              title="Color Palette"
              suggestions={suggestions.colorPalettes}
              onApply={(value) => onApplySuggestion('colorPalette', value)}
            />
          </div>
        )}
      </div>
    )}
  </div>
);

// Camera Editing Panel Component
const CameraEditingPanel = ({ 
  options, 
  onChange, 
  suggestions, 
  onApplySuggestion, 
  generationOptions 
}) => (
  <div className="editing-panel-content">
    <div className="form-group">
      <label className="form-label">
        <Camera size={14} />
        Camera Angle
      </label>
      <select
        value={options.cameraAngle}
        onChange={(e) => onChange('cameraAngle', e.target.value)}
        className="form-select"
      >
        <option value="">Auto-select</option>
        {generationOptions?.cameraAngles?.map(angle => (
          <option key={angle} value={angle}>
            {angle.replace(/_/g, ' ').toUpperCase()}
          </option>
        ))}
      </select>
    </div>

    {suggestions && (
      <div className="suggestions-section">
        <h4>Recommended Camera Angles</h4>
        <div className="suggestion-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className={`suggestion-item ${suggestion.recommended ? 'recommended' : ''}`}>
              <div className="suggestion-content">
                <strong>{suggestion.name.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{suggestion.description}</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onApplySuggestion('cameraAngle', suggestion.name)}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Lighting Editing Panel Component
const LightingEditingPanel = ({ 
  options, 
  onChange, 
  suggestions, 
  onApplySuggestion, 
  generationOptions 
}) => (
  <div className="editing-panel-content">
    <div className="form-group">
      <label className="form-label">
        <Sun size={14} />
        Lighting Setup
      </label>
      <select
        value={options.lighting}
        onChange={(e) => onChange('lighting', e.target.value)}
        className="form-select"
      >
        <option value="">Auto-select</option>
        {generationOptions?.lightingPresets?.map(preset => (
          <option key={preset} value={preset}>
            {preset.replace(/_/g, ' ').toUpperCase()}
          </option>
        ))}
      </select>
    </div>

    {suggestions && (
      <div className="suggestions-section">
        <h4>Recommended Lighting</h4>
        <div className="suggestion-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className={`suggestion-item ${suggestion.recommended ? 'recommended' : ''}`}>
              <div className="suggestion-content">
                <strong>{suggestion.name.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{suggestion.description}</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onApplySuggestion('lighting', suggestion.name)}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Color Editing Panel Component
const ColorEditingPanel = ({ 
  options, 
  onChange, 
  suggestions, 
  onApplySuggestion, 
  generationOptions 
}) => (
  <div className="editing-panel-content">
    <div className="form-group">
      <label className="form-label">
        <Palette size={14} />
        Color Palette
      </label>
      <select
        value={options.colorPalette}
        onChange={(e) => onChange('colorPalette', e.target.value)}
        className="form-select"
      >
        <option value="">Auto-select</option>
        {generationOptions?.colorPalettes?.map(palette => (
          <option key={palette} value={palette}>
            {palette.replace(/_/g, ' ').toUpperCase()}
          </option>
        ))}
      </select>
    </div>

    {suggestions && (
      <div className="suggestions-section">
        <h4>Recommended Color Palettes</h4>
        <div className="suggestion-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className={`suggestion-item ${suggestion.recommended ? 'recommended' : ''}`}>
              <div className="suggestion-content">
                <strong>{suggestion.name.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{suggestion.description}</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onApplySuggestion('colorPalette', suggestion.name)}
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Advanced Editing Panel Component
const AdvancedEditingPanel = ({ 
  options, 
  onChange, 
  generationOptions, 
  frame, 
  language 
}) => (
  <div className="editing-panel-content">
    <div className="form-group">
      <label className="form-label">
        <Settings size={14} />
        Language Enhancement
      </label>
      <div className="info-text">
        Current language: {language.toUpperCase()}
      </div>
    </div>

    <div className="form-group">
      <label className="form-label">
        Technical Settings
      </label>
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={options.enhanceDetails || false}
            onChange={(e) => onChange('enhanceDetails', e.target.checked)}
          />
          Enhance details
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={options.addFilmGrain || false}
            onChange={(e) => onChange('addFilmGrain', e.target.checked)}
          />
          Add film grain
        </label>
      </div>
    </div>

    <div className="metadata-section">
      <h4>Current Metadata</h4>
      {frame.metadata ? (
        <pre className="metadata-display">
          {JSON.stringify(frame.metadata, null, 2)}
        </pre>
      ) : (
        <div className="no-metadata">No metadata available</div>
      )}
    </div>
  </div>
);

// Suggestion Card Component
const SuggestionCard = ({ title, suggestions, onApply }) => (
  <div className="suggestion-card">
    <h5>{title}</h5>
    {suggestions?.slice(0, 2).map((suggestion, index) => (
      <div key={index} className="suggestion-item-mini">
        <span>{suggestion.name.replace(/_/g, ' ')}</span>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => onApply(suggestion.name)}
        >
          <CheckCircle size={12} />
        </button>
      </div>
    ))}
  </div>
);

export default FrameEditor;