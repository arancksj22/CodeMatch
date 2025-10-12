const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Secret key for JWT signing
const JWT_SECRET = '';

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' });
    }
    
    req.user = user;
    next();
  });
};

// MySQL Connection
const db = mysql.createPool({
    host: 'localhost',
    user: '',
    password: '',
    database: '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connect to MySQL
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    connection.release();

    // Initialize database tables
    initDatabase();
});

// Initialize database tables
function initDatabase() {
    // Create users table
    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            bio TEXT,
            role ENUM('developer', 'recruiter', 'admin') DEFAULT 'developer',
            profile_image VARCHAR(255),
            github_url VARCHAR(255),
            linkedin_url VARCHAR(255),
            website_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
            return;
        }
        console.log('Users table ready');
    });

    // Create skills table
    db.query(`
        CREATE TABLE IF NOT EXISTS skills (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating skills table:', err);
            return;
        }
        console.log('Skills table ready');
    });

    // Create user_skills join table
    db.query(`
        CREATE TABLE IF NOT EXISTS user_skills (
            user_id INT,
            skill_id INT,
            PRIMARY KEY (user_id, skill_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating user_skills table:', err);
            return;
        }
        console.log('User_skills table ready');
    });

    // Create hackathons table
    db.query(`
        CREATE TABLE IF NOT EXISTS hackathons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            tags VARCHAR(255),
            start_date DATE,
            end_date DATE,
            location VARCHAR(255) DEFAULT 'Online',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating hackathons table:', err);
            return;
        }
        console.log('Hackathons table ready');
        initHackathons();
    });

    // Create hackathon_registrations table
    db.query(`
        CREATE TABLE IF NOT EXISTS hackathon_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            hackathon_id INT NOT NULL,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY user_hackathon (user_id, hackathon_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (hackathon_id) REFERENCES hackathons(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating hackathon_registrations table:', err);
            return;
        }
        console.log('Hackathon registrations table ready');
    });

    // Create teams table
    db.query(`
    CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        hackathon_id INT,
        FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating teams table:', err);
        else console.log('Teams table ready');
    });

    // Create user_matches table for storing matches from swiping
    db.query(`
    CREATE TABLE IF NOT EXISTS user_matches (
        user_id INT,
        matched_user_id INT,
        match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, matched_user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating user_matches table:', err);
        else console.log('User matches table ready');
    });

    // Create projects table
    db.query(`
    CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        technologies VARCHAR(255),
        repository_url VARCHAR(255),
        creator_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    )`, (err) => {
        if (err) console.error('Error creating projects table:', err);
        else console.log('Projects table ready');
        
        // Add initial projects
        initProjects();
    });
    
    // Create project_collaborators table
    db.query(`
    CREATE TABLE IF NOT EXISTS project_collaborators (
        project_id INT,
        user_id INT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating project_collaborators table:', err);
        else console.log('Project collaborators table ready');
    });
}

// Add initial skills
function initSkills() {
    const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'UI/UX Design'];
    
    skills.forEach(skill => {
        db.query('INSERT IGNORE INTO skills (name) VALUES (?)', [skill], (err) => {
            if (err) console.error('Error inserting skill:', err);
        });
    });
}

// Add initial users - updated to remove password field
function initUsers() {
    const users = [
        { username: 'john_dev', email: 'john@example.com' },
        { username: 'jane_coder', email: 'jane@example.com' },
        { username: 'alex_hacker', email: 'alex@example.com' }
    ];
    
    users.forEach(user => {
        db.query(
            'INSERT IGNORE INTO users (username, email) VALUES (?, ?)',
            [user.username, user.email],
            (err) => {
                if (err && err.code !== 'ER_DUP_ENTRY') {
                    console.error('Error inserting user:', err);
                }
            }
        );
    });
}

// Add initial user skills
function initUserSkills() {
    // For demo: User 1 has skills 1,2,3; User 2 has skills 2,3,4; User 3 has skills 1,3,5
    const userSkills = [
        { user_id: 1, skill_id: 1 },
        { user_id: 1, skill_id: 2 },
        { user_id: 1, skill_id: 3 },
        { user_id: 2, skill_id: 2 },
        { user_id: 2, skill_id: 3 },
        { user_id: 2, skill_id: 4 },
        { user_id: 3, skill_id: 1 },
        { user_id: 3, skill_id: 3 },
        { user_id: 3, skill_id: 5 }
    ];
    
    userSkills.forEach(item => {
        db.query(
            'INSERT IGNORE INTO user_skills (user_id, skill_id) VALUES (?, ?)',
            [item.user_id, item.skill_id],
            (err) => {
                if (err && err.code !== 'ER_DUP_ENTRY') {
                    console.error('Error inserting user skill:', err);
                }
            }
        );
    });
}

// Initialize sample hackathons
function initHackathons() {
    const hackathons = [
        {
            name: 'TechCrunch Disrupt',
            description: 'A premier hackathon event focused on emerging technologies.',
            tags: 'tech,startup,innovation',
            start_date: '2023-09-15',
            end_date: '2023-09-17',
            location: 'San Francisco, CA'
        },
        {
            name: 'HackMIT',
            description: 'MIT\'s annual hackathon for students around the world.',
            tags: 'education,student,programming',
            start_date: '2023-10-05',
            end_date: '2023-10-07',
            location: 'Cambridge, MA'
        },
        {
            name: 'Global AI Hackathon',
            description: 'Competition focused on artificial intelligence and machine learning projects.',
            tags: 'ai,ml,data-science',
            start_date: '2023-11-10',
            end_date: '2023-11-12',
            location: 'Online'
        }
    ];
    
    // Check hackathons count before inserting
    db.query('SELECT COUNT(*) AS count FROM hackathons', (err, results) => {
        if (err) {
            console.error('Error checking hackathons:', err);
            return;
        }
        
        if (results[0].count === 0) {
            // Insert hackathons one by one to handle potential tag column issues
            hackathons.forEach(hackathon => {
                try {
                    const query = 'INSERT INTO hackathons (name, description, start_date, end_date, location, tags) VALUES (?, ?, ?, ?, ?, ?)';
                    db.query(
                        query,
                        [hackathon.name, hackathon.description, hackathon.start_date, hackathon.end_date, hackathon.location, hackathon.tags],
                        (err) => {
                            if (err) {
                                if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('tags')) {
                                    // If the error is about tags column, try inserting without tags
                                    console.warn('Inserting hackathon without tags due to missing column:', hackathon.name);
                                    db.query(
                                        'INSERT INTO hackathons (name, description, start_date, end_date, location) VALUES (?, ?, ?, ?, ?)',
                                        [hackathon.name, hackathon.description, hackathon.start_date, hackathon.end_date, hackathon.location],
                                        (err) => {
                                            if (err) {
                                                console.error('Error inserting hackathon without tags:', err);
                                            }
                                        }
                                    );
                                } else {
                                    console.error('Error inserting hackathon:', err);
                                }
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error processing hackathon insert:', error);
                }
            });
            console.log('Sample hackathons added');
        } else {
            console.log('Hackathons already exist, skipping insertion');
        }
    });
}

// Add initial projects
function initProjects() {
    const projects = [
        {
            name: 'Task Management API',
            description: 'A RESTful API for task management built with Express and MongoDB.',
            technologies: 'nodejs,express,mongodb,rest-api',
            repository_url: 'https://github.com/example/task-api',
            creator_id: 1
        },
        {
            name: 'Weather Dashboard',
            description: 'A web application that shows weather forecasts using the OpenWeatherMap API.',
            technologies: 'javascript,react,css,api-integration',
            repository_url: 'https://github.com/example/weather-dashboard',
            creator_id: 2
        }
    ];
    
    projects.forEach(project => {
        db.query(
            'INSERT IGNORE INTO projects (name, description, technologies, repository_url, creator_id) VALUES (?, ?, ?, ?, ?)',
            [project.name, project.description, project.technologies, project.repository_url, project.creator_id],
            (err) => {
                if (err) console.error('Error inserting project:', err);
            }
        );
    });
}

// Helper function to format date for MySQL
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Basic test route with API documentation
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to CodeMatch API',
        version: '1.0.0',
        endpoints: {
            users: {
                register: 'POST /api/users/register',
                login: 'POST /api/users/login',
                listAll: 'GET /api/users'
            },
            skills: {
                listAll: 'GET /api/skills',
                addToUser: 'POST /api/user-skills',
                getUserSkills: 'GET /api/user-skills/:userId'
            },
            hackathons: {
                create: 'POST /api/hackathons',
                listAll: 'GET /api/hackathons',
                getById: 'GET /api/hackathons/:id',
                getTeams: 'GET /api/hackathons/:hackathonId/teams'
            },
            teams: {
                create: 'POST /api/teams',
                getMembers: 'GET /api/teams/:teamId/members',
                addMember: 'POST /api/teams/:teamId/members'
            },
            matches: {
                findMatches: 'GET /api/matches/:userId',
                addMatch: 'POST /api/matches/swipe',
                getUserMatches: 'GET /api/user-matches/:userId'
            },
            projects: {
                create: 'POST /api/projects',
                listAll: 'GET /api/projects',
                getById: 'GET /api/projects/:id',
                getByUser: 'GET /api/users/:userId/projects',
                addCollaborator: 'POST /api/projects/:projectId/collaborators',
                getCollaborators: 'GET /api/projects/:projectId/collaborators',
                removeCollaborator: 'DELETE /api/projects/:projectId/collaborators/:userId'
            }
        }
    });
});

// ======= USER ENDPOINTS ========

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          
          const userId = result.insertId;
          
          // Generate JWT token
          const token = jwt.sign(
            { id: userId, username, email },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          res.status(201).json({ 
            message: 'User registered successfully',
            user: { id: userId, username, email },
            token
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const user = results[0];
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        message: 'Login successful',
        user: { id: user.id, username: user.username, email: user.email },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Update user profile
app.put('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const { name, username, title, bio, location, profileImage } = req.body;
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: 'Valid user ID is required' });
  }
  
  // Check if username exists (if changing username)
  if (username) {
    db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      
      // Proceed with update
      performUserUpdate();
    });
  } else {
    // If not changing username, proceed directly
    performUserUpdate();
  }
  
  function performUserUpdate() {
    // Check if user exists
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'User cannot be found' });
      }
      
      // Build query dynamically based on what fields were provided
      const updates = [];
      const values = [];
      
      if (username) {
        updates.push('username = ?');
        values.push(username);
      }
      
      // Add name field if it doesn't exist yet
      db.query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'name'`, (err, results) => {
        if (err) {
          console.error('Error checking for name column:', err);
        } else if (results.length === 0) {
          // Add name column if it doesn't exist
          db.query(`ALTER TABLE users ADD COLUMN name VARCHAR(100)`, (err) => {
            if (err) {
              console.error('Error adding name column:', err);
            } else {
              console.log('Added name column to users table');
            }
          });
        }
        
        // Continue with other fields
        if (name) {
          updates.push('name = ?');
          values.push(name);
        }
        
        // Check and add title field if needed
        db.query(`
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'title'`, (err, results) => {
          if (err) {
            console.error('Error checking for title column:', err);
          } else if (results.length === 0) {
            db.query(`ALTER TABLE users ADD COLUMN title VARCHAR(100)`, (err) => {
              if (err) {
                console.error('Error adding title column:', err);
              } else {
                console.log('Added title column to users table');
              }
            });
          }
          
          if (title) {
            updates.push('title = ?');
            values.push(title);
          }
          
          // Check and add bio field if needed
          db.query(`
          SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'bio'`, (err, results) => {
            if (err) {
              console.error('Error checking for bio column:', err);
            } else if (results.length === 0) {
              db.query(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
                if (err) {
                  console.error('Error adding bio column:', err);
                } else {
                  console.log('Added bio column to users table');
                }
              });
            }
            
            if (bio) {
              updates.push('bio = ?');
              values.push(bio);
            }
            
            // Check and add location field if needed
            db.query(`
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'location'`, (err, results) => {
              if (err) {
                console.error('Error checking for location column:', err);
              } else if (results.length === 0) {
                db.query(`ALTER TABLE users ADD COLUMN location VARCHAR(100)`, (err) => {
                  if (err) {
                    console.error('Error adding location column:', err);
                  } else {
                    console.log('Added location column to users table');
                  }
                });
              }
              
              if (location) {
                updates.push('location = ?');
                values.push(location);
              }
              
              // Check and add profile_image field if needed
              db.query(`
              SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image'`, (err, results) => {
                if (err) {
                  console.error('Error checking for profile_image column:', err);
                } else if (results.length === 0) {
                  db.query(`ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)`, (err) => {
                    if (err) {
                      console.error('Error adding profile_image column:', err);
                    } else {
                      console.log('Added profile_image column to users table');
                    }
                  });
                }
                
                if (profileImage) {
                  updates.push('profile_image = ?');
                  values.push(profileImage);
                }
                
                // If no updates, return success without querying
                if (updates.length === 0) {
                  return res.json({ message: 'No updates provided' });
                }
                
                // Perform the update
                const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
                values.push(userId);
                
                db.query(query, values, (err, result) => {
                  if (err) return res.status(500).json({ error: err.message });
                  
                  // Return the updated user
                  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, users) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // Don't send the password
                    const updatedUser = users[0];
                    delete updatedUser.password;
                    
                    res.json({
                      message: 'User updated successfully',
                      user: updatedUser
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
});

// General purpose database update endpoint
app.post('/api/db/update', (req, res) => {
  const { table, id, updates } = req.body;
  
  // Validate input
  if (!table || !id || !updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Valid table name, ID, and updates object are required' });
  }
  
  // Only allow specific tables for security
  const allowedTables = ['users', 'projects', 'hackathons'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Operation not allowed on this table' });
  }
  
  // Create update query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No update fields provided' });
  }
  
  // Build SET clause
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  // Full query
  const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  
  // Final values array with ID at the end
  values.push(id);
  
  // Execute update
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Record not found in ${table}` });
    }
    
    // Return updated record
    db.query(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Don't send password field if it's a user
      if (table === 'users' && results[0]) {
        delete results[0].password;
      }
      
      res.json({
        message: 'Record updated successfully',
        record: results[0] || null
      });
    });
  });
});

// ======= SKILLS ENDPOINTS ========

// Get all skills
app.get('/api/skills', (req, res) => {
    db.query('SELECT * FROM skills', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add skill to user
app.post('/api/user-skills', (req, res) => {
    const { userId, skillId } = req.body;
    
    db.query(
        'INSERT IGNORE INTO user_skills (user_id, skill_id) VALUES (?, ?)',
        [userId, skillId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true });
        }
    );
});

// Get user skills
app.get('/api/user-skills/:userId', (req, res) => {
    const userId = req.params.userId;
    
    db.query(
        'SELECT s.id, s.name FROM skills s JOIN user_skills us ON s.id = us.skill_id WHERE us.user_id = ?',
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Remove a skill from user
app.delete('/api/user-skills/:userId/:skillId', (req, res) => {
  const { userId, skillId } = req.params;
  
  if (!userId || !skillId) {
    return res.status(400).json({ error: 'User ID and skill ID are required' });
  }
  
  db.query(
    'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
    [userId, skillId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User skill not found' });
      }
      
      res.json({ message: 'Skill removed successfully' });
    }
  );
});

// ======= HACKATHON ENDPOINTS ========

// Create hackathon
app.post('/api/hackathons', (req, res) => {
    const { name, description, startDate, endDate, location, tags } = req.body;
    
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }
    
    const query = `
        INSERT INTO hackathons (name, description, start_date, end_date, location, tags) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [name, description, startDate, endDate, location, tags], (err, result) => {
        if (err) {
            console.error('Error creating hackathon:', err);
            return res.status(500).json({ error: 'Failed to create hackathon' });
        }
        
        const hackathonId = result.insertId;
        res.status(201).json({ 
            id: hackathonId,
            name,
            description,
            startDate,
            endDate,
            location,
            tags
        });
    });
});

// Get all hackathons
app.get('/api/hackathons', (req, res) => {
    db.query('SELECT * FROM hackathons ORDER BY start_date', (err, results) => {
        if (err) {
            console.error('Error fetching hackathons:', err);
            return res.status(500).json({ error: 'Failed to fetch hackathons' });
        }
        res.json(results);
    });
});

// Get a single hackathon by ID
app.get('/api/hackathons/:id', (req, res) => {
    db.query(
        'SELECT * FROM hackathons WHERE id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Hackathon not found' });
            }
            
            res.json(results[0]);
        }
    );
});

// Update a hackathon
app.put('/api/hackathons/:id', (req, res) => {
    const { name, description, tags, startDate, endDate, location } = req.body;
    const hackathonId = req.params.id;
    
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'Name, start date, and end date are required' });
    }
    
    // Check if hackathon exists
    db.query('SELECT * FROM hackathons WHERE id = ?', [hackathonId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }
        
        // Update the hackathon
        db.query(
            'UPDATE hackathons SET name = ?, description = ?, tags = ?, start_date = ?, end_date = ?, location = ? WHERE id = ?',
            [name, description || '', tags || '', startDate, endDate, location || 'Online', hackathonId],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Return the updated hackathon
                db.query(
                    'SELECT * FROM hackathons WHERE id = ?',
                    [hackathonId],
                    (err, hackathons) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json(hackathons[0]);
                    }
                );
            }
        );
    });
});

