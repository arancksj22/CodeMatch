import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCode, FaLaptopCode, FaChevronLeft, FaEnvelope } from 'react-icons/fa';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, getAuthHeader, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const viewUserId = queryParams.get('id');
  
  // Check if we're viewing someone else's profile
  const isViewingOther = viewUserId && viewUserId !== currentUser?.id?.toString();
  
  // User state that will be populated from auth context or from API
  const [user, setUser] = useState({
    id: null,
    name: '',
    username: '',
    email: '',
    title: 'Developer',
    bio: 'No bio yet',
    location: 'Location not set',
    skills: [],
    projects: [],
    interests: [],
    experience: '',
  });
  
  // State for edit mode (only available for own profile)
  const [isEditing, setIsEditing] = useState(false);
  
  // State for form values during editing
  const [formValues, setFormValues] = useState({...user});

  // State for skill management
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [skillError, setSkillError] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

  // Initialize user data from auth context or fetch from API
  useEffect(() => {
    if (isViewingOther) {
      // If viewing another user's profile, fetch their data
      fetchUserById(viewUserId);
    } else if (currentUser) {
      // If viewing own profile
      setUser(prevUser => ({
        ...prevUser,
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        name: currentUser.username // Default name to username if not available
      }));
      
      setFormValues(prevValues => ({
        ...prevValues,
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        name: currentUser.username
      }));
      
      // Fetch user projects once we have the user ID
      fetchUserProjects(currentUser.id);
    }
  }, [currentUser, viewUserId, isViewingOther]);

  // Fetch user skills and all available skills
  useEffect(() => {
    if (user.id) {
      fetchUserSkills();
      if (!isViewingOther) {
        fetchAvailableSkills();
      }
    }
  }, [user.id, isViewingOther]);

  // Fetch another user's profile by ID
  const fetchUserById = async (userId) => {
    setLoading(true);
    console.log("Fetching profile for user ID:", userId);
    
    try {
      // First, try to get the user data from the server
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: getAuthHeader()
      });
      
      let userData;
      
      if (!response.ok) {
        console.warn(`API call to get user ${userId} failed, trying fallback approach`);
        
        // Fallback: Try to find the user in the local matches or developers data
        // Check if we have data in sessionStorage from previous pages
        const developerData = sessionStorage.getItem('developersList');
        const matchesData = sessionStorage.getItem('matchesList');
        
        if (developerData) {
          const developers = JSON.parse(developerData);
          const dev = developers.find(d => d.id.toString() === userId.toString());
          if (dev) {
            console.log("Found user in developersList:", dev);
            userData = {
              id: dev.id,
              name: dev.name,
              username: dev.name,
              email: dev.email || "user@example.com",
              title: dev.title || "Developer",
              bio: `${dev.title} with ${dev.experience} years of experience.`,
              location: dev.location || "Mumbai, India",
              skills: dev.skills || []
            };
          }
        }
        
        if (!userData && matchesData) {
          const matches = JSON.parse(matchesData);
          const match = matches.find(m => m.id.toString() === userId.toString());
          if (match) {
            console.log("Found user in matchesList:", match);
            userData = {
              id: match.id,
              name: match.username,
              username: match.username,
              email: match.email,
              title: match.title || "Developer",
              bio: "No bio available",
              location: "Mumbai, India",
              skills: match.skills ? match.skills.split(', ') : []
            };
          }
        }
        
        if (!userData) {
          // If still no data, create a minimal user object
          userData = {
            id: userId,
            name: "Developer",
            username: "developer",
            email: "user@example.com",
            title: "Developer",
            bio: "No bio available",
            location: "Location not set",
            skills: []
          };
        }
      } else {
        userData = await response.json();
        console.log("Received user data from API:", userData);
      }
      
      // Update user state with fetched or fallback data
      setUser({
        id: userData.id,
        name: userData.name || userData.username,
        username: userData.username,
        email: userData.email,
        title: userData.title || 'Developer',
        bio: userData.bio || 'No bio available',
        location: userData.location || 'Mumbai, India',
        skills: Array.isArray(userData.skills) ? userData.skills : [],
        projects: [],
        interests: []
      });
      
      // Also fetch their skills and projects if possible
      try {
        fetchUserProjects(userId);
      } catch (e) {
        console.warn("Could not fetch user projects:", e);
      }
      
      // If we have skills information already, use it
      if (userData.skills && Array.isArray(userData.skills)) {
        setUserSkills(userData.skills.map((skill, index) => ({
          id: index + 1,
          name: skill
        })));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkills = async () => {
    if (!user.id) return;
    
    setLoading(true);
    setSkillError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/user-skills/${user.id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user skills');
      }
      
      const skills = await response.json();
      setUserSkills(skills);
      
      // Update the user state with the fetched skills
      setUser(prev => ({
        ...prev,
        skills: skills.map(skill => skill.name)
      }));
      
      // Update form values too if needed and not viewing another user
      if (!isViewingOther) {
        setFormValues(prev => ({
          ...prev,
          skills: skills.map(skill => skill.name)
        }));
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
      setSkillError('Failed to load skills. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/projects`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user projects');
      }
      
      const projects = await response.json();
      setUserProjects(projects);
      
      // Update user state with projects
      setUser(prev => ({
        ...prev,
        projects: projects
      }));
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/skills', {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch skills');
      }
      
      const skills = await response.json();
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Error fetching available skills:', error);
      setSkillError('Failed to load available skills. Please refresh the page.');
    }
  };

  const addSkillToUser = async () => {
    if (!selectedSkill || !user.id) return;
    
    setLoading(true);
    setSkillError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/user-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          userId: user.id,
          skillId: parseInt(selectedSkill)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }
      
      // Successfully added skill, refresh user skills
      await fetchUserSkills();
      setSelectedSkill('');
    } catch (error) {
      console.error('Error adding skill:', error);
      setSkillError(error.message || 'Failed to add skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeSkillFromUser = async (skillId) => {
    if (!user.id) return;
    
    setLoading(true);
    setSkillError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/user-skills/${user.id}/${skillId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove skill');
      }
      
      // Successfully removed skill, refresh user skills
      await fetchUserSkills();
    } catch (error) {
      console.error('Error removing skill:', error);
      setSkillError(error.message || 'Failed to remove skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a message to this user
  const handleMessage = () => {
    console.log("Opening chat with user:", user.username, "ID:", user.id);
    
    // Store the selected user in sessionStorage for use in ChatPage
    sessionStorage.setItem('selectedMatch', JSON.stringify({
      id: user.id,
      name: user.username,
      isOnline: true
    }));
    
    // Navigate to ChatPage
    navigate('/chat');
  };

  // Go back to previous page
  const handleBack = () => {
    navigate(-1);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If we're already editing, save changes to backend
      saveProfileChanges(formValues);
    } else {
      // If we're not editing, switch to edit mode and copy current user data to form
      setFormValues({...user});
    }
    setIsEditing(!isEditing);
  };
  
  // Save profile changes to backend
  const saveProfileChanges = async (profileData) => {
    setLoading(true);
    
    try {
      // First update the user state locally for immediate feedback
      setUser({
        ...user,
        name: profileData.name,
        username: profileData.username,
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location
      });
      
      // Log what we're updating
      console.log('Updating profile with:', profileData);
      
      // Make direct update to users table in the database
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          name: profileData.name,
          username: profileData.username,
          title: profileData.title,
          bio: profileData.bio,
          location: profileData.location
        })
      });
      
      if (!response.ok) {
        // Try a direct SQL-like approach as fallback
        const sqlResponse = await fetch(`http://localhost:5000/api/db/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          body: JSON.stringify({
            table: 'users',
            id: user.id,
            updates: {
              name: profileData.name,
              username: profileData.username,
              title: profileData.title,
              bio: profileData.bio,
              location: profileData.location
            }
          })
        });
        
        if (!sqlResponse.ok) {
          throw new Error('Failed to update profile in database');
        }
      }
      
      // Use the updateUser function from AuthContext to update the user data
      // This will update both the context state and localStorage
      const updateData = {
        name: profileData.name,
        username: profileData.username,
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location
      };
      
      const updated = updateUser(updateData);
      if (!updated) {
        console.warn('Failed to update user in auth context');
      }
      
      alert('Profile updated successfully in database');
    } catch (error) {
      console.error('Error during profile update:', error);
      
      // Even if backend fails, store in localStorage as fallback
      localStorage.setItem('user_profile', JSON.stringify({
        ...user,
        name: profileData.name,
        username: profileData.username,
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location
      }));
      
      alert('Profile saved locally. Backend update failed.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel edit mode and discard changes
  const cancelEdit = () => {
    setIsEditing(false);
    setFormValues({...user});
  };
  
  if (loading && !user.id) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-profile">Loading profile...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          {isViewingOther && (
            <button className="back-btn" onClick={handleBack}>
              <FaChevronLeft /> Back
            </button>
          )}
          <h1 className="profile-title">
            {isViewingOther ? `${user.name}'s Profile` : 'My Profile'}
          </h1>
          
          {isViewingOther ? (
            <button 
              className="btn btn-primary message-btn"
              onClick={handleMessage}
            >
              <FaEnvelope /> Message
            </button>
          ) : (
            <>
              <button 
                className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleEditMode}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
              {isEditing && (
                <button className="btn btn-secondary cancel-btn" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
        
        <div className="profile-content">
          <section className="profile-main">
            <div className="profile-info">
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formValues.name} 
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input 
                      type="text" 
                      name="username" 
                      value={formValues.username} 
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input 
                      type="text" 
                      name="title" 
                      value={formValues.title} 
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formValues.email} 
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={formValues.location} 
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="profile-name">{user.name}</h2>
                  <p className="profile-username">@{user.username}</p>
                  <p className="profile-title-text">{user.title}</p>
                  <p className="profile-location">
                    <FaMapMarkerAlt className="location-icon" /> {user.location}
                  </p>
                </>
              )}
            </div>
          </section>
          
          <section className="profile-section bio-section">
            <h3 className="section-title">About Me</h3>
            {isEditing ? (
              <textarea 
                name="bio" 
                value={formValues.bio} 
                onChange={handleInputChange}
                className="form-input bio-textarea"
                rows="4"
              />
            ) : (
              <p className="profile-bio">{user.bio}</p>
            )}
          </section>
          
          <section className="profile-section">
            <h3 className="section-title">
              <FaCode className="section-icon" /> Skills
            </h3>
            <div className="skills-container">
              {userSkills.length > 0 ? (
                userSkills.map((skill) => (
                  <div key={skill.id} className="skill-tag">
                    {skill.name}
                    {!isViewingOther && (
                      <button 
                        className="remove-skill-btn"
                        onClick={() => removeSkillFromUser(skill.id)}
                        title="Remove skill"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-skills-message">No skills added yet.</p>
              )}
            </div>
            
            {/* Skill Management Component - only shown on own profile */}
            {!isViewingOther && (
              <div className="skill-management">
                <h4>Add a Skill</h4>
                {skillError && (
                  <div className="error-message skill-error">
                    {skillError}
                  </div>
                )}
                <div className="skill-form">
                  <select 
                    value={selectedSkill} 
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="skill-select"
                    disabled={loading}
                  >
                    <option value="">Select a skill to add</option>
                    {availableSkills
                      .filter(skill => !userSkills.some(userSkill => userSkill.id === skill.id))
                      .map(skill => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))
                    }
                  </select>
                  <button 
                    onClick={addSkillToUser} 
                    disabled={loading || !selectedSkill}
                    className="add-skill-btn"
                  >
                    {loading ? 'Adding...' : 'Add Skill'}
                  </button>
                </div>
              </div>
            )}
          </section>
          
          <section className="profile-section">
            <h3 className="section-title">
              <FaLaptopCode className="section-icon" /> Projects
            </h3>
            <div className="projects-list">
              {userProjects.length > 0 ? (
                userProjects.map(project => (
                  <div key={project.id} className="project-card">
                    <h4 className="project-name">{project.name}</h4>
                    <p className="project-description">{project.description}</p>
                  </div>
                ))
              ) : (
                <p className="no-projects-message">No projects added yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 