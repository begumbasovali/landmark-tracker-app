![Ekran görüntüsü 2025-04-27 132347](https://github.com/user-attachments/assets/5a5cf30f-188b-4f6e-8d8e-26d26f07874d)
![Ekran görüntüsü 2025-04-27 133006](https://github.com/user-attachments/assets/dff9aec7-3bb8-4429-b854-853ce77180d3)
![Ekran görüntüsü 2025-04-27 133208](https://github.com/user-attachments/assets/83fc0f0f-cb42-432b-a439-7cc1b6885645)
![Ekran görüntüsü 2025-04-27 133459](https://github.com/user-attachments/assets/befc66e7-cb1c-43e2-a837-138505ef6ec8)
![Ekran görüntüsü 2025-04-27 133533](https://github.com/user-attachments/assets/861a0b14-ab76-47bc-baaf-629407ee0e44)
![Ekran görüntüsü 2025-04-27 133727](https://github.com/user-attachments/assets/79517d68-ae57-41e2-bf6e-2a0bb4fbe2ab)
![Ekran görüntüsü 2025-04-27 134123](https://github.com/user-attachments/assets/e4d08e68-ba79-4116-9af4-27885b564eb3)
![Ekran görüntüsü 2025-04-27 134234](https://github.com/user-attachments/assets/9070a3ca-d303-4b5a-8322-94ff8f6ea645)

# Landmark Tracker App
A web application for tracking landmarks, recording visits, and planning future trips. Built with Node.js, Express.js, MongoDB, and Leaflet.js.

## Features

- Interactive map interface for adding landmarks
- Categorize landmarks (historical, natural, cultural, etc.)
- Add notes and descriptions to landmarks
- Track visited landmarks
- Create future visit plans
- User authentication and personalized content
- Responsive design for both desktop and mobile use

## Project Structure

```
landmark-tracker-app/
├── public/                 # Static files served to the client
│   ├── app.js              # Main application JavaScript
│   ├── auth.js             # Authentication JavaScript
│   ├── config.js           # Dynamic API configuration
│   ├── index.html          # Main application HTML
│   └── styles.css          # Application styles
├── middleware/             # Express middleware
│   └── auth.js             # Authentication middleware
├── models/                 # Database models
│   ├── Landmark.js         # Landmark data model
│   ├── Plan.js             # Plan data model
│   ├── User.js             # User data model
│   └── VisitedLandmark.js  # Visited landmark data model
├── routes/                 # API routes
│   ├── auth.js             # Authentication routes
│   ├── landmarks.js        # Landmark management routes
│   ├── plans.js            # Plan management routes
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
JWT_SECRET=your_jwt_secret_key
```

Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your MongoDB Atlas credentials.

### 4. Project Structure Overview

This project follows a modular architecture:

- **Server**: The main Express.js server in `server.js` handles API requests and serves static files
- **Authentication**: JWT-based authentication is implemented in the middleware and routes
- **Database Models**: Mongoose models define the data structure
- **Dynamic API**: The `config.js` file automatically detects the environment and configures API URLs accordingly
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

## Deployment

The application is designed to be easily deployed to any hosting service:

1. **Local Development**: When running locally, the app uses `http://localhost:5000/api` for API calls
2. **Production**: When deployed, the app automatically uses the server's domain for API calls

To deploy the application:

1. Push your code to your hosting provider (Heroku, Vercel, Netlify, etc.)
2. Make sure your hosting provider supports Node.js
3. Set your environment variables (MongoDB URI, JWT_SECRET, etc.)
4. The application will automatically detect the environment and use the appropriate API URLs

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

## User-Specific Content

Each user can only view and manage their own content:

- Landmarks created by the user
- Visits recorded by the user
- Plans created by the user

This ensures privacy and a personalized experience for each user.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user info

### Landmarks

- `GET /api/landmarks` - Get all landmarks for the authenticated user
- `GET /api/landmarks/:id` - Get specific landmark
- `POST /api/landmarks` - Create new landmark
- `PUT /api/landmarks/:id` - Update landmark
- `DELETE /api/landmarks/:id` - Delete landmark

### Visited Landmarks

- `GET /api/visited` - Get all visited landmarks for the authenticated user
- `GET /api/visited/:id` - Get specific visit record
- `POST /api/visited` - Record a new visit
- `PUT /api/visited/:id` - Update visit record
- `DELETE /api/visited/:id` - Delete visit record

### Plans

- `GET /api/plans` - Get all plans for the authenticated user
- `GET /api/plans/:id` - Get specific plan
- `POST /api/plans` - Create new plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

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
- If API calls fail after deployment, check your server logs and verify that the Dynamic API configuration is working correctly
- If you don't see your content, make sure you're logged in with the correct account

## Development Notes

- This project was last updated on April 27, 2025
- The application is designed to work on modern web browsers with JavaScript enabled
- The app now uses dynamic API URLs for seamless deployment to any environment
- User-specific content filtering ensures privacy and data separation between users
- For additional project references, check the projectlink.txt file
