# CodeMatch 🤝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Connect, Collaborate, and Code Together

CodeMatch is a modern web-based platform designed to connect developers for collaboration on projects and hackathons. Using an intuitive Tinder-like swiping interface, developers can discover and match with compatible teammates based on technical skills, project interests, and experience levels.

## ✨ Features

### Core Functionality
- **Smart Matching Algorithm**: Find developers with complementary skills and shared interests
- **Swipe Interface**: Intuitive right-swipe to connect, left-swipe to pass
- **Real-time Matches**: Instant notifications when you match with another developer
- **Profile Management**: Showcase your skills, projects, and social links

### Collaboration Tools
- **Project Board**: Browse and join open-source projects looking for contributors
- **Hackathon Directory**: Discover upcoming hackathons and find team members
- **Team Formation**: Create or join teams for hackathon participation
- **Skill Filtering**: Match based on programming languages, frameworks, and technologies

### User Features
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Customizable Profiles**: Add bio, profile image, GitHub, LinkedIn, and personal website links
- **Skill Tags**: Add and manage your technical skills
- **Match History**: View your connection history and shared skills

## 🛠️ Tech Stack

### Frontend
- **React** - UI library for building interactive interfaces
- **Vite** - Next-generation frontend tooling
- **React Router** - Client-side routing
- **CSS3** - Modern styling with custom components

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database for data persistence
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v5.7 or higher)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/CodeMatch.git
cd CodeMatch
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE codematch;
```

Update the database credentials in `backend/server.js`:
```javascript
const db = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'codematch',
    // ...
});
```

Update the JWT secret in `backend/server.js`:
```javascript
const JWT_SECRET = 'your_secure_secret_key';
```

### 3. Backend Setup

```bash
cd backend
npm install
node server.js
```

The backend server will start on `http://localhost:5000`

### 4. Frontend Setup

Open a new terminal window:
```bash
cd frontend/my-app
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/user` - Get authenticated user info (protected)

### User Endpoints
- `GET /api/users` - Get all users
- `PUT /api/users/:userId` - Update user profile

### Skills Endpoints
- `GET /api/skills` - Get all available skills
- `GET /api/user-skills/:userId` - Get user's skills
- `POST /api/user-skills` - Add skill to user
- `DELETE /api/user-skills/:userId/:skillId` - Remove skill from user

### Matching Endpoints
- `GET /api/matches/:userId` - Find potential matches
- `POST /api/matches/swipe` - Record a match (swipe right)
- `GET /api/user-matches/:userId` - Get user's matches

### Project Endpoints
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:projectId/collaborators` - Add collaborator
- `GET /api/projects/:projectId/collaborators` - Get project collaborators

### Hackathon Endpoints
- `GET /api/hackathons` - Get all hackathons
- `POST /api/hackathons` - Create a hackathon
- `GET /api/hackathons/:id` - Get hackathon by ID
- `PUT /api/hackathons/:id` - Update hackathon
- `DELETE /api/hackathons/:id` - Delete hackathon
- `POST /api/hackathons/:hackathonId/register` - Register for hackathon
- `GET /api/hackathons/:hackathonId/registration/:userId` - Check registration status

Visit `http://localhost:5000/` for the complete API documentation.

## 🗂️ Project Structure

```
CodeMatch/
├── backend/
│   ├── server.js           # Express server and API routes
│   └── package.json        # Backend dependencies
├── frontend/
│   └── my-app/
│       ├── src/
│       │   ├── components/     # Reusable React components
│       │   ├── pages/          # Page components
│       │   ├── context/        # React context providers
│       │   └── styles/         # CSS stylesheets
│       ├── index.html
│       └── package.json        # Frontend dependencies
└── README.md
```

## 🔒 Security

- All passwords are hashed using bcrypt before storage
- JWT tokens are used for stateless authentication
- Protected routes require valid authentication tokens
- SQL injection prevention through parameterized queries
- CORS enabled for cross-origin requests

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

Built with ❤️ by developers, for developers

## 🐛 Bug Reports & Feature Requests

If you find a bug or have a feature request, please open an issue on GitHub.

## 📧 Contact

For questions or support, please open an issue or reach out to the maintainers.

---

**Happy Coding! 🚀**
