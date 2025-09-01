import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ProjectsPage.css';

const ProjectsPage = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    technologies: '',
    repositoryUrl: '',
    creatorId: currentUser?.id || ''  // Use the logged-in user's ID
  });
  // Added states for filtering
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Added states for collaborators
  const [selectedProject, setSelectedProject] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsFetching, setCollaboratorsFetching] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Update creatorId when user data is available
  useEffect(() => {
    if (currentUser?.id) {
      setNewProject(prev => ({
        ...prev,
        creatorId: currentUser.id
      }));
    }
  }, [currentUser]);

  // Update filtered projects whenever projects, search term, or selected tags change
  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, selectedTags]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
      
      // Extract all unique tags from projects
      const allTags = new Set();
      data.forEach(project => {
        if (project.technologies) {
          project.technologies.split(',').forEach(tech => {
            allTags.add(tech.trim());
          });
        }
      });
      setAvailableTags(Array.from(allTags).sort());
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCollaborators = async (projectId) => {
    setCollaboratorsFetching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/collaborators`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }
      
      const data = await response.json();
      setCollaborators(data);
      
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    } finally {
      setCollaboratorsFetching(false);
    }
  };

  const handleViewCollaborators = (project) => {
    setSelectedProject(project);
    setShowCollaborators(true);
    fetchProjectCollaborators(project.id);
  };

  const handleCloseCollaborators = () => {
    setShowCollaborators(false);
    setSelectedProject(null);
    setCollaborators([]);
  };

  const addCollaborator = async (projectId) => {
    if (!currentUser?.id) {
      setError('You must be logged in to collaborate on a project');
      return false;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          userId: currentUser.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Already a collaborator - not a real error
          setActionSuccess('You are already collaborating on this project');
          return true;
        }
        throw new Error(errorData.error || 'Failed to join project');
      }
      
      setActionSuccess('Successfully joined project as a collaborator!');
      return true;
      
    } catch (err) {
      console.error('Error joining project:', err);
      setError(err.message || 'Failed to join project. Please try again.');
      return false;
    }
  };

  const handleCollaborate = async (project) => {
    const success = await addCollaborator(project.id);
    if (success) {
      // Show collaborators after successfully joining
      handleViewCollaborators(project);
    }
  };

  const filterProjects = () => {
    let result = [...projects];
    
    // Filter by search term (project name or description)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(project => 
        project.name.toLowerCase().includes(term) || 
        (project.description && project.description.toLowerCase().includes(term))
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(project => {
        if (!project.technologies) return false;
        
        const projectTags = project.technologies.split(',').map(tag => tag.trim());
        return selectedTags.every(tag => projectTags.includes(tag));
      });
    }
    
    setFilteredProjects(result);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!currentUser?.id) {
      setError('You must be logged in to create a project');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...newProject,
          creatorId: currentUser.id  // Ensure we're using the current user's ID
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const data = await response.json();
      console.log("Project created successfully:", data);
      
      // Reset form and refresh project list
      setNewProject({
        name: '',
        description: '',
        technologies: '',
        repositoryUrl: '',
        creatorId: currentUser.id
      });
      
      fetchProjects();
      setActionSuccess('Project created successfully!');
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  if (loading && projects.length === 0) {
    return <div className="projects-page"><h2>Loading projects...</h2></div>;
  }

  return (
    <div className="projects-page">
      <h1>Coding Projects</h1>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => {
            setError(null);
            fetchProjects();
          }} className="btn-refresh">
            Try Again
          </button>
        </div>
      )}
      
      {actionSuccess && (
        <div className="success-message">
          {actionSuccess}
        </div>
      )}
      
      <div className="create-project">
        <h2>Share a Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Project Name</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              value={newProject.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              name="description"
              value={newProject.description}
              onChange={handleInputChange}
              placeholder="Describe your project, its features, and what problem it solves"
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="technologies">Technologies (comma-separated)</label>
            <input 
              type="text" 
              id="technologies" 
              name="technologies"
              value={newProject.technologies}
              onChange={handleInputChange}
              placeholder="e.g. react, nodejs, mongodb"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="repositoryUrl">Repository URL</label>
            <input 
              type="text" 
              id="repositoryUrl" 
              name="repositoryUrl"
              value={newProject.repositoryUrl}
              onChange={handleInputChange}
              placeholder="e.g. https://github.com/username/project"
            />
          </div>
          
          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Creating...' : 'Share Project'}
          </button>
        </form>
      </div>
      
      <h2>All Projects</h2>
      
      {/* Project filters */}
      <div className="project-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="tags-filter">
          <div className="filter-header">
            <h3>Filter by technology:</h3>
            {selectedTags.length > 0 && (
              <button onClick={resetFilters} className="btn-reset">
                Clear filters
              </button>
            )}
          </div>
          
          <div className="available-tags">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className={`filter-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="selected-tags">
              <p>Active filters:</p>
              <div className="tags-container">
                {selectedTags.map(tag => (
                  <span key={tag} className="tech-tag selected">
                    {tag}
                    <button 
                      onClick={() => handleTagSelect(tag)} 
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="projects-list">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <h3>{project.name}</h3>
              
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              
              {project.technologies && (
                <div className="project-technologies">
                  {project.technologies.split(',').map((tech, index) => (
                    <span key={index} className="tech-tag">{tech.trim()}</span>
                  ))}
                </div>
              )}
              
              <p className="project-creator">
                <strong>Created by:</strong> {project.creator_name}
              </p>
              
              {project.repository_url && (
                <a 
                  href={project.repository_url}
                  target="_blank"
                  rel="noreferrer"
                  className="repository-link"
                >
                  View Repository
                </a>
              )}
              
              <div className="project-actions">
                <button 
                  className="btn-view-collaborators"
                  onClick={() => handleViewCollaborators(project)}
                >
                  View Team
                </button>
                
                <button 
                  className="btn-collaborate"
                  onClick={() => handleCollaborate(project)}
                >
                  Collaborate
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-projects-message">
            {projects.length > 0 
              ? "No projects match your filters. Try adjusting your search criteria."
              : "No projects found. Share your first project above!"}
          </p>
        )}
      </div>
      
      {/* Collaborators Modal */}
      {showCollaborators && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseCollaborators}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Project Team: {selectedProject.name}</h3>
              <button onClick={handleCloseCollaborators} className="modal-close">&times;</button>
            </div>
            
            <div className="modal-body">
              {collaboratorsFetching ? (
                <p className="loading-text">Loading collaborators...</p>
              ) : (
                <>
                  {collaborators.length > 0 ? (
                    <div className="collaborators-list">
                      {collaborators.map(collaborator => (
                        <div key={collaborator.id} className="collaborator-item">
                          <div className="collaborator-avatar">
                            {collaborator.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="collaborator-details">
                            <p className="collaborator-name">
                              {collaborator.username}
                              {collaborator.isCreator && <span className="creator-badge">Creator</span>}
                            </p>
                            <p className="collaborator-joined">
                              Joined: {new Date(collaborator.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No collaborators for this project yet.</p>
                  )}
                
                  <div className="modal-actions">
                    <button onClick={handleCloseCollaborators} className="btn-cancel">
                      Close
                    </button>
                    <button 
                      onClick={() => addCollaborator(selectedProject.id)}
                      className="btn-confirm"
                    >
                      Join Project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage; 