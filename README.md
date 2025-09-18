# Skill Snap

An educational gaming platform for teachers to create and host interactive games for students.

## Features

- **Multi-Role System**: Admin, Teacher, Student, Manager roles
- **Educational Games**: Interactive game creation and hosting
- **Real-time Communication**: Live game sessions with Socket.IO
- **School Management**: Comprehensive school and class administration
- **Document Management**: PDF upload and organization system
- **Gamification**: Badge system and progress tracking

## Tech Stack

- **Frontend**: React 19.1.1, Vite, Tailwind CSS
- **Backend**: Node.js, Express 5.1.0, MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Skill Snap
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In server directory
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development servers
```bash
# Start server (from server directory)
npm run start

# Start client (from client directory)
npm run dev
```

## Changelog

We maintain a changelog to track all notable changes to this project. The changelog is automatically updated using our changelog script.

### Adding Changes

Use the changelog script to add new entries:

```bash
node update-changelog.js <type> <title> <description>
```

**Types**: Fixed, Added, Changed, Removed, Security

**Examples**:
```bash
node update-changelog.js Fixed "Login Bug" "Fixed authentication issue with special characters"
node update-changelog.js Added "Dark Mode" "Added dark mode toggle feature"
node update-changelog.js Changed "API Response" "Updated response format for better consistency"
```

### Recent Changes

See [CHANGELOG.md](./CHANGELOG.md) for the complete list of changes.

## Project Structure

```
Skill Snap/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── context/       # React Context providers
│   │   └── assets/        # Static assets
│   └── game-bundles/      # Educational game templates
├── server/                # Node.js backend
│   ├── controllers/       # Business logic
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Authentication & validation
│   └── uploads/          # File storage
└── CHANGELOG.md          # Project changelog
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update the changelog using the script
5. Submit a pull request

## License

This project is licensed under the ISC License.
