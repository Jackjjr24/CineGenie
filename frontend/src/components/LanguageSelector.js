import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  ChevronDown,
  Check,
  Search,
  Loader,
  AlertCircle,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const LanguageSelector = ({ 
  selectedLanguage, 
  onLanguageChange, 
  className = '',
  showDetection = false,
  scriptContent = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  useEffect(() => {
    if (showDetection && scriptContent && scriptContent.length > 100) {
      detectLanguage(scriptContent);
    }
  }, [showDetection, scriptContent]);

  const loadSupportedLanguages = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSupportedLanguages();
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Failed to load languages:', error);
      toast.error('Failed to load supported languages');
      
      // Fallback to basic languages
      setLanguages({
        'en': { name: 'English', direction: 'ltr' },
        'es': { name: 'Español', direction: 'ltr' },
        'fr': { name: 'Français', direction: 'ltr' },
        'de': { name: 'Deutsch', direction: 'ltr' }
      });
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = async (content) => {
    if (detecting || !content) return;
    
    setDetecting(true);
    try {
      const response = await apiService.detectLanguage(content);
      const detection = response.data.detection;
      
      setDetectedLanguage(detection);
      
      if (detection.confidence > 0.7 && detection.language !== selectedLanguage) {
        toast.success(
          <div>
            <p>Auto-detected language: {languages[detection.language]?.name || detection.language}</p>
            <button 
              onClick={() => handleLanguageSelect(detection.language)}
              className="auto-detect-btn"
            >
              Use this language
            </button>
          </div>,
          { duration: 8000 }
        );
      }
    } catch (error) {
      console.error('Language detection error:', error);
    } finally {
      setDetecting(false);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    setSearchTerm('');
    
    const language = languages[languageCode];
    if (language) {
      toast.success(`Language changed to ${language.name}`);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const filteredLanguages = Object.entries(languages).filter(([code, language]) =>
    language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLanguageInfo = languages[selectedLanguage];
  const isRTL = selectedLanguageInfo?.direction === 'rtl';

  return (
    <div className={`language-selector ${className}`}>
      <div 
        className={`language-selector-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
      >
        <div className="selected-language">
          <Globe size={16} className="globe-icon" />
          <span className="language-name">
            {selectedLanguageInfo?.name || 'Select Language'}
          </span>
          {isRTL && (
            <span className="rtl-indicator" title="Right-to-left language">
              RTL
            </span>
          )}
        </div>
        
        <div className="selector-actions">
          {detecting && (
            <Loader className="spinner" size={14} />
          )}
          {detectedLanguage && detectedLanguage.language !== selectedLanguage && (
            <div className="detection-indicator" title={`Detected: ${languages[detectedLanguage.language]?.name}`}>
              <AlertCircle size={14} />
            </div>
          )}
          <ChevronDown 
            size={16} 
            className={`chevron ${isOpen ? 'rotated' : ''}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="language-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search */}
            <div className="language-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            {/* Detection Info */}
            {detectedLanguage && (
              <div className="detection-info">
                <Info size={14} />
                <span>
                  Auto-detected: {languages[detectedLanguage.language]?.name} 
                  ({Math.round(detectedLanguage.confidence * 100)}% confidence)
                </span>
                {detectedLanguage.language !== selectedLanguage && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleLanguageSelect(detectedLanguage.language)}
                  >
                    Use
                  </button>
                )}
              </div>
            )}

            {/* Language List */}
            <div className="language-list">
              {loading ? (
                <div className="loading-languages">
                  <Loader className="spinner" size={16} />
                  Loading languages...
                </div>
              ) : filteredLanguages.length > 0 ? (
                filteredLanguages.map(([code, language]) => (
                  <div
                    key={code}
                    className={`language-item ${selectedLanguage === code ? 'selected' : ''}`}
                    onClick={() => handleLanguageSelect(code)}
                  >
                    <div className="language-info">
                      <span className="language-name">{language.name}</span>
                      <span className="language-code">{code.toUpperCase()}</span>
                      {language.direction === 'rtl' && (
                        <span className="rtl-badge">RTL</span>
                      )}
                    </div>
                    {selectedLanguage === code && (
                      <Check size={16} className="check-icon" />
                    )}
                    {detectedLanguage?.language === code && (
                      <div className="detected-badge" title="Auto-detected language">
                        AI
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-languages">
                  No languages found matching "{searchTerm}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="dropdown-footer">
              <div className="footer-info">
                <Info size={12} />
                <span>{Object.keys(languages).length} languages supported</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .language-selector {
          position: relative;
          display: inline-block;
        }

        .language-selector-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--primary-bg);
          cursor: pointer;
          transition: all var(--transition-normal);
          min-width: 160px;
          gap: var(--spacing-sm);
        }

        .language-selector-trigger:hover:not(.disabled) {
          border-color: var(--border-hover);
          background: var(--secondary-bg);
        }

        .language-selector-trigger.open {
          border-color: var(--accent-color);
        }

        .language-selector-trigger.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .selected-language {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex: 1;
        }

        .globe-icon {
          color: var(--secondary-text);
        }

        .language-name {
          color: var(--primary-text);
          font-size: 0.875rem;
        }

        .rtl-indicator {
          padding: var(--spacing-xs);
          background: var(--tertiary-bg);
          color: var(--secondary-text);
          border-radius: var(--radius-xs);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .selector-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .detection-indicator {
          color: var(--accent-color);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chevron {
          color: var(--secondary-text);
          transition: transform var(--transition-normal);
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .language-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--primary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          margin-top: var(--spacing-xs);
          overflow: hidden;
        }

        .language-search {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .search-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          color: var(--primary-text);
          font-size: 0.875rem;
        }

        .search-input::placeholder {
          color: var(--secondary-text);
        }

        .detection-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: rgba(var(--accent-color-rgb), 0.1);
          border-bottom: 1px solid var(--border-color);
          font-size: 0.75rem;
          color: var(--secondary-text);
        }

        .language-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .loading-languages {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .language-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          transition: background-color var(--transition-normal);
          border-bottom: 1px solid var(--border-light);
        }

        .language-item:hover {
          background: var(--secondary-bg);
        }

        .language-item.selected {
          background: rgba(var(--accent-color-rgb), 0.1);
        }

        .language-item:last-child {
          border-bottom: none;
        }

        .language-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .language-info .language-name {
          color: var(--primary-text);
          font-size: 0.875rem;
        }

        .language-code {
          color: var(--secondary-text);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .rtl-badge {
          padding: var(--spacing-xs);
          background: var(--tertiary-bg);
          color: var(--secondary-text);
          border-radius: var(--radius-xs);
          font-size: 0.65rem;
          font-weight: 500;
        }

        .check-icon {
          color: var(--accent-color);
        }

        .detected-badge {
          padding: var(--spacing-xs);
          background: var(--accent-color);
          color: white;
          border-radius: var(--radius-xs);
          font-size: 0.65rem;
          font-weight: 600;
        }

        .no-languages {
          padding: var(--spacing-lg);
          text-align: center;
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .dropdown-footer {
          padding: var(--spacing-sm) var(--spacing-md);
          border-top: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--secondary-text);
          font-size: 0.75rem;
        }

        .auto-detect-btn {
          margin-top: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: var(--radius-xs);
          font-size: 0.75rem;
          cursor: pointer;
        }

        .auto-detect-btn:hover {
          background: var(--accent-color-dark);
        }

        @media (max-width: 768px) {
          .language-dropdown {
            position: fixed;
            top: 50%;
            left: 50%;
            right: auto;
            transform: translate(-50%, -50%);
            width: 90vw;
            max-width: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;