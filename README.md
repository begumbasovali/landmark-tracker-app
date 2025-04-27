# Landmark Tracker App

A web application for tracking landmarks, recording visits, and planning future trips. Built with Node.js, Express.js, MongoDB, and Leaflet.js.

## Features

- Interactive map interface for adding landmarks
- Categorize landmarks (historical, natural, cultural, etc.)
- Add notes and descriptions to landmarks
- Track visited landmarks
- Create future visit plans
- Responsive design for both desktop and mobile use

## Project Structure

```
landmark-tracker-app/
├── public/                 # Static files served to the client
│   ├── app.js              # Main application JavaScript
│   ├── auth.js             # Authentication JavaScript
│   ├── index.html          # Main application HTML
│   └── styles.css          # Application styles
├── middleware/             # Express middleware
│   └── auth.js             # Authentication middleware
├── models/                 # Database models
│   ├── Landmark.js         # Landmark data model
│   ├── User.js             # User data model
│   └── VisitedLandmark.js  # Visited landmark data model
├── routes/                 # API routes
│   ├── auth.js             # Authentication routes
│   ├── landmarks.js        # Landmark management routes
│   └── visited.js          # Visited landmarks routes
├── index.html              # Simple landmark creator HTML (legacy)
├── server.js               # Express server setup
├── package.json            # Project dependencies
├── projectlink.txt         # Project reference links
└── README.md               # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm (Node Package Manager)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd landmark-tracker-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure MongoDB

Create a `.env` file in the root directory with your MongoDB connection details:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
PORT=5000
```

Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your MongoDB Atlas credentials.

### 4. Project Structure Overview

This project follows a modular architecture:

- **Server**: The main Express.js server in `server.js` handles API requests and serves static files
- **Authentication**: JWT-based authentication is implemented in the middleware and routes
- **Database Models**: Mongoose models define the data structure
- **Frontend Interface**: The application has two interfaces:
  - `index.html` in the root directory: A simple standalone landmark creator
  - `public/index.html`: The fully featured application with authentication

The application is configured to serve the files from the `public` directory, so `public/index.html` will be your main interface when accessing the application.

### 5. Start the Server

For production:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

## Using the Application

1. Register or log in to your account
2. Use the interactive map to:

   - Click anywhere to add new landmarks
   - View your existing landmarks
   - Record visits to landmarks
   - Create future visit plans

3. Navigate through the tabs to:
   - Manage your landmarks collection
   - Track your visited landmarks
   - Organize your future visit plans

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user info

### Landmarks

- `GET /api/landmarks` - Get all landmarks
- `GET /api/landmarks/:id` - Get specific landmark
- `POST /api/landmarks` - Create new landmark
- `PUT /api/landmarks/:id` - Update landmark
- `DELETE /api/landmarks/:id` - Delete landmark

### Visited Landmarks

- `GET /api/visited` - Get all visited landmarks
- `GET /api/visited/:id` - Get specific visit record
- `POST /api/visited` - Record a new visit
- `PUT /api/visited/:id` - Update visit record
- `DELETE /api/visited/:id` - Delete visit record

## Technologies Used

- Backend:
  - Node.js
  - Express.js
  - MongoDB Atlas
  - Mongoose
  - JSON Web Tokens (JWT) for authentication
- Frontend:
  - HTML5
  - CSS3
  - JavaScript
  - Leaflet.js (for interactive maps)
  - Bootstrap 5 (for responsive UI)
  - Font Awesome (for icons)

## Troubleshooting

- If you encounter CORS issues, make sure the server is running and configured correctly
- If the map doesn't load, check your internet connection as it requires loading the Leaflet.js library
- If login fails, verify your MongoDB connection string in the `.env` file

## Development Notes

- This project was last updated on April 2025
- The application is designed to work on modern web browsers with JavaScript enabled
- For additional project references, check the projectlink.txt file
