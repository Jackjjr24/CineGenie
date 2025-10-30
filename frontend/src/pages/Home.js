import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Film, Sparkles, Zap, Database, Palette } from 'lucide-react';
import ScriptUpload from '../components/ScriptUpload';

const Home = () => {
  const [showUpload, setShowUpload] = useState(false);

  const features = [
    {
      icon: <Sparkles className="feature-icon" />,
      title: "AI Emotion Detection",
      description: "Advanced NLP analysis using Hugging Face Transformers to detect emotions in your script scenes."
    },
    {
      icon: <Palette className="feature-icon" />,
      title: "Stable Diffusion Visuals",
      description: "Generate stunning storyboard frames that match the emotional tone of each scene."
    },
    {
      icon: <Zap className="feature-icon" />,
      title: "Interactive Editing",
      description: "Edit, rearrange, and regenerate storyboard frames with our intuitive interface."
    },
    {
      icon: <Database className="feature-icon" />,
      title: "Project Management",
      description: "Save and manage your projects with full database support and version history."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section className="hero" variants={itemVariants}>
        <div className="hero-content">
          <motion.div 
            className="hero-badge"
            variants={itemVariants}
          >
            <Film size={20} />
            AI-Powered Storyboarding
          </motion.div>
          
          <motion.h1 className="hero-title" variants={itemVariants}>
            Transform Scripts into
            <span className="hero-accent"> Emotional Storyboards</span>
          </motion.h1>
          
          <motion.p className="hero-description" variants={itemVariants}>
            Harness the power of AI to automatically analyze your film scripts and generate 
            emotionally expressive storyboard frames. Perfect for filmmakers, writers, and 
            content creators who want to visualize their stories without manual sketching.
          </motion.p>
          
          <motion.div className="hero-actions" variants={itemVariants}>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => setShowUpload(true)}
            >
              <Upload size={20} />
              Upload Your Script
            </button>
            
            <Link to="/projects" className="btn btn-secondary btn-lg">
              <Film size={20} />
              View Projects
            </Link>
          </motion.div>
        </div>
        
        <motion.div className="hero-visual" variants={itemVariants}>
          <div className="hero-grid">
            <div className="hero-card hero-card-1">
              <div className="emotion-tag emotion-happy">Happy</div>
              <div className="storyboard-frame"></div>
            </div>
            <div className="hero-card hero-card-2">
              <div className="emotion-tag emotion-dramatic">Dramatic</div>
              <div className="storyboard-frame"></div>
            </div>
            <div className="hero-card hero-card-3">
              <div className="emotion-tag emotion-mysterious">Mysterious</div>
              <div className="storyboard-frame"></div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section className="features" variants={itemVariants}>
        <div className="features-header">
          <h2>Powerful Features for Modern Filmmaking</h2>
          <p>Everything you need to create professional storyboards with AI assistance</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ scale: 1.05, translateY: -5 }}
              transition={{ duration: 0.2 }}
            >
              {feature.icon}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section className="how-it-works" variants={itemVariants}>
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Transform your script to storyboard in three simple steps</p>
        </div>
        
        <div className="steps">
          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Upload Script</h3>
              <p>Upload your film script in text format. Our system supports various screenplay formats.</p>
            </div>
          </motion.div>
          
          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>Our AI analyzes each scene for emotional content using advanced NLP techniques.</p>
            </div>
          </motion.div>
          
          <motion.div className="step" variants={itemVariants}>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Generate Storyboard</h3>
              <p>Watch as Stable Diffusion creates visual representations matching your script's emotions.</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Upload Modal */}
      {showUpload && (
        <ScriptUpload onClose={() => setShowUpload(false)} />
      )}

      <style jsx>{`
        .home {
          min-height: calc(100vh - 120px);
        }

        /* Hero Section */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-3xl);
          align-items: center;
          padding: var(--spacing-3xl) 0;
          min-height: 70vh;
        }

        .hero-content {
          max-width: 600px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-lg);
          background: rgba(245, 158, 11, 0.1);
          color: var(--accent-color);
          border-radius: var(--radius-xl);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: var(--spacing-lg);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: var(--spacing-lg);
          color: var(--primary-text);
        }

        .hero-accent {
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.125rem;
          color: var(--secondary-text);
          line-height: 1.7;
          margin-bottom: var(--spacing-2xl);
        }

        .hero-actions {
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg);
          transform: rotate(5deg);
        }

        .hero-card {
          background: var(--gradient-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-xl);
          position: relative;
          overflow: hidden;
        }

        .hero-card-1 {
          transform: translateY(-20px);
        }

        .hero-card-3 {
          transform: translateY(20px);
          grid-column: 1 / -1;
        }

        .emotion-tag {
          font-size: 0.75rem;
          font-weight: 600;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          display: inline-block;
        }

        .emotion-happy {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success-color);
        }

        .emotion-dramatic {
          background: rgba(239, 68, 68, 0.2);
          color: var(--error-color);
        }

        .emotion-mysterious {
          background: rgba(147, 51, 234, 0.2);
          color: #a855f7;
        }

        .storyboard-frame {
          width: 100%;
          height: 80px;
          background: linear-gradient(45deg, var(--tertiary-bg), var(--secondary-bg));
          border-radius: var(--radius-md);
          position: relative;
        }

        .storyboard-frame::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-color);
          border-radius: 50%;
          background: var(--accent-color);
        }

        /* Features Section */
        .features {
          padding: var(--spacing-3xl) 0;
        }

        .features-header {
          text-align: center;
          margin-bottom: var(--spacing-3xl);
        }

        .features-header h2 {
          font-size: 2.5rem;
          margin-bottom: var(--spacing-md);
        }

        .features-header p {
          font-size: 1.125rem;
          color: var(--secondary-text);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-xl);
        }

        .feature-card {
          background: var(--gradient-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          text-align: center;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-accent);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          color: var(--accent-color);
          margin: 0 auto var(--spacing-lg);
        }

        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-md);
          color: var(--primary-text);
        }

        .feature-card p {
          color: var(--secondary-text);
          line-height: 1.6;
        }

        /* How It Works Section */
        .how-it-works {
          padding: var(--spacing-3xl) 0;
          background: var(--secondary-bg);
          border-radius: var(--radius-xl);
          margin: var(--spacing-3xl) 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: var(--spacing-3xl);
          padding: 0 var(--spacing-xl);
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin-bottom: var(--spacing-md);
        }

        .section-header p {
          font-size: 1.125rem;
          color: var(--secondary-text);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-xl);
          padding: 0 var(--spacing-xl);
        }

        .step {
          display: flex;
          gap: var(--spacing-lg);
          align-items: flex-start;
        }

        .step-number {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: var(--gradient-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          color: white;
        }

        .step-content h3 {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-sm);
          color: var(--primary-text);
        }

        .step-content p {
          color: var(--secondary-text);
          line-height: 1.6;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero {
            grid-template-columns: 1fr;
            gap: var(--spacing-2xl);
            text-align: center;
          }

          .hero-title {
            font-size: 3rem;
          }
        }

        @media (max-width: 768px) {
          .hero {
            padding: var(--spacing-2xl) 0;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-actions {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .steps {
            grid-template-columns: 1fr;
          }

          .step {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .features-header h2,
          .section-header h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Home;