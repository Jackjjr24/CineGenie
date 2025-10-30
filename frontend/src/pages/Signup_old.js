import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Eye, EyeOff, User, Lock, Mail, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call - replace with actual registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create user account
      // In production, you'd send this to your backend
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Account created successfully! Welcome aboard!');
      navigate('/');
      
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (formData.password.length === 0) return 0;
    if (formData.password.length < 6) return 1;
    if (formData.password.length < 8) return 2;
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) return 4;
    return 3;
  };

  const getStrengthLabel = (strength) => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength];
  };

  const getStrengthColor = (strength) => {
    const colors = ['', '#ef4444', '#f59e0b', '#10b981', '#059669'];
    return colors[strength];
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-pattern"></div>
      </div>
      
      <motion.div 
        className="auth-card signup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Film className="logo-icon" />
            <h1>Film Storyboard AI</h1>
          </div>
          <p className="auth-subtitle">
            Create your account and start bringing your stories to life with AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <User size={18} />
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <User size={18} />
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@example.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock size={18} />
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength() / 4) * 100}%`,
                      backgroundColor: getStrengthColor(passwordStrength())
                    }}
                  ></div>
                </div>
                <span className="strength-label" style={{ color: getStrengthColor(passwordStrength()) }}>
                  {getStrengthLabel(passwordStrength())}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <Lock size={18} />
              Confirm Password
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <span className="error-message">Passwords do not match</span>
            )}
          </div>

          <div className="terms-agreement">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="checkmark">
                {agreedToTerms && <Check size={12} />}
              </span>
              <span>
                I agree to the{' '}
                <Link to="/terms" className="auth-link">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="auth-link">Privacy Policy</Link>
              </span>
            </label>
          </div>

          <motion.button
            type="submit"
            className={`auth-button primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="auth-features">
          <div className="feature">
            <span className="feature-icon">🎬</span>
            <span>AI-Powered Storyboards</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Lightning Fast Generation</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎨</span>
            <span>Multiple Art Styles</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;