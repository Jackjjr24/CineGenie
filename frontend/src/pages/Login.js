import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Firebase email/password sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }));
      
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error codes
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later');
      } else {
        toast.error('Login failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      }));
      
      toast.success(`Welcome ${userCredential.user.displayName || 'back'}!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site');
      } else {
        toast.error('Google sign in failed. Please try again');
      }
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel - Branding */}
      <div className="brand-panel">
        <motion.div 
          className="brand-content"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="logo">
            <Film className="logo-icon" />
            <span className="logo-text">Film Storyboard AI</span>
          </div>
          <h1 className="brand-title">
            Transform Scripts into<br />Emotional Storyboards
          </h1>
          <p className="brand-subtitle">
            Harness the power of AI to automatically analyze your film scripts and generate emotionally expressive storyboard frames.
          </p>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">🎬</div>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📷</div>
              <span>Emotion Recognition</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Instant Generation</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="form-panel">
        <motion.div 
          className="form-container"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button 
              type="button" 
              className="social-button google"
              onClick={handleGoogleSignIn}
            >
              <svg className="social-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #0a0a0a;
        }

        .brand-panel {
          background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 50%);
        }

        .brand-content {
          max-width: 500px;
          position: relative;
          z-index: 2;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          color: #f59e0b;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f59e0b;
        }

        .brand-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          color: #ffffff;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #ffffff 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-subtitle {
          font-size: 1.125rem;
          line-height: 1.6;
          color: #a0a0a0;
          margin-bottom: 40px;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 500;
        }

        .feature-icon {
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 8px;
        }

        .form-panel {
          background: #0f0f0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .form-container {
          width: 100%;
          max-width: 440px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .form-header h2 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 1rem;
          color: #a0a0a0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e0e0e0;
          margin-bottom: 4px;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #666666;
          z-index: 2;
        }

        .form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 1px solid #333333;
          border-radius: 8px;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .form-input::placeholder {
          color: #666666;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #666666;
          cursor: pointer;
          padding: 4px;
          z-index: 2;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a0a0a0;
          cursor: pointer;
        }

        .checkbox {
          display: none;
        }

        .checkmark {
          width: 16px;
          height: 16px;
          border: 1px solid #333333;
          border-radius: 4px;
          position: relative;
          transition: all 0.2s;
          background: #1a1a1a;
        }

        .checkbox:checked + .checkmark {
          background: #f59e0b;
          border-color: #f59e0b;
        }

        .checkbox:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #000000;
          font-size: 12px;
          font-weight: bold;
        }

        .forgot-link {
          color: #f59e0b;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #fbbf24;
        }

        .auth-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-button.primary {
          background: #f59e0b;
          color: #000000;
        }

        .auth-button.primary:hover:not(:disabled) {
          background: #fbbf24;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid #000000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 32px 0;
          color: #666666;
          font-size: 0.875rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #333333;
        }

        .divider::before {
          margin-right: 16px;
        }

        .divider::after {
          margin-left: 16px;
        }

        .social-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }

        .social-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 24px;
          border: 1px solid #333333;
          border-radius: 8px;
          background: #1a1a1a;
          color: #e0e0e0;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .social-button:hover {
          border-color: #444444;
          background: #222222;
        }

        .social-icon {
          width: 18px;
          height: 18px;
        }

        .auth-footer {
          text-align: center;
          color: #a0a0a0;
          font-size: 0.875rem;
        }

        .auth-link {
          color: #f59e0b;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .auth-link:hover {
          color: #fbbf24;
        }

        @media (max-width: 1024px) {
          .auth-container {
            grid-template-columns: 1fr;
          }

          .brand-panel {
            padding: 40px;
          }

          .brand-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .brand-panel,
          .form-panel {
            padding: 32px 24px;
          }

          .brand-title {
            font-size: 2rem;
          }

          .form-options {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;