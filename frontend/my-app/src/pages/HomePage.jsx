import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartMatching = () => {
    navigate('/login');
  };

  const handleCreateProfile = () => {
    navigate('/register');
  };

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">CodeMatch</h1>
        <p className="home-subtitle">Connect with Developers. Build Amazing Projects.</p>
        
        <div className="home-cta-buttons">
          <button 
            onClick={handleStartMatching} 
            className="cta-button primary"
          >
            Start Matching
          </button>
          <button 
            onClick={handleCreateProfile} 
            className="cta-button secondary"
          >
            Create Profile
          </button>
        </div>
        
        {/* Rest of the existing HomePage content remains the same */}
        <div className="home-features">
          <div className="feature">
            <i className="icon-code"></i>
            <h3>Find Coding Partners</h3>
            <p>Match with developers who share your passion and skills</p>
          </div>
          <div className="feature">
            <i className="icon-project"></i>
            <h3>Collaborate on Projects</h3>
            <p>Discover potential teammates for your next big idea</p>
          </div>
          <div className="feature">
            <i className="icon-hackathon"></i>
            <h3>Hackathon Ready</h3>
            <p>Connect with talents for upcoming hackathon challenges</p>
          </div>
        </div>
      </div>
      
      <div className="home-stats">
        <div className="stat">
          <span className="stat-number">5K+</span>
          <span className="stat-label">Developers</span>
        </div>
        <div className="stat">
          <span className="stat-number">500+</span>
          <span className="stat-label">Active Projects</span>
        </div>
        <div className="stat">
          <span className="stat-number">50+</span>
          <span className="stat-label">Hackathons</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;