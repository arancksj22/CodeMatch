import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/RegistrationPage.css';

const RegistrationPage = () => {
  const { login, getAuthHeader } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    programmingLanguages: [],
    projectInterests: []
  });

  const [errors, setErrors] = useState({});
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch available skills from the backend
  useEffect(() => {
    fetch('http://localhost:5000/api/skills')
      .then(response => response.json())
      .then(data => {
        setSkills(data);
      })
      .catch(error => {
        console.error('Error fetching skills:', error);
      });
  }, []);

  const programmingLanguageOptions = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 
    'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'TypeScript'
  ];

  const projectInterestOptions = [
    'Web Development', 'Mobile Apps', 'Machine Learning', 
    'Game Development', 'Blockchain', 'Data Science', 
    'Cybersecurity', 'Cloud Computing'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => ({
      ...prev,
      programmingLanguages: prev.programmingLanguages.includes(language)
        ? prev.programmingLanguages.filter(lang => lang !== language)
        : [...prev.programmingLanguages, language]
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      projectInterests: prev.projectInterests.includes(interest)
        ? prev.projectInterests.filter(int => int !== interest)
        : [...prev.projectInterests, interest]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.programmingLanguages.length === 0) {
      newErrors.programmingLanguages = 'Select at least one programming language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        // 1. Register the user
        const userResponse = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });
        
        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
          throw new Error(userData.error || 'Failed to register user');
        }
        
        // Log the user in immediately
        login(userData);
        
        // 2. Add skills to the user using JWT authentication
        const skillPromises = formData.programmingLanguages.map(language => {
          // Find the skill ID by name
          const skill = skills.find(s => s.name === language);
          if (skill) {
            return fetch('http://localhost:5000/api/user-skills', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
              },
              body: JSON.stringify({
                userId: userData.user.id,
                skillId: skill.id
              })
            });
          }
          return null;
        }).filter(promise => promise !== null);
        
        await Promise.all(skillPromises);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({ submit: error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h2 className="registration-title">Create Your CodeMatch Profile</h2>
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a unique username"
            />
            {errors.username && <div className="error-message">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>

          <div className="form-group">
            <label>Programming Languages</label>
            <div className="checkbox-group">
              {programmingLanguageOptions.map(language => (
                <label key={language} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.programmingLanguages.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                  />
                  {language}
                </label>
              ))}
            </div>
            {errors.programmingLanguages && <div className="error-message">{errors.programmingLanguages}</div>}
          </div>

          <div className="form-group">
            <label>Project Interests</label>
            <div className="checkbox-group">
              {projectInterestOptions.map(interest => (
                <label key={interest} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.projectInterests.includes(interest)}
                    onChange={() => handleInterestToggle(interest)}
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>

          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <button type="submit" className="registration-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="login-link-container">
            Already have an account? <Link to="/login" className="login-link">Log In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;