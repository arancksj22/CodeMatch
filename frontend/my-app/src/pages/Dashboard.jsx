import { useState } from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [activeView, setActiveView] = useState('');

  // API URL
  const API_URL = 'http://localhost:5000/api';

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setUsers(data);
      setActiveView('users');
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch skills
  const fetchSkills = async () => {
    try {
      const response = await fetch(`${API_URL}/skills`);
      const data = await response.json();
      setSkills(data);
      setActiveView('skills');
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  // Fetch hackathons
  const fetchHackathons = async () => {
    try {
      const response = await fetch(`${API_URL}/hackathons`);
      const data = await response.json();
      setHackathons(data);
      setActiveView('hackathons');
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>CodeMatch Admin</h1>
      <p>Database Overview</p>

      <section className="database-actions">
        <div className="buttons-container">
          <button onClick={fetchUsers}>View Users</button>
          <button onClick={fetchSkills}>View Skills</button>
          <button onClick={fetchHackathons}>View Hackathons</button>
        </div>
      </section>

      <section className="data-display">
        {activeView === 'users' && (
          <div>
            <h2>Users</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'skills' && (
          <div>
            <h2>Skills</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Skill Name</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(skill => (
                  <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td>{skill.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'hackathons' && (
          <div>
            <h2>Hackathons</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {hackathons.map(hackathon => (
                  <tr key={hackathon.id}>
                    <td>{hackathon.id}</td>
                    <td>{hackathon.name}</td>
                    <td>{new Date(hackathon.start_date).toLocaleDateString()}</td>
                    <td>{new Date(hackathon.end_date).toLocaleDateString()}</td>
                    <td>{hackathon.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard; 