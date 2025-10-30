import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Home, FolderOpen, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear user data from localStorage
      localStorage.removeItem('user');
      
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <Film className="logo-icon" />
          <span className="logo-text">Film Storyboard AI</span>
        </Link>
        
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
          >
            <Home size={18} />
            Home
          </Link>
          <Link 
            to="/projects" 
            className={`nav-link ${isActive('/projects') ? 'nav-link-active' : ''}`}
          >
            <FolderOpen size={18} />
            Projects
          </Link>
          <button 
            onClick={handleLogout}
            className="nav-link logout-btn"
            title="Logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </div>
      <style jsx>{`
        .header {
          background: var(--secondary-bg);
          border-bottom: 1px solid var(--border-color);
          padding: var(--spacing-lg) 0;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 var(--spacing-lg);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          text-decoration: none;
          color: var(--primary-text);
          font-weight: 600;
          font-size: 1.25rem;
          transition: all var(--transition-normal);
        }

        .logo:hover {
          color: var(--accent-color);
          transform: scale(1.05);
        }

        .logo-icon {
          color: var(--accent-color);
        }

        .logo-text {
          font-family: var(--font-display);
          background: var(--gradient-accent);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--secondary-text);
          font-weight: 500;
          transition: all var(--transition-normal);
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-family: inherit;
        }

        .nav-link:hover {
          color: var(--primary-text);
          background: var(--tertiary-bg);
        }

        .logout-btn:hover {
          color: var(--error-color);
          background: rgba(239, 68, 68, 0.1);
        }

        .nav-link-active {
          color: var(--accent-color);
          background: rgba(245, 158, 11, 0.1);
        }

        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color);
          border-radius: 1px;
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0 var(--spacing-md);
          }
          
          .logo-text {
            display: none;
          }
          
          .nav {
            gap: var(--spacing-md);
          }
          
          .nav-link {
            padding: var(--spacing-sm);
          }
          
          .nav-link span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;