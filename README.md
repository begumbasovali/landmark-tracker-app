# Landmark Tracker App

A web application for tracking landmarks, recording visits, and planning future trips. Built with Node.js, Express.js, MongoDB, and Leaflet.js.

## Features

- Interactive map interface for adding landmarks
- Categorize landmarks (historical, natural, cultural, etc.)
- Add notes and descriptions to landmarks
- Track visited landmarks
- Create future visit plans
- Responsive design for both desktop and mobile use

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd landmark-tracker-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://begumbasovali:DySeoZ3LNkAifNr9@cluster0.jndm6ic.mongodb.net/landmarkDB?retryWrites=true&w=majority
PORT=5000
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Click anywhere on the map to add a new landmark
2. Fill in the landmark details in the popup form
3. View your landmarks in the sidebar
4. Switch between different views:
   - All Landmarks
   - Visited Landmarks
   - Visit Plans

## API Endpoints

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
- Frontend:
  - HTML5
  - CSS3
  - JavaScript
  - Leaflet.js (for maps)
  - Bootstrap 5 