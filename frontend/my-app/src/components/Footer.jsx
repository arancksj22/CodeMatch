import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">CodeMatch</h3>
          <p className="footer-description">
            Find the perfect coding partner for your next project or hackathon.
          </p>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/swipe">Find Partners</Link></li>
            <li><Link to="/projects">Browse Projects</Link></li>
            <li><Link to="/hackathons">Hackathons</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-subtitle">Account</h4>
          <ul className="footer-links">
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
            <li><Link to="/matches">My Matches</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-subtitle">Connect</h4>
          <div className="social-links">
            <a href="#" className="social-link github" aria-label="GitHub">
              <i className="fab fa-github"></i>
            </a>
            <a href="#" className="social-link twitter" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="social-link linkedin" aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#" className="social-link discord" aria-label="Discord">
              <i className="fab fa-discord"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CodeMatch. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 