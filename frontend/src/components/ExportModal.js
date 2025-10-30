import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Package,
  Image,
  Film,
  Globe,
  Settings,
  Loader,
  CheckCircle,
  AlertCircle,
  Info,
  Palette,
  Monitor,
  FileDown
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  project, 
  frames, 
  language = 'en' 
}) => {
  const [activeTab, setActiveTab] = useState('format');
  const [exportOptions, setExportOptions] = useState({
    format: 'pdf_storyboard',
    template: 'professional',
    resolution: 'high',
    includeMetadata: true,
    language: language
  });
  
  const [exportFormats, setExportFormats] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadExportFormats();
      loadExportHistory();
    }
  }, [isOpen]);

  const loadExportFormats = async () => {
    try {
      const response = await apiService.getExportFormats();
      setExportFormats(response.data);
    } catch (error) {
      console.error('Failed to load export formats:', error);
      toast.error('Failed to load export options');
    }
  };

  const loadExportHistory = () => {
    // Load from localStorage or API
    const history = JSON.parse(localStorage.getItem('exportHistory') || '[]');
    setExportHistory(history.slice(0, 5)); // Show last 5 exports
  };

  const handleOptionChange = (option, value) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleExport = async () => {
    if (!project || !frames?.length) {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);
    setExportProgress({ status: 'initializing', message: 'Preparing export...' });

    try {
      // Simulate progress for better UX
      const progressSteps = [
        { status: 'processing', message: 'Processing frames...' },
        { status: 'generating', message: 'Generating export...' },
        { status: 'finalizing', message: 'Finalizing...' }
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setExportProgress(progressSteps[i]);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await apiService.exportStoryboard(project.id, exportOptions);

      if (response.data.success) {
        setExportProgress({ status: 'completed', message: 'Export completed!' });
        
        // Add to export history
        const exportRecord = {
          id: Date.now(),
          projectTitle: project.title,
          format: exportOptions.format,
          timestamp: new Date().toISOString(),
          filename: response.data.filename,
          url: response.data.url
        };
        
        const updatedHistory = [exportRecord, ...exportHistory].slice(0, 5);
        setExportHistory(updatedHistory);
        localStorage.setItem('exportHistory', JSON.stringify(updatedHistory));

        // Handle different export types
        if (exportOptions.format.includes('pdf')) {
          // For PDF exports, create download link
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.data.filename || `${project.title}_export.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          // For other formats, show download link
          toast.success(
            <div>
              <p>Export ready!</p>
              <a href={response.data.url} download className="download-link">
                Download {response.data.filename}
              </a>
            </div>,
            { duration: 10000 }
          );
        }

        setTimeout(() => {
          setExportProgress(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportProgress({ 
        status: 'error', 
        message: error.response?.data?.error || 'Export failed' 
      });
      toast.error('Export failed. Please try again.');
      
      setTimeout(() => {
        setExportProgress(null);
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    const icons = {
      'pdf_storyboard': FileText,
      'pdf_presentation': FileDown,
      'images_zip': Package,
      'production_package': Film,
      'web_gallery': Globe,
      'video_preview': Film
    };
    return icons[format] || FileText;
  };

  const getFormatDescription = (format) => {
    const descriptions = {
      'pdf_storyboard': 'Professional PDF storyboard with scene details',
      'pdf_presentation': 'Presentation-ready PDF with enhanced layout',
      'images_zip': 'ZIP archive with all storyboard images',
      'production_package': 'Complete package with multiple formats',
      'web_gallery': 'Interactive HTML gallery for web viewing',
      'video_preview': 'Animated video preview of storyboard'
    };
    return descriptions[format] || 'Export format';
  };

  const tabs = [
    { id: 'format', label: 'Format', icon: FileText },
    { id: 'template', label: 'Template', icon: Palette },
    { id: 'quality', label: 'Quality', icon: Monitor },
    { id: 'options', label: 'Options', icon: Settings }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="export-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="export-modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="export-modal-header">
            <div className="header-info">
              <h2>Export Storyboard</h2>
              <div className="project-info">
                <span>{project?.title}</span>
                <span className="frame-count">{frames?.length || 0} frames</span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              disabled={isExporting}
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress Overlay */}
          {exportProgress && (
            <div className="export-progress-overlay">
              <div className="progress-content">
                {exportProgress.status === 'error' ? (
                  <AlertCircle className="progress-icon error" size={48} />
                ) : exportProgress.status === 'completed' ? (
                  <CheckCircle className="progress-icon success" size={48} />
                ) : (
                  <Loader className="progress-icon spinner" size={48} />
                )}
                <h3>{exportProgress.message}</h3>
                {exportProgress.status === 'processing' && (
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="export-modal-body">
            {/* Tabs */}
            <div className="export-tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={isExporting}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'format' && (
                <FormatSelectionPanel
                  formats={exportFormats?.formats}
                  selectedFormat={exportOptions.format}
                  onFormatChange={(format) => handleOptionChange('format', format)}
                  getFormatIcon={getFormatIcon}
                  getFormatDescription={getFormatDescription}
                />
              )}

              {activeTab === 'template' && (
                <TemplateSelectionPanel
                  templates={exportFormats?.templates}
                  selectedTemplate={exportOptions.template}
                  onTemplateChange={(template) => handleOptionChange('template', template)}
                />
              )}

              {activeTab === 'quality' && (
                <QualitySelectionPanel
                  resolution={exportOptions.resolution}
                  onResolutionChange={(resolution) => handleOptionChange('resolution', resolution)}
                  format={exportOptions.format}
                />
              )}

              {activeTab === 'options' && (
                <OptionsPanel
                  options={exportOptions}
                  onOptionChange={handleOptionChange}
                  languages={exportFormats?.languages}
                  project={project}
                />
              )}
            </div>

            {/* Export History */}
            {exportHistory.length > 0 && (
              <div className="export-history">
                <h4>Recent Exports</h4>
                <div className="history-list">
                  {exportHistory.map(record => (
                    <div key={record.id} className="history-item">
                      <div className="history-info">
                        <span className="history-filename">{record.filename}</span>
                        <span className="history-date">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {record.url && (
                        <a 
                          href={record.url} 
                          download 
                          className="btn btn-ghost btn-xs"
                          title="Download again"
                        >
                          <Download size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="export-modal-footer">
            <div className="footer-info">
              <Info size={14} />
              <span>Export will include {frames?.length || 0} frames</span>
            </div>
            
            <div className="footer-actions">
              <button
                className="btn btn-ghost"
                onClick={onClose}
                disabled={isExporting}
              >
                Cancel
              </button>
              
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting || !frames?.length}
              >
                {isExporting ? (
                  <>
                    <Loader className="spinner" size={16} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export Storyboard
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .export-modal-overlay {
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

        .export-modal {
          background: var(--primary-bg);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .export-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .header-info h2 {
          margin: 0 0 var(--spacing-xs);
          font-size: 1.25rem;
          color: var(--primary-text);
        }

        .project-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .frame-count {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--accent-color);
          color: white;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }

        .export-progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .progress-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .progress-icon {
          color: var(--accent-color);
        }

        .progress-icon.error {
          color: #ef4444;
        }

        .progress-icon.success {
          color: #10b981;
        }

        .progress-icon.spinner {
          animation: spin 1s linear infinite;
        }

        .progress-content h3 {
          margin: 0;
          color: var(--primary-text);
          font-size: 1.125rem;
        }

        .progress-bar {
          width: 200px;
          height: 4px;
          background: var(--tertiary-bg);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent-color);
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .export-modal-body {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          flex: 1;
          overflow: hidden;
        }

        .export-tabs {
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

        .tab:hover:not(:disabled) {
          background: var(--secondary-bg);
          color: var(--primary-text);
        }

        .tab.active {
          background: var(--accent-color);
          color: white;
        }

        .tab:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md) 0;
        }

        .export-history {
          border-top: 1px solid var(--border-color);
          padding-top: var(--spacing-lg);
        }

        .export-history h4 {
          margin: 0 0 var(--spacing-md);
          font-size: 0.875rem;
          color: var(--secondary-text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm);
          background: var(--secondary-bg);
          border-radius: var(--radius-sm);
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .history-filename {
          font-size: 0.875rem;
          color: var(--primary-text);
          font-weight: 500;
        }

        .history-date {
          font-size: 0.75rem;
          color: var(--secondary-text);
        }

        .export-modal-footer {
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

        .download-link {
          display: inline-block;
          margin-top: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--accent-color);
          color: white;
          text-decoration: none;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .download-link:hover {
          background: var(--accent-color-dark);
        }

        @media (max-width: 768px) {
          .export-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .export-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .tab {
            white-space: nowrap;
          }

          .export-modal-footer {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .footer-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

// Format Selection Panel Component
const FormatSelectionPanel = ({ 
  formats, 
  selectedFormat, 
  onFormatChange, 
  getFormatIcon, 
  getFormatDescription 
}) => (
  <div className="format-selection">
    <h3>Export Format</h3>
    <div className="format-grid">
      {formats && Object.entries(formats).map(([key, format]) => {
        const Icon = getFormatIcon(key);
        const isSelected = selectedFormat === key;
        
        return (
          <div
            key={key}
            className={`format-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onFormatChange(key)}
          >
            <div className="format-icon">
              <Icon size={24} />
            </div>
            <div className="format-info">
              <h4>{format.name}</h4>
              <p>{format.description}</p>
            </div>
            {isSelected && (
              <div className="selected-indicator">
                <CheckCircle size={16} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// Template Selection Panel Component
const TemplateSelectionPanel = ({ templates, selectedTemplate, onTemplateChange }) => (
  <div className="template-selection">
    <h3>Template Style</h3>
    <div className="template-grid">
      {templates && Object.entries(templates).map(([key, template]) => {
        const isSelected = selectedTemplate === key;
        
        return (
          <div
            key={key}
            className={`template-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onTemplateChange(key)}
          >
            <div className="template-preview">
              <div className="preview-box" style={{
                background: template.colors?.primary || '#333',
                borderRadius: template.name === 'minimal' ? '2px' : '8px'
              }}>
                <div className="preview-content" style={{
                  background: template.colors?.secondary || '#666'
                }}></div>
              </div>
            </div>
            <div className="template-info">
              <h4>{template.name}</h4>
              <p>{key} style layout</p>
            </div>
            {isSelected && (
              <div className="selected-indicator">
                <CheckCircle size={16} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// Quality Selection Panel Component
const QualitySelectionPanel = ({ resolution, onResolutionChange, format }) => {
  const resolutions = [
    { key: 'low', name: 'Low', description: '1280x720 - Fast export, smaller file' },
    { key: 'medium', name: 'Medium', description: '1920x1080 - Balanced quality and size' },
    { key: 'high', name: 'High', description: '3840x2160 - Best quality, larger file' }
  ];

  return (
    <div className="quality-selection">
      <h3>Export Quality</h3>
      <div className="quality-options">
        {resolutions.map(res => (
          <div
            key={res.key}
            className={`quality-option ${resolution === res.key ? 'selected' : ''}`}
            onClick={() => onResolutionChange(res.key)}
          >
            <div className="quality-header">
              <h4>{res.name}</h4>
              {resolution === res.key && <CheckCircle size={16} />}
            </div>
            <p>{res.description}</p>
          </div>
        ))}
      </div>

      {format?.includes('pdf') && (
        <div className="quality-note">
          <Info size={16} />
          <span>PDF exports use vector graphics and are resolution-independent</span>
        </div>
      )}
    </div>
  );
};

// Options Panel Component
const OptionsPanel = ({ options, onOptionChange, languages, project }) => (
  <div className="options-panel">
    <h3>Export Options</h3>
    
    <div className="option-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={options.includeMetadata}
          onChange={(e) => onOptionChange('includeMetadata', e.target.checked)}
        />
        Include technical metadata
      </label>
      <span className="option-description">
        Add camera angles, lighting, and generation details
      </span>
    </div>

    <div className="form-group">
      <label className="form-label">Export Language</label>
      <select
        value={options.language}
        onChange={(e) => onOptionChange('language', e.target.value)}
        className="form-select"
      >
        {languages && Object.entries(languages).map(([code, info]) => (
          <option key={code} value={code}>
            {info.name}
          </option>
        ))}
      </select>
    </div>

    <div className="project-summary">
      <h4>Project Summary</h4>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Title:</span>
          <span className="summary-value">{project?.title}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Language:</span>
          <span className="summary-value">{project?.language?.toUpperCase()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Created:</span>
          <span className="summary-value">
            {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default ExportModal;