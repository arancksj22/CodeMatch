import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaFilter, FaMapMarkerAlt, FaCode, FaLaptopCode } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/SwipePage.css';

const SwipePage = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredDevelopers, setFilteredDevelopers] = useState([]);
  const [connectionSuccess, setConnectionSuccess] = useState(null);
  
  // Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Fetch all developers and skills when component mounts
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchDevelopers();
      fetchAvailableSkills();
    }
  }, [currentUser]);

  // Store developers in sessionStorage whenever they change
  useEffect(() => {
    if (developers.length > 0) {
      sessionStorage.setItem('developersList', JSON.stringify(developers));
    }
  }, [developers]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    filterDevelopers();
  }, [searchTerm, selectedSkill, experienceLevel, developers]);

  // Reset connection success message after 3 seconds
  useEffect(() => {
    if (connectionSuccess) {
      const timer = setTimeout(() => {
        setConnectionSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionSuccess]);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/matches/${currentUser.id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch developers');
      }
      
      let data = await response.json();
      
      // Format the data to include additional information
      const formattedDevelopers = data.map(dev => ({
        id: dev.user2_id,
        name: dev.user2_name,
        email: dev.user2_email,
        skills: dev.shared_skills ? dev.shared_skills.split(', ') : [],
        commonSkills: dev.common_skills || 0,
        location: "Mumbai, India", // Sample location
        experience: Math.floor(Math.random() * 5) + 1, // Random experience between 1-5 years
        title: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "UI/UX Designer", "Mobile App Developer"][Math.floor(Math.random() * 5)]
      }));
      
      setDevelopers(formattedDevelopers);
      setFilteredDevelopers(formattedDevelopers);
    } catch (err) {
      console.error('Error fetching developers:', err);
      setError('Failed to load developers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/skills', {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      
      const data = await response.json();
      setAvailableSkills(data);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  const filterDevelopers = () => {
    let filtered = [...developers];
    
    // Apply search term filter (case insensitive)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(dev => 
        dev.name.toLowerCase().includes(term) || 
        dev.email.toLowerCase().includes(term) ||
        dev.title.toLowerCase().includes(term) ||
        dev.skills.some(skill => skill.toLowerCase().includes(term))
      );
    }
    
    // Apply skill filter
    if (selectedSkill && selectedSkill !== 'all') {
      filtered = filtered.filter(dev => 
        dev.skills.some(skill => skill.toLowerCase() === selectedSkill.toLowerCase())
      );
    }
    
    // Apply experience level filter
    if (experienceLevel && experienceLevel !== 'all') {
      switch (experienceLevel) {
        case 'junior':
          filtered = filtered.filter(dev => dev.experience < 3);
          break;
        case 'mid':
          filtered = filtered.filter(dev => dev.experience >= 3 && dev.experience < 6);
          break;
        case 'senior':
          filtered = filtered.filter(dev => dev.experience >= 6);
          break;
        default:
          break;
      }
    }
    
    setFilteredDevelopers(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSkill('');
    setExperienceLevel('');
  };

  // View developer's profile
  const handleViewProfile = (developerId) => {
    console.log("Viewing profile of developer with ID:", developerId);
    // Navigate to the profile page with the query parameter
    navigate(`/profile?id=${developerId}`);
  };

  // Connect with developer
  const handleConnect = async (developerId, developerName) => {
    try {
      console.log("Connecting with developer:", developerName, "ID:", developerId);
      
      const response = await fetch('http://localhost:5000/api/matches/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          userId: currentUser.id,
          matchedUserId: developerId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect with developer');
      }
      
      // Show success message
      setConnectionSuccess(`Successfully connected with ${developerName}!`);
      
      // Find the developer in our current list
      const developer = developers.find(dev => dev.id === developerId);
      
      if (!developer) {
        console.error("Could not find developer in the list");
        return;
      }
      
      // Create a new match object to add to sessionStorage
      const newMatch = {
        id: developerId,
        username: developerName,
        email: developer.email || "",
        title: developer.title || "Developer",
        skills: developer.skills.join(', ') || "",
        match_date: new Date().toISOString(),
        location: developer.location || "Mumbai, India"
      };
      
      // Get existing matches from sessionStorage
      const existingMatchesJSON = sessionStorage.getItem('matchesList');
      let existingMatches = [];
      
      if (existingMatchesJSON) {
        try {
          existingMatches = JSON.parse(existingMatchesJSON);
          
          // Check if this match already exists
          const matchExists = existingMatches.some(match => match.id === developerId);
          
          if (!matchExists) {
            // Add the new match to existing matches
            existingMatches.push(newMatch);
            
            // Update sessionStorage
            sessionStorage.setItem('matchesList', JSON.stringify(existingMatches));
            console.log("Added new match to matchesList in sessionStorage:", newMatch);
            
            // Dispatch a custom event to notify MatchesPage about the new match
            const newMatchEvent = new CustomEvent('newMatch', { detail: newMatch });
            window.dispatchEvent(newMatchEvent);
          }
        } catch (error) {
          console.error("Error parsing matches from sessionStorage:", error);
          
          // Create a new matches array with just this match
          sessionStorage.setItem('matchesList', JSON.stringify([newMatch]));
          
          // Dispatch a custom event to notify MatchesPage about the new match
          const newMatchEvent = new CustomEvent('newMatch', { detail: newMatch });
          window.dispatchEvent(newMatchEvent);
        }
      } else {
        // No existing matches, create a new array
        sessionStorage.setItem('matchesList', JSON.stringify([newMatch]));
        console.log("Created new matchesList in sessionStorage with:", newMatch);
        
        // Dispatch a custom event to notify MatchesPage about the new match
        const newMatchEvent = new CustomEvent('newMatch', { detail: newMatch });
        window.dispatchEvent(newMatchEvent);
      }
    } catch (error) {
      console.error('Error connecting with developer:', error);
      setConnectionSuccess('Failed to connect. Please try again.');
    }
  };

  // Error handling
  const handleRetry = () => {
    setError(null);
    fetchDevelopers();
  };

  if (loading && developers.length === 0) {
    return (
      <div className="connect-page">
        <div className="connect-container">
          <h1 className="connect-title">Browse Developers</h1>
          <div className="loading">Loading developers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connect-page">
        <div className="connect-container">
          <h1 className="connect-title">Browse Developers</h1>
          <div className="error-message">
            {error}
            <button onClick={handleRetry} className="retry-button">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-page">
      <div className="connect-container">
        <h1 className="connect-title">Browse Developers</h1>
        
        {connectionSuccess && (
          <div className="connection-success-message">
            {connectionSuccess}
          </div>
        )}
        
        <div className="connect-content">
          <div className="filter-sidebar">
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="reset-filters" onClick={resetFilters}>
                <FaFilter /> Reset
              </button>
            </div>
            
            <div className="filter-form">
              <div className="form-group">
                <label className="form-label">Search</label>
                <div className="search-input-container">
                  <input 
                    type="text" 
                    className="form-input search-input" 
                    placeholder="Search by name, email, or skill..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="search-icon" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Filter by Skill</label>
                <select 
                  className="form-input" 
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  <option value="">All Skills</option>
                  {availableSkills.map(skill => (
                    <option key={skill.id} value={skill.name}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select 
                  className="form-input" 
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid-Level (3-5 years)</option>
                  <option value="senior">Senior (6+ years)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="connect-main">
            {filteredDevelopers.length === 0 ? (
              <div className="no-more-profiles">
                <h2>No developers found</h2>
                <p>Try adjusting your filters or search criteria</p>
                <button onClick={resetFilters} className="btn btn-primary mt-4">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="developers-grid">
                {filteredDevelopers.map(dev => (
                  <div key={dev.id} className="developer-card">
                    <div className="dev-header">
                      <h3 className="dev-name">{dev.name}</h3>
                      <p className="dev-title">{dev.title}</p>
                      <p className="dev-location">
                        <FaMapMarkerAlt /> {dev.location}
                      </p>
                    </div>
                    
                    <div className="dev-info">
                      <div className="dev-stats">
                        <div className="dev-stat">
                          <span className="stat-value">{dev.experience}</span>
                          <span className="stat-label">Years</span>
                        </div>
                        <div className="dev-stat">
                          <span className="stat-value">{dev.skills.length}</span>
                          <span className="stat-label">Skills</span>
                        </div>
                        <div className="dev-stat">
                          <span className="stat-value">{dev.commonSkills}</span>
                          <span className="stat-label">Common</span>
                        </div>
                      </div>
                      
                      <div className="dev-section">
                        <h4 className="section-title"><FaCode /> Skills</h4>
                        <div className="dev-tags">
                          {dev.skills.length > 0 ? (
                            dev.skills.map((skill, index) => (
                              <span key={index} className="dev-tag">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="no-skills">No skills listed</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="dev-section" style={{ marginBottom: 0, borderBottom: 'none' }}>
                        <h4 className="section-title"><FaLaptopCode /> Expertise</h4>
                        <p className="dev-expertise">
                          {dev.title} with {dev.experience} years of experience
                        </p>
                      </div>
                    </div>
                    
                    <div className="dev-actions">
                      <button 
                        className="view-profile-btn"
                        onClick={() => handleViewProfile(dev.id)}
                      >
                        View Profile
                      </button>
                      <button 
                        className="connect-btn"
                        onClick={() => handleConnect(dev.id, dev.name)}
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipePage; 