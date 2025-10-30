import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Plus, 
  Calendar, 
  Film, 
  Trash2, 
  Eye,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { apiService } from '../services/api';
import ScriptUpload from '../components/ScriptUpload';
import toast from 'react-hot-toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  if (loading) {
    return (
      <div className="projects-loading">
        <div className="loading-spinner"></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="projects"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="projects-header" variants={itemVariants}>
        <div className="header-content">
          <h1>
            <FolderOpen className="header-icon" />
            Your Projects
          </h1>
          <p>Manage your film scripts and storyboards</p>
        </div>
        
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowUpload(true)}
        >
          <Plus size={20} />
          New Project
        </button>
      </motion.div>

      {projects.length > 0 && (
        <motion.div className="projects-controls" variants={itemVariants}>
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="sort-controls">
            <Filter className="filter-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="created_at">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </motion.div>
      )}

      {filteredAndSortedProjects.length === 0 ? (
        <motion.div className="empty-state" variants={itemVariants}>
          <Film className="empty-icon" />
          <h3>No projects found</h3>
          <p>
            {projects.length === 0 
              ? "Get started by uploading your first film script"
              : "No projects match your search criteria"
            }
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
          >
            <Plus size={20} />
            Create Your First Project
          </button>
        </motion.div>
      ) : (
        <motion.div className="projects-grid" variants={itemVariants}>
          {filteredAndSortedProjects.map((project) => (
            <motion.div
              key={project.id}
              className="project-card"
              variants={itemVariants}
              whileHover={{ scale: 1.02, translateY: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="project-header">
                <h3 className="project-title">{project.title}</h3>
                <div className="project-actions">
                  <Link 
                    to={`/storyboard/${project.id}`}
                    className="btn btn-ghost btn-sm"
                    title="View Storyboard"
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm delete-btn"
                    onClick={() => handleDeleteProject(project.id, project.title)}
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="project-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>{formatDate(project.created_at)}</span>
                </div>
                <div className="meta-item">
                  <BarChart3 size={14} />
                  <span>{project.script_content?.length || 0} characters</span>
                </div>
              </div>

              <div className="project-preview">
                <p>{project.script_content?.substring(0, 150) || 'No content available'}...</p>
              </div>

              <div className="project-footer">
                <Link 
                  to={`/storyboard/${project.id}`}
                  className="btn btn-primary btn-sm"
                >
                  <Film size={16} />
                  Open Storyboard
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {showUpload && (
        <ScriptUpload 
          onClose={() => {
            setShowUpload(false);
            fetchProjects(); // Refresh projects after upload
          }} 
        />
      )}

      <style jsx>{`
        .projects {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-xl) 0;
        }

        .projects-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--spacing-lg);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--tertiary-bg);
          border-top: 3px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .projects-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--spacing-3xl);
          gap: var(--spacing-lg);
        }

        .header-content h1 {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-sm);
        }

        .header-icon {
          color: var(--accent-color);
        }

        .header-content p {
          color: var(--secondary-text);
          font-size: 1.125rem;
          margin: 0;
        }

        .projects-controls {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: var(--spacing-md);
          top: 50%;
          transform: translateY(-50%);
          color: var(--secondary-text);
          width: 18px;
          height: 18px;
        }

        .search-input {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem;
          background: var(--secondary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--primary-text);
          font-size: 0.875rem;
          transition: all var(--transition-normal);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .filter-icon {
          color: var(--secondary-text);
          width: 18px;
          height: 18px;
        }

        .sort-select {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--secondary-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--primary-text);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .empty-state {
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

        .empty-state h3 {
          color: var(--primary-text);
          margin-bottom: var(--spacing-md);
        }

        .empty-state p {
          margin-bottom: var(--spacing-xl);
          font-size: 1.125rem;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-xl);
        }

        .project-card {
          background: var(--gradient-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .project-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-lg);
        }

        .project-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          background: var(--secondary-bg);
        }

        .project-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--primary-text);
          margin: 0;
          flex: 1;
          line-height: 1.4;
        }

        .project-actions {
          display: flex;
          gap: var(--spacing-xs);
          margin-left: var(--spacing-md);
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .project-meta {
          padding: var(--spacing-lg) var(--spacing-lg) 0;
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--secondary-text);
          font-size: 0.875rem;
        }

        .project-preview {
          padding: var(--spacing-lg);
          flex: 1;
        }

        .project-preview p {
          color: var(--secondary-text);
          line-height: 1.5;
          margin: 0;
          font-size: 0.875rem;
        }

        .project-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .projects-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .projects-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            min-width: auto;
          }

          .projects-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
          }

          .project-header {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .project-actions {
            margin-left: 0;
            justify-content: center;
          }

          .project-meta {
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Projects;