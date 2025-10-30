import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, Loader, Edit3, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const ScriptUpload = ({ onClose }) => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'manual'
  const [projectTitle, setProjectTitle] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [manualScript, setManualScript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedImageStyle, setSelectedImageStyle] = useState('realistic');
  const [analysisResults, setAnalysisResults] = useState(null);
  const navigate = useNavigate();

  // Available image styles
  const imageStyles = [
    { key: 'realistic', name: 'Realistic', icon: '📷', description: 'Photorealistic film stills' },
    { key: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Dramatic movie scenes' },
    { key: 'cartoon', name: 'Cartoon', icon: '🎨', description: 'Animated style' },
    { key: 'comic', name: 'Comic Book', icon: '📖', description: 'Comic book art' },
    { key: 'noir', name: 'Film Noir', icon: '🎭', description: 'Black & white classic' },
    { key: 'anime', name: 'Anime', icon: '⚡', description: 'Japanese animation' }
  ];

  // Supported languages for script analysis
  const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  ];

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejectedFile = rejectedFiles[0];
      if (rejectedFile.errors[0]?.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 10MB');
      } else {
        toast.error('Please upload a valid script file (.txt, .pdf, .doc, .docx, .rtf, .fountain, .fdx, .celtx)');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      // Auto-generate project title from filename
      if (!projectTitle) {
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setProjectTitle(title);
      }
    }
  }, [projectTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUpload = async () => {
    if (!uploadedFile || !projectTitle.trim()) {
      toast.error('Please provide a project title and select a file');
      return;
    }

    setUploadState('uploading');

    try {
      console.log('📤 Uploading file:', uploadedFile.name);
      
      const formData = new FormData();
      formData.append('script', uploadedFile);
      formData.append('title', projectTitle.trim());
      formData.append('language', selectedLanguage);
      formData.append('imageStyle', selectedImageStyle);
      formData.append('autoGenerate', 'true'); // Auto-generate for file upload too

      console.log('📤 Sending file to server...');
      const response = await apiService.uploadScript(formData);
      console.log('📥 Server response:', response.data);
      
      if (response.data.success) {
        setAnalysisResults(response.data);
        
        // Check if images were generated
        if (response.data.frames && response.data.frames.length > 0) {
          const successCount = response.data.successfulFrames || 0;
          const failCount = response.data.failedFrames || 0;
          
          console.log(`✅ Generated ${successCount} images (${failCount} failed)`);
          
          if (successCount > 0) {
            setUploadState('success');
            toast.success(`Generated ${successCount} storyboard images!`);
            // Navigate to storyboard page
            setTimeout(() => {
              navigate(`/storyboard/${response.data.projectId}`);
              onClose();
            }, 1000);
          } else {
            setUploadState('success');
            toast.error(`Script analyzed but image generation failed.`);
          }
        } else {
          setUploadState('success');
          toast.success(`Script analyzed! Found ${response.data.scenes.length} scenes.`);
        }
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('Error details:', error.response?.data);
      setUploadState('error');
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to upload script';
      toast.error(errorMessage);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualScript.trim() || !projectTitle.trim()) {
      toast.error('Please provide a project title and script content');
      return;
    }

    setUploadState('uploading');

    try {
      console.log('📝 Submitting manual script...');
      console.log('Title:', projectTitle);
      console.log('Script length:', manualScript.length);
      console.log('Language:', selectedLanguage);
      console.log('Image Style:', selectedImageStyle);
      
      // Create a blob from the manual script text
      const blob = new Blob([manualScript], { type: 'text/plain' });
      const file = new File([blob], `${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, { 
        type: 'text/plain',
        lastModified: Date.now()
      });

      const formData = new FormData();
      formData.append('script', file);
      formData.append('title', projectTitle.trim());
      formData.append('language', selectedLanguage);
      formData.append('imageStyle', selectedImageStyle);
      // Ask the server to auto-generate storyboard immediately for manual input
      formData.append('autoGenerate', 'true');

      console.log('📤 Sending request to server...');
      const response = await apiService.uploadScript(formData);
      console.log('📥 Server response:', response.data);
      
      if (response.data.success) {
        setAnalysisResults(response.data);
        
        // Check if images were generated
        if (response.data.frames && response.data.frames.length > 0) {
          const successCount = response.data.successfulFrames || 0;
          const failCount = response.data.failedFrames || 0;
          
          console.log(`✅ Generated ${successCount} images (${failCount} failed)`);
          
          if (successCount > 0) {
            setUploadState('success');
            toast.success(`Generated ${successCount} storyboard images!`);
            // Navigate to storyboard page
            setTimeout(() => {
              navigate(`/storyboard/${response.data.projectId}`);
              onClose();
            }, 1000);
          } else {
            setUploadState('success');
            toast.error(`Script analyzed but image generation failed. You can try generating images manually.`);
          }
        } else {
          // No frames in response, show success but note that generation didn't happen
          setUploadState('success');
          toast.success(`Script analyzed! Found ${response.data.scenes.length} scenes.`);
          
          if (response.data.generateError) {
            toast.error(`Image generation failed: ${response.data.generateError}`);
          }
        }
      } else {
        throw new Error(response.data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('❌ Manual script processing error:', error);
      console.error('Error details:', error.response?.data);
      setUploadState('error');
      
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to process script';
      toast.error(errorMessage);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!analysisResults?.projectId) return;

    toast.loading('Generating storyboard...', { duration: 10000 });
    
    try {
      const response = await apiService.generateStoryboard(analysisResults.projectId);
      
      if (response.data.success) {
        toast.success('Storyboard generated successfully!');
        navigate(`/storyboard/${analysisResults.projectId}`);
        onClose();
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate storyboard');
    }
  };

  const handleViewProject = () => {
    if (analysisResults?.projectId) {
      navigate(`/storyboard/${analysisResults.projectId}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="upload-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="upload-modal"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="upload-header">
            <h2>Upload Your Script</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="upload-content">
            {uploadState === 'idle' && (
              <>
                <div className="form-group">
                  <label className="form-label">Project Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter a title for your project"
                  />
                </div>

                {/* Input Mode Selector */}
                <div className="input-mode-selector">
                  <button
                    className={`mode-btn ${inputMode === 'upload' ? 'active' : ''}`}
                    onClick={() => setInputMode('upload')}
                    type="button"
                  >
                    <Upload size={18} />
                    Upload File
                  </button>
                  <button
                    className={`mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setInputMode('manual')}
                    type="button"
                  >
                    <Edit3 size={18} />
                    Type Script
                  </button>
                </div>

                {/* Language Selector */}
                <div className="form-group">
                  <label className="form-label">Script Language</label>
                  <select
                    className="form-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="language-hint">
                    Select the language of your script for optimal emotion analysis
                  </p>
                </div>

                {/* Image Style Selector */}
                <div className="form-group">
                  <label className="form-label">Storyboard Image Style</label>
                  <select
                    className="form-select"
                    value={selectedImageStyle}
                    onChange={(e) => setSelectedImageStyle(e.target.value)}
                  >
                    {imageStyles.map((style) => (
                      <option key={style.key} value={style.key}>
                        {style.icon} {style.name} - {style.description}
                      </option>
                    ))}
                  </select>
                  <p className="language-hint">
                    Choose the visual style for AI-generated storyboard images
                  </p>
                </div>

                {inputMode === 'upload' ? (
                  <div 
                    {...getRootProps()} 
                    className={`dropzone ${isDragActive ? 'dropzone-active' : ''} ${uploadedFile ? 'dropzone-success' : ''}`}
                  >
                    <input {...getInputProps()} />
                    
                    {uploadedFile ? (
                      <div className="file-info">
                        <CheckCircle className="file-icon success" />
                        <div>
                          <p className="file-name">{uploadedFile.name}</p>
                          <p className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <Upload className="upload-icon" />
                        <p className="dropzone-text">
                          {isDragActive ? 'Drop your script here...' : 'Drag & drop your script, or click to browse'}
                        </p>
                        <p className="dropzone-hint">
                          Supports .txt, .pdf, .doc, .docx, .rtf, .fountain, .fdx, .celtx (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="manual-input-area">
                    <label className="form-label">
                      <FileText size={16} />
                      Script Content
                    </label>
                    <textarea
                      className="script-textarea"
                      value={manualScript}
                      onChange={(e) => setManualScript(e.target.value)}
                      placeholder="Paste or type your script here...

Example format:
SCENE 1: INT. COFFEE SHOP - DAY
Sarah sits alone at a corner table, staring at her phone. She looks anxious and keeps checking the time.

SCENE 2: EXT. PARK - AFTERNOON  
David walks through the park with his dog, smiling as children play nearby."
                      rows={12}
                    />
                    <div className="character-count">
                      {manualScript.length} characters
                    </div>
                  </div>
                )}

                <div className="upload-actions">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={inputMode === 'upload' ? handleUpload : handleManualSubmit}
                    disabled={inputMode === 'upload' ? (!uploadedFile || !projectTitle.trim()) : (!manualScript.trim() || !projectTitle.trim())}
                  >
                    {inputMode === 'upload' ? <Upload size={20} /> : <FileText size={20} />}
                    Analyze Script
                  </button>
                </div>
              </>
            )}

            {uploadState === 'uploading' && (
              <div className="upload-status">
                <Loader className="status-icon loading" />
                <h3>Analyzing Your Script</h3>
                <p>Our AI is analyzing the emotional content of each scene...</p>
                <div className="loading-bar">
                  <div className="loading-progress"></div>
                </div>
              </div>
            )}

            {uploadState === 'success' && analysisResults && (
              <div className="upload-status">
                <CheckCircle className="status-icon success" />
                <h3>Analysis Complete!</h3>
                <p>Found {analysisResults.scenes.length} scenes with emotional analysis</p>
                
                <div className="emotion-preview">
                  {analysisResults.scenes.slice(0, 3).map((scene, index) => (
                    <div key={index} className="emotion-card">
                      <span className="scene-number">Scene {scene.sceneNumber}</span>
                      <span className={`emotion-tag emotion-${scene.emotion}`}>
                        {scene.emotion}
                      </span>
                      <span className="confidence">
                        {Math.round(scene.confidence * 100)}% confidence
                      </span>
                    </div>
                  ))}
                  {analysisResults.scenes.length > 3 && (
                    <div className="emotion-card more">
                      +{analysisResults.scenes.length - 3} more scenes
                    </div>
                  )}
                </div>

                <div className="upload-actions">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleGenerateStoryboard}
                  >
                    Generate Storyboard
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleViewProject}
                  >
                    View Project
                  </button>
                </div>
              </div>
            )}

            {uploadState === 'error' && (
              <div className="upload-status">
                <AlertCircle className="status-icon error" />
                <h3>Upload Failed</h3>
                <p>There was an error processing your script. Please try again.</p>
                
                <div className="upload-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setUploadState('idle')}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <style>{`
          .upload-overlay {
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

          .upload-modal {
            background: var(--gradient-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .upload-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xl);
            border-bottom: 1px solid var(--border-color);
            background: var(--secondary-bg);
          }

          .upload-header h2 {
            margin: 0;
            color: var(--primary-text);
          }

          .close-btn {
            background: transparent;
            border: none;
            color: var(--secondary-text);
            cursor: pointer;
            padding: var(--spacing-sm);
            border-radius: var(--radius-md);
            transition: all var(--transition-normal);
          }

          .close-btn:hover {
            background: var(--tertiary-bg);
            color: var(--primary-text);
          }

          .upload-content {
            padding: var(--spacing-xl);
            flex: 1;
            overflow-y: auto;
          }

          .dropzone {
            border: 2px dashed var(--border-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-3xl);
            text-align: center;
            cursor: pointer;
            transition: all var(--transition-normal);
            margin: var(--spacing-lg) 0;
          }

          .dropzone:hover,
          .dropzone-active {
            border-color: var(--accent-color);
            background: rgba(245, 158, 11, 0.05);
          }

          .dropzone-success {
            border-color: var(--success-color);
            background: rgba(16, 185, 129, 0.05);
          }

          .dropzone-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-md);
          }

          .upload-icon {
            width: 48px;
            height: 48px;
            color: var(--accent-color);
          }

          .dropzone-text {
            font-size: 1.125rem;
            color: var(--primary-text);
            margin: 0;
          }

          .dropzone-hint {
            font-size: 0.875rem;
            color: var(--secondary-text);
            margin: 0;
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
          }

          .file-icon {
            width: 32px;
            height: 32px;
          }

          .file-icon.success {
            color: var(--success-color);
          }

          .file-name {
            font-weight: 500;
            color: var(--primary-text);
            margin: 0;
          }

          .file-size {
            font-size: 0.875rem;
            color: var(--secondary-text);
            margin: 0;
          }

          .upload-actions {
            display: flex;
            gap: var(--spacing-md);
            justify-content: center;
            flex-wrap: wrap;
          }

          .upload-status {
            text-align: center;
            padding: var(--spacing-xl) 0;
          }

          .status-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto var(--spacing-lg);
          }

          .status-icon.loading {
            color: var(--accent-color);
            animation: spin 1s linear infinite;
          }

          .status-icon.success {
            color: var(--success-color);
          }

          .status-icon.error {
            color: var(--error-color);
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .upload-status h3 {
            margin-bottom: var(--spacing-sm);
            color: var(--primary-text);
          }

          .upload-status p {
            color: var(--secondary-text);
            margin-bottom: var(--spacing-lg);
          }

          .loading-bar {
            width: 100%;
            height: 4px;
            background: var(--tertiary-bg);
            border-radius: 2px;
            overflow: hidden;
            margin: var(--spacing-lg) 0;
          }

          .loading-progress {
            height: 100%;
            background: var(--gradient-accent);
            animation: progress 2s ease-in-out infinite;
          }

          @keyframes progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }

          .emotion-preview {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            margin: var(--spacing-lg) 0;
            max-height: 200px;
            overflow-y: auto;
          }

          .emotion-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-md);
            background: var(--secondary-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            font-size: 0.875rem;
          }

          .emotion-card.more {
            justify-content: center;
            color: var(--secondary-text);
            font-style: italic;
          }

          .scene-number {
            font-weight: 500;
            color: var(--primary-text);
          }

          .emotion-tag {
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-weight: 500;
            font-size: 0.75rem;
          }

          .emotion-happy { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }
          .emotion-sad { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
          .emotion-angry { background: rgba(239, 68, 68, 0.2); color: var(--error-color); }
          .emotion-fearful { background: rgba(147, 51, 234, 0.2); color: #9333ea; }
          .emotion-romantic { background: rgba(236, 72, 153, 0.2); color: #ec4899; }
          .emotion-dramatic { background: rgba(245, 158, 11, 0.2); color: var(--accent-color); }
          .emotion-neutral { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }

          .confidence {
            font-size: 0.75rem;
            color: var(--secondary-text);
          }

          .input-mode-selector {
            display: flex;
            gap: var(--spacing-xs);
            margin-bottom: var(--spacing-lg);
            background: var(--tertiary-bg);
            border-radius: var(--radius-md);
            padding: var(--spacing-xs);
          }

          .mode-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs);
            padding: var(--spacing-md) var(--spacing-lg);
            border: none;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--secondary-text);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-normal);
          }

          .mode-btn.active {
            background: var(--primary-bg);
            color: var(--primary-text);
            box-shadow: var(--shadow-sm);
          }

          .mode-btn:hover:not(.active) {
            background: var(--secondary-bg);
            color: var(--primary-text);
          }

          .manual-input-area {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .script-textarea {
            width: 100%;
            min-height: 300px;
            padding: var(--spacing-lg);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--primary-bg);
            color: var(--primary-text);
            font-size: 0.875rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            line-height: 1.5;
            resize: vertical;
            transition: border-color var(--transition-normal);
          }

          .script-textarea:focus {
            outline: none;
            border-color: var(--accent-color);
          }

          .script-textarea::placeholder {
            color: var(--secondary-text);
            font-family: inherit;
          }

          .character-count {
            text-align: right;
            font-size: 0.75rem;
            color: var(--secondary-text);
            margin-top: var(--spacing-xs);
          }

          .form-select {
            width: 100%;
            padding: var(--spacing-md) var(--spacing-lg);
            border: 2px solid var(--border-color);
            border-radius: var(--radius-md);
            background: var(--primary-bg);
            color: var(--primary-text);
            font-size: 0.875rem;
            cursor: pointer;
            transition: border-color var(--transition-normal);
          }

          .form-select:focus {
            outline: none;
            border-color: var(--accent-color);
          }

          .language-hint {
            font-size: 0.75rem;
            color: var(--secondary-text);
            margin-top: var(--spacing-xs);
            margin-bottom: 0;
          }

          @media (max-width: 768px) {
            .upload-modal {
              margin: var(--spacing-md);
              max-height: calc(100vh - 2 * var(--spacing-md));
            }

            .upload-header,
            .upload-content {
              padding: var(--spacing-lg);
            }

            .dropzone {
              padding: var(--spacing-xl);
            }

            .upload-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScriptUpload;