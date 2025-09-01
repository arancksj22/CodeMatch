import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUser, FaEnvelope, FaLink } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/MatchesPage.css';

const MatchesPage = () => {
  const { currentUser, getAuthHeader } = useAuth();
  const [userMatches, setUserMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchUserMatches();
    }
    
    // Check if we need to refresh after new connections
    window.addEventListener('focus', checkForNewMatches);
    
    // Listen for the custom 'newMatch' event from SwipePage
    const handleNewMatch = (event) => {
      const newMatch = event.detail;
      console.log("Received new match event:", newMatch);
      
      // Add the new match to the current list if it's not already there
      setUserMatches(prevMatches => {
        // Check if this match already exists
        const matchExists = prevMatches.some(match => match.id === newMatch.id);
        
        if (!matchExists) {
          console.log("Adding new match to matches list:", newMatch);
          return [...prevMatches, newMatch];
        }
        
        return prevMatches;
      });
    };
    
    window.addEventListener('newMatch', handleNewMatch);
    
    return () => {
      window.removeEventListener('focus', checkForNewMatches);
      window.removeEventListener('newMatch', handleNewMatch);
    };
  }, [currentUser]);

  // Function to check for newly added matches in sessionStorage
  const checkForNewMatches = () => {
    if (userMatches.length > 0) {
      // Get matches from sessionStorage
      const matchesJSON = sessionStorage.getItem('matchesList');
      
      if (matchesJSON) {
        try {
          const sessionMatches = JSON.parse(matchesJSON);
          
          // Check if there are new matches that aren't in our current list
          let hasNewMatches = false;
          for (const sessionMatch of sessionMatches) {
            if (!userMatches.some(match => match.id === sessionMatch.id)) {
              hasNewMatches = true;
              break;
            }
          }
          
          if (hasNewMatches || sessionMatches.length > userMatches.length) {
            console.log("Found new matches in sessionStorage, refreshing matches list");
            // Refresh matches from sessionStorage
            setUserMatches(sessionMatches);
          }
        } catch (error) {
          console.error("Error parsing matches from sessionStorage:", error);
        }
      }
    }
  };

  const fetchUserMatches = async () => {
    setLoading(true);
    setError(null);
    
    // First check if we have matches in sessionStorage
    const matchesJSON = sessionStorage.getItem('matchesList');
    let localMatches = [];
    
    if (matchesJSON) {
      try {
        localMatches = JSON.parse(matchesJSON);
        console.log("Found matches in sessionStorage:", localMatches.length);
        
        // If we have local matches, show them immediately while waiting for API
        if (localMatches.length > 0) {
          setUserMatches(localMatches);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error parsing matches from sessionStorage:", error);
      }
    }
    
    try {
      // Make API call to get the latest matches
      const response = await fetch(`http://localhost:5000/api/user-matches/${currentUser.id}`, {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch your connections');
      }
      
      const data = await response.json();
      console.log("Fetched matches from API:", data.length);
      
      // Combine API matches with any local matches that might not be in the API yet
      let combinedMatches = [...data];
      
      if (localMatches.length > 0) {
        // Add local matches that aren't already in the API response
        for (const localMatch of localMatches) {
          if (!combinedMatches.some(match => match.id === localMatch.id)) {
            combinedMatches.push(localMatch);
          }
        }
      }
      
      // If we have matches, use them
      if (combinedMatches.length > 0) {
        setUserMatches(combinedMatches);
        // Store the updated combined matches in sessionStorage
        sessionStorage.setItem('matchesList', JSON.stringify(combinedMatches));
      } 
      // If no matches, keep using local matches if available
      else if (localMatches.length > 0) {
        console.log("API returned no matches, but using local matches:", localMatches.length);
        setUserMatches(localMatches);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError('Failed to load your connections from the server. Showing locally stored connections if available.');
      
      // If API call failed but we have local matches, keep using them
      if (localMatches.length > 0) {
        console.log("Using local matches due to API error:", localMatches.length);
        setUserMatches(localMatches);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (match) => {
    // Store the selected match in sessionStorage for use in ChatPage
    sessionStorage.setItem('selectedMatch', JSON.stringify({
      id: match.id,
      name: match.username,
      email: match.email,
      isOnline: true
    }));
    
    console.log("Opening chat with user:", match.username, "ID:", match.id);
    
    // Navigate to ChatPage
    navigate('/chat');
  };

  const handleViewProfile = (match) => {
    console.log("Viewing profile of user with ID:", match.id, "Name:", match.username);
    
    // Store detailed profile data for the ProfilePage component to use
    const profileData = {
      id: match.id,
      name: match.username,
      username: match.username,
      email: match.email || "",
      title: match.title || "Developer",
      bio: match.bio || "No bio available",
      location: match.location || "Mumbai, India",
      skills: match.skills ? match.skills.split(', ') : []
    };
    
    // Store current user info for fallback if API fails
    sessionStorage.setItem('currentViewingProfile', JSON.stringify(profileData));
    
    // Navigate to the profile page with the match's ID as a query parameter
    navigate(`/profile?id=${match.id}`);
  };

  return (
    <div className="matches-page">
      <div className="matches-container">
        <h1>Your Connections</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading connections...</div>
        ) : (
          <>
            {userMatches.length === 0 ? (
              <div className="no-matches">
                <p>You don't have any connections yet.</p>
                <p>Visit the Swipe page to find and connect with teammates!</p>
              </div>
            ) : (
              <div className="matches-list">
                {userMatches.map(match => (
                  <div key={match.id} className="match-card">
                    <div className="match-header">
                      <div className="match-info">
                        <h3 className="match-name">{match.username}</h3>
                        <p className="match-title">{match.title || 'Developer'}</p>
                        <p className="match-email">{match.email}</p>
                      </div>
                    </div>
                    
                    <div className="match-skills">
                      {match.skills ? (
                        match.skills.split(', ').map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))
                      ) : (
                        <span className="no-skills">No skills listed</span>
                      )}
                    </div>
                    
                    <div className="match-date">
                      <small>Matched on {new Date(match.match_date).toLocaleDateString()}</small>
                    </div>
                    
                    <div className="match-actions">
                      <button 
                        className="btn-contact primary"
                        onClick={() => handleMessageClick(match)}
                      >
                        <FaEnvelope /> Message
                      </button>
                      <button 
                        className="btn-contact secondary"
                        onClick={() => handleViewProfile(match)}
                      >
                        <FaUser /> View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchesPage; 