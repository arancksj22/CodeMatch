import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/HackathonsPage.css';

const HackathonsPage = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [newHackathon, setNewHackathon] = useState({
    name: '',
    description: '',
    tags: '',
    startDate: '',
    endDate: '',
    location: '',
    createdBy: currentUser?.username || '',
    organizerId: currentUser?.id || ''
  });
  
  // Added states for filtering and modal
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    // Check registration status for all hackathons if user is logged in
    if (currentUser && hackathons.length > 0) {
      checkRegistrationStatus();
    }
  }, [currentUser, hackathons]);

  // Update creator info when user data is available
  useEffect(() => {
    if (currentUser) {
      setNewHackathon(prev => ({
        ...prev,
        createdBy: currentUser.username,
        organizerId: currentUser.id
      }));
    }
  }, [currentUser]);
  
  // Effect to filter hackathons whenever dependencies change
  useEffect(() => {
    filterHackathons();
  }, [hackathons, searchTerm, selectedTags]);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/hackathons', {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hackathons');
      }
      
      const data = await response.json();
      setHackathons(data);
      
      // Extract all unique tags from hackathons
      const allTags = new Set();
      data.forEach(hackathon => {
        if (hackathon.tags) {
          hackathon.tags.split(',').forEach(tag => {
            allTags.add(tag.trim());
          });
        }
      });
      setAvailableTags(Array.from(allTags).sort());
      
    } catch (err) {
      console.error('Error fetching hackathons:', err);
      setError('Failed to load hackathons. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterHackathons = () => {
    let result = [...hackathons];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(hackathon => 
        hackathon.name.toLowerCase().includes(term) || 
        (hackathon.description && hackathon.description.toLowerCase().includes(term))
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter(hackathon => {
        if (!hackathon.tags) return false;
        
        const hackathonTags = hackathon.tags.split(',').map(tag => tag.trim());
        return selectedTags.every(tag => hackathonTags.includes(tag));
      });
    }
    
    setFilteredHackathons(result);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHackathon(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!currentUser?.id) {
      setError('You must be logged in to create a hackathon');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          ...newHackathon,
          organizerId: currentUser.id,
          createdBy: currentUser.username
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create hackathon');
      }
      
      // Reset form and refresh hackathon list
      setNewHackathon({
        name: '',
        description: '',
        tags: '',
        startDate: '',
        endDate: '',
        location: '',
        createdBy: currentUser.username,
        organizerId: currentUser.id
      });
      
      fetchHackathons();
    } catch (err) {
      console.error('Error creating hackathon:', err);
      setError(err.message || 'Failed to create hackathon. Please try again.');
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
  
  const openHackathonDetails = (hackathon) => {
    setSelectedHackathon(hackathon);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  const checkRegistrationStatus = async () => {
    if (!currentUser) return;
    
    try {
      const statuses = {};
      
      // Check each hackathon's registration status for current user
      for (const hackathon of hackathons) {
        const response = await fetch(
          `http://localhost:5000/api/hackathons/${hackathon.id}/registration/${currentUser.id}`,
          { headers: getAuthHeader() }
        );
        
        if (response.ok) {
          const data = await response.json();
          statuses[hackathon.id] = data.isRegistered;
        }
      }
      
      setRegistrationStatus(statuses);
    } catch (err) {
      console.error('Error checking registration status:', err);
    }
  };

  const registerForHackathon = async (hackathonId) => {
    if (!currentUser) {
      setError('You must be logged in to register for a hackathon');
      return;
    }
    
    setRegisterLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/hackathons/${hackathonId}/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({ userId: currentUser.id })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register for hackathon');
      }
      
      // Update registration status locally
      setRegistrationStatus(prev => ({
        ...prev,
        [hackathonId]: true
      }));
      
      setShowModal(false);
    } catch (err) {
      console.error('Error registering for hackathon:', err);
      setError(err.message || 'Failed to register for hackathon. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const cancelRegistration = async (hackathonId) => {
    if (!currentUser) return;
    
    setRegisterLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/hackathons/${hackathonId}/registration/${currentUser.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel registration');
      }
      
      // Update registration status locally
      setRegistrationStatus(prev => ({
        ...prev,
        [hackathonId]: false
      }));
    } catch (err) {
      console.error('Error canceling registration:', err);
      setError(err.message || 'Failed to cancel registration. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading && hackathons.length === 0) {
    return <div className="hackathons-page"><h2>Loading hackathons...</h2></div>;
  }

  return (
    <div className="hackathons-page">
      <h1>Hackathons</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="create-hackathon">
        <h2>Create a Hackathon</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Hackathon Name</label>
            <input 
              type="text" 
              id="name" 
              name="name"
              value={newHackathon.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              name="description"
              value={newHackathon.description}
              onChange={handleInputChange}
              placeholder="Describe the hackathon, its goals, and who should participate"
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input 
              type="text" 
              id="tags" 
              name="tags"
              value={newHackathon.tags}
              onChange={handleInputChange}
              placeholder="e.g. web, ai, beginner-friendly"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              name="startDate"
              value={newHackathon.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              name="endDate"
              value={newHackathon.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input 
              type="text" 
              id="location" 
              name="location"
              value={newHackathon.location}
              onChange={handleInputChange}
              placeholder="Online or physical location"
              required
            />
          </div>
          
          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Creating...' : 'Create Hackathon'}
          </button>
        </form>
      </div>
      
      <h2>All Hackathons</h2>
      
      {/* Hackathon filters */}
      <div className="hackathon-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search hackathons..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="tags-filter">
          <div className="filter-header">
            <h3>Filter by tags:</h3>
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
                  <span key={tag} className="tag selected">
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
      
      <div className="hackathons-list">
        {filteredHackathons.length > 0 ? (
          filteredHackathons.map(hackathon => (
            <div key={hackathon.id} className="hackathon-card">
              <h3>{hackathon.name}</h3>
              {hackathon.description && (
                <p className="hackathon-description">{hackathon.description}</p>
              )}
              {hackathon.tags && (
                <div className="hackathon-tags">
                  {hackathon.tags.split(',').map((tag, index) => (
                    <span key={index} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <p className="hackathon-dates">
                <strong>Start:</strong> {new Date(hackathon.start_date).toLocaleDateString()}
                <br />
                <strong>End:</strong> {new Date(hackathon.end_date).toLocaleDateString()}
                <br />
                <strong>Location:</strong> {hackathon.location}
              </p>
              {currentUser && registrationStatus[hackathon.id] ? (
                <button 
                  className="btn-registered"
                  onClick={() => openHackathonDetails(hackathon)}
                >
                  Registered ✓
                </button>
              ) : (
                <button 
                  className="btn-join"
                  onClick={() => openHackathonDetails(hackathon)}
                >
                  Join Hackathon
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="no-hackathons-message">
            {hackathons.length > 0 
              ? "No hackathons match your filters. Try adjusting your search criteria." 
              : "No hackathons found. Create one above!"}
          </p>
        )}
      </div>
      
      {/* Hackathon Details Modal */}
      {showModal && selectedHackathon && (
        <div className="hackathon-modal-overlay" onClick={closeModal}>
          <div className="hackathon-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>×</button>
            <h2>{selectedHackathon.name}</h2>
            
            <div className="hackathon-modal-content">
              <div className="hackathon-details">
                <p>{selectedHackathon.description}</p>
                
                <div className="details-row">
                  <div className="detail-item">
                    <span className="detail-label">Start Date:</span>
                    {new Date(selectedHackathon.start_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">End Date:</span>
                    {new Date(selectedHackathon.end_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                
                <div className="details-row">
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    {selectedHackathon.location}
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Organizer:</span>
                    {selectedHackathon.created_by}
                  </div>
                </div>
              </div>
              
              {selectedHackathon.tags && (
                <div className="hackathon-modal-tags">
                  <h3>Categories</h3>
                  <div className="tags-container">
                    {selectedHackathon.tags.split(',').map((tag, index) => (
                      <span key={index} className="modal-tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sample prizes section */}
              <div className="hackathon-prizes">
                <h3>Prizes</h3>
                <ul>
                  <li>1st Place: $5,000 and mentorship opportunities</li>
                  <li>2nd Place: $2,500 and development tools</li>
                  <li>3rd Place: $1,000</li>
                  <li>Best UI/UX: $500</li>
                </ul>
              </div>
              
              {/* Sample rules section */}
              <div className="hackathon-rules">
                <h3>Rules &amp; Guidelines</h3>
                <ul>
                  <li>Teams of 1-5 participants allowed</li>
                  <li>Code must be written during the hackathon</li>
                  <li>Open source libraries and APIs are permitted</li>
                  <li>Projects must be submitted before the deadline</li>
                  <li>You retain all rights to your intellectual property</li>
                </ul>
              </div>
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={closeModal}>
                  Close
                </button>
                {currentUser ? (
                  registrationStatus[selectedHackathon.id] ? (
                    <button 
                      className="btn-danger"
                      onClick={() => cancelRegistration(selectedHackathon.id)}
                      disabled={registerLoading}
                    >
                      {registerLoading ? 'Processing...' : 'Cancel Registration'}
                    </button>
                  ) : (
                    <button 
                      className="btn-confirm"
                      onClick={() => registerForHackathon(selectedHackathon.id)}
                      disabled={registerLoading}
                    >
                      {registerLoading ? 'Processing...' : 'Confirm Registration'}
                    </button>
                  )
                ) : (
                  <p className="login-prompt">Please log in to register for this hackathon</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HackathonsPage; 