// Delete a hackathon
app.delete('/api/hackathons/:id', (req, res) => {
    const hackathonId = req.params.id;
    
    // Check if hackathon exists
    db.query('SELECT * FROM hackathons WHERE id = ?', [hackathonId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }
        
        // Delete the hackathon
        db.query('DELETE FROM hackathons WHERE id = ?', [hackathonId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Hackathon deleted successfully' });
        });
    });
});

// Register user for a hackathon
app.post('/api/hackathons/:hackathonId/register', (req, res) => {
    const { hackathonId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    // First check if the hackathon exists
    db.query('SELECT * FROM hackathons WHERE id = ?', [hackathonId], (err, results) => {
        if (err) {
            console.error('Error checking hackathon:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Hackathon not found' });
        }
        
        // Then check if the user is already registered
        db.query(
            'SELECT * FROM hackathon_registrations WHERE hackathon_id = ? AND user_id = ?',
            [hackathonId, userId],
            (err, registrations) => {
                if (err) {
                    console.error('Error checking registration:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (registrations.length > 0) {
                    return res.status(400).json({ error: 'User already registered for this hackathon' });
                }
                
                // Register the user
                db.query(
                    'INSERT INTO hackathon_registrations (hackathon_id, user_id) VALUES (?, ?)',
                    [hackathonId, userId],
                    (err, result) => {
                        if (err) {
                            console.error('Error registering for hackathon:', err);
                            return res.status(500).json({ error: 'Failed to register for hackathon' });
                        }
                        
                        res.status(201).json({ message: 'Successfully registered for hackathon' });
                    }
                );
            }
        );
    });
});

// Check if a user is registered for a hackathon
app.get('/api/hackathons/:hackathonId/registration/:userId', (req, res) => {
    const { hackathonId, userId } = req.params;
    
    db.query(
        'SELECT * FROM hackathon_registrations WHERE hackathon_id = ? AND user_id = ?',
        [hackathonId, userId],
        (err, results) => {
            if (err) {
                console.error('Error checking registration:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            const isRegistered = results.length > 0;
            res.json({ isRegistered });
        }
    );
});

// Get all registered users for a hackathon
app.get('/api/hackathons/:hackathonId/registrations', (req, res) => {
    const { hackathonId } = req.params;
    
    db.query(
        `SELECT u.id, u.username, u.email, u.profile_image 
         FROM hackathon_registrations hr
         JOIN users u ON hr.user_id = u.id
         WHERE hr.hackathon_id = ?`,
        [hackathonId],
        (err, results) => {
            if (err) {
                console.error('Error fetching registered users:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json(results);
        }
    );
});

// Cancel registration
app.delete('/api/hackathons/:hackathonId/registration/:userId', (req, res) => {
    const { hackathonId, userId } = req.params;
    
    db.query(
        'DELETE FROM hackathon_registrations WHERE hackathon_id = ? AND user_id = ?',
        [hackathonId, userId],
        (err, result) => {
            if (err) {
                console.error('Error canceling registration:', err);
                return res.status(500).json({ error: 'Failed to cancel registration' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Registration not found' });
            }
            
            res.json({ message: 'Registration canceled successfully' });
        }
    );
});

// ======= TEAM ENDPOINTS ========

// Create team
app.post('/api/teams', (req, res) => {
    const { name, hackathonId, userId } = req.body;
    
    // First create team, then add creator as member
    db.query(
        'INSERT INTO teams (name, hackathon_id) VALUES (?, ?)',
        [name, hackathonId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const teamId = result.insertId;
            
            // Add creator as team member
            db.query(
                'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
                [teamId, userId],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ id: teamId });
                }
            );
        }
    );
});

// Get teams for a hackathon
app.get('/api/hackathons/:hackathonId/teams', (req, res) => {
    db.query(
        'SELECT * FROM teams WHERE hackathon_id = ?',
        [req.params.hackathonId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Get team members
app.get('/api/teams/:teamId/members', (req, res) => {
    db.query(
        'SELECT u.* FROM users u JOIN team_members tm ON u.id = tm.user_id WHERE tm.team_id = ?',
        [req.params.teamId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Add member to team
app.post('/api/teams/:teamId/members', (req, res) => {
    db.query(
        'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
        [req.params.teamId, req.body.userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true });
        }
    );
});

// ======= MATCHING ENDPOINTS ========

// Add match when user swipes right
app.post('/api/matches/swipe', (req, res) => {
    const { userId, matchedUserId } = req.body;
    
    if (!userId || !matchedUserId) {
        return res.status(400).json({ error: 'User ID and matched user ID are required' });
    }
    
    // Check if IDs are valid
    if (isNaN(userId) || isNaN(matchedUserId)) {
        return res.status(400).json({ error: 'User IDs must be valid numbers' });
    }
    
    // Check if users exist
    db.query('SELECT id FROM users WHERE id IN (?, ?)', [userId, matchedUserId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length < 2) {
            return res.status(404).json({ error: 'One or both users not found' });
        }
        
        // Insert match
        db.query(
            'INSERT INTO user_matches (user_id, matched_user_id) VALUES (?, ?)',
            [userId, matchedUserId],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Match already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                res.status(201).json({ 
                    success: true, 
                    message: 'Match added successfully',
                    matchId: result.insertId
                });
            }
        );
    });
});

// Get user's matches from swiping
app.get('/api/user-matches/:userId', (req, res) => {
    const userId = req.params.userId;
    
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
    }
    
    // Check if user exists
    db.query('SELECT id FROM users WHERE id = ?', [userId], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get users that the current user has matched with
        const query = `
        SELECT 
            u.id, 
            u.username,
            u.email,
            m.match_date,
            GROUP_CONCAT(DISTINCT s.name ORDER BY s.name ASC SEPARATOR ', ') as skills
        FROM 
            user_matches m
        JOIN 
            users u ON m.matched_user_id = u.id
        LEFT JOIN
            user_skills us ON u.id = us.user_id
        LEFT JOIN
            skills s ON us.skill_id = s.id
        WHERE 
            m.user_id = ?
        GROUP BY
            u.id
        ORDER BY 
            m.match_date DESC`;
        
        db.query(query, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Add profile image URLs
            const resultsWithImages = results.map(user => ({
                ...user,
                profile_image: `https://randomuser.me/api/portraits/${user.id % 2 === 0 ? 'women' : 'men'}/${user.id + 20}.jpg`
            }));
            
            res.json(resultsWithImages);
        });
    });
});

// Find matches based on common skills
app.get('/api/matches/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Validate userId
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
    }
    
    // Check if user exists
    db.query('SELECT id FROM users WHERE id = ?', [userId], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Query to find users with common skills
        const query = `
        SELECT 
            u.id as user2_id, 
            u.username as user2_name,
            u.email as user2_email,
            COUNT(DISTINCT us2.skill_id) as common_skills,
            GROUP_CONCAT(DISTINCT s.name ORDER BY s.name ASC SEPARATOR ', ') as shared_skills
        FROM 
            users u
        JOIN 
            user_skills us2 ON u.id = us2.user_id
        JOIN 
            user_skills us1 ON us1.skill_id = us2.skill_id
        JOIN
            skills s ON s.id = us2.skill_id
        WHERE 
            us1.user_id = ? 
            AND u.id != ?
        GROUP BY 
            u.id
        ORDER BY 
            common_skills DESC`;
        
        db.query(query, [userId, userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Add profile image URLs
            const resultsWithImages = results.map(user => ({
                ...user,
                profile_image: `https://randomuser.me/api/portraits/${user.user2_id % 2 === 0 ? 'women' : 'men'}/${user.user2_id + 20}.jpg`
            }));
            
            // If no matches with common skills found, get all users
            if (results.length === 0) {
                db.query(
                    'SELECT id as user2_id, username as user2_name, email as user2_email, 0 as common_skills, "" as shared_skills FROM users WHERE id != ?',
                    [userId],
                    (err, allUsers) => {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        // Add profile image URLs
                        const usersWithImages = allUsers.map(user => ({
                            ...user,
                            profile_image: `https://randomuser.me/api/portraits/${user.user2_id % 2 === 0 ? 'women' : 'men'}/${user.user2_id + 20}.jpg`
                        }));
                        
                        res.json(usersWithImages);
                    }
                );
            } else {
                res.json(resultsWithImages);
            }
        });
    });
});

// ======= PROJECT ENDPOINTS ========

// Create new project
app.post('/api/projects', (req, res) => {
    const { name, description, technologies, repositoryUrl, creatorId } = req.body;
    
    if (!name || !creatorId) {
        return res.status(400).json({ error: 'Project name and creator ID are required' });
    }
    
    // Check if creator exists
    db.query('SELECT id FROM users WHERE id = ?', [creatorId], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Creator not found. Please provide a valid user ID.' });
        }
        
        // Proceed with creating the project
        db.query(
            'INSERT INTO projects (name, description, technologies, repository_url, creator_id) VALUES (?, ?, ?, ?, ?)',
            [name, description || '', technologies || '', repositoryUrl || '', creatorId],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const projectId = result.insertId;
                
                // Add creator as first collaborator
                db.query(
                    'INSERT INTO project_collaborators (project_id, user_id) VALUES (?, ?)',
                    [projectId, creatorId],
                    (err) => {
                        if (err) console.error('Error adding creator as collaborator:', err);
                    }
                );
                
                // Return the newly created project with its ID
                db.query(
                    'SELECT p.*, u.username as creator_name FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
                    [projectId],
                    (err, projects) => {
                        if (err) return res.status(500).json({ error: err.message });
                        if (projects.length === 0) {
                            return res.status(500).json({ error: 'Project was created but could not be retrieved' });
                        }
                        res.status(201).json(projects[0]);
                    }
                );
            }
        );
    });
});

