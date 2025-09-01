import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  // Determine which link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="navbar">
      <div className="logo">CodeMatch</div>
      {isAuthenticated && (
      <nav>
        <ul className="nav-list">
            <li><Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link></li>
          <li><Link to="/swipe" className={`nav-link ${isActive('/swipe')}`}>Swipe</Link></li>
          <li><Link to="/matches" className={`nav-link ${isActive('/matches')}`}>Matches</Link></li>
          <li><Link to="/profile" className={`nav-link ${isActive('/profile')}`}>Profile</Link></li>
          <li><Link to="/projects" className={`nav-link ${isActive('/projects')}`}>Projects</Link></li>
            <li><Link to="/hackathons" className={`nav-link ${isActive('/hackathons')}`}>Hackathons</Link></li>
          <li><Link to="/chat" className={`nav-link ${isActive('/chat')}`}>Chats</Link></li>
        </ul>
      </nav>
      )}
      
      {isAuthenticated && (
        <div className="user-menu">
          <span className="username">{currentUser?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      )}
    </header>
  );
};

export default Navbar;