// Get all projects
app.get('/api/projects', (req, res) => {
    db.query(
        'SELECT p.*, u.username as creator_name FROM projects p JOIN users u ON p.creator_id = u.id ORDER BY p.created_at DESC',
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Get project by ID
app.get('/api/projects/:id', (req, res) => {
    db.query(
        'SELECT p.*, u.username as creator_name FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (results.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }
            
            res.json(results[0]);
        }
    );
});

// Get projects by user
app.get('/api/users/:userId/projects', (req, res) => {
    db.query(
        'SELECT p.*, u.username as creator_name FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.creator_id = ?',
        [req.params.userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Update project
app.put('/api/projects/:id', (req, res) => {
    const { name, description, technologies, repositoryUrl } = req.body;
    const projectId = req.params.id;
    
    if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Check if project exists
    db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Update the project
        db.query(
            'UPDATE projects SET name = ?, description = ?, technologies = ?, repository_url = ? WHERE id = ?',
            [name, description || '', technologies || '', repositoryUrl || '', projectId],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Return the updated project
                db.query(
                    'SELECT p.*, u.username as creator_name FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.id = ?',
                    [projectId],
                    (err, projects) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json(projects[0]);
                    }
                );
            }
        );
    });
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    
    // Check if project exists
    db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Delete the project
        db.query('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Project deleted successfully' });
        });
    });
});

// Add collaborator to project
app.post('/api/projects/:projectId/collaborators', (req, res) => {
    const projectId = req.params.projectId;
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if project exists
    db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, projects) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Check if user exists
        db.query('SELECT * FROM users WHERE id = ?', [userId], (err, users) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Add collaborator
            db.query(
                'INSERT INTO project_collaborators (project_id, user_id) VALUES (?, ?)',
                [projectId, userId],
                (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ error: 'User is already a collaborator on this project' });
                        }
                        return res.status(500).json({ error: err.message });
                    }
                    
                    res.status(201).json({ 
                        success: true, 
                        message: 'Collaborator added successfully'
                    });
                }
            );
        });
    });
});

// Get project collaborators
app.get('/api/projects/:projectId/collaborators', (req, res) => {
    const projectId = req.params.projectId;
    
    // Check if project exists
    db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, projects) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Get collaborators with joined date
        db.query(
            `SELECT u.id, u.username, u.email, pc.joined_at 
             FROM project_collaborators pc 
             JOIN users u ON pc.user_id = u.id 
             WHERE pc.project_id = ?
             ORDER BY pc.joined_at ASC`,
            [projectId],
            (err, collaborators) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // Add a flag for the creator
                const project = projects[0];
                const collaboratorsWithRole = collaborators.map(collab => ({
                    ...collab,
                    isCreator: collab.id === project.creator_id
                }));
                
                res.json(collaboratorsWithRole);
            }
        );
    });
});

// Remove collaborator from project
app.delete('/api/projects/:projectId/collaborators/:userId', (req, res) => {
    const { projectId, userId } = req.params;
    
    // Check if projectId and userId are valid
    if (!projectId || !userId) {
        return res.status(400).json({ error: 'Project ID and User ID are required' });
    }
    
    // Check if user is the creator (can't remove the creator)
    db.query('SELECT creator_id FROM projects WHERE id = ?', [projectId], (err, projects) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        if (projects[0].creator_id == userId) {
            return res.status(400).json({ error: 'Cannot remove the project creator' });
        }
        
        // Remove collaborator
        db.query(
            'DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?',
            [projectId, userId],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Collaborator not found for this project' });
                }
                
                res.json({ message: 'Collaborator removedsuccessfully' });
            }
        );
    });
});

// Protected route example
app.get('/api/user', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Apply authentication middleware to protected routes
app.use('/api/projects', authenticateToken);
app.use('/api/hackathons', authenticateToken);
app.use('/api/teams', authenticateToken);
app.use('/api/matches', authenticateToken);
app.use('/api/user-matches', authenticateToken);
app.use('/api/user-skills', authenticateToken);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
 