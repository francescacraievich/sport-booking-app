# Sport Booking App

Project for the Web Application Programming course, UniTS 2025/26.  
Web application to book sports fields and manage amateur tournaments.

## Stack

- **Frontend**: React 18 + React Router (Create React App)
- **Backend**: Node.js + Express, REST API with JWT authentication
- **Database**: MongoDB 7
- **Containerization**: Docker Compose

## How to run

```bash
docker compose up --build
```

The app will be available at **<http://localhost:3001>**

On subsequent runs (no code changes):

```bash
docker compose up
```

To stop:

```bash
docker compose down
```

## Seed data

To populate the database with sample users, fields, tournaments and players, run the seed script inside the running backend container:

```bash
docker exec sport_backend_Craievich npm run seed
```

Default accounts after seeding:

| Username  | Password |
| --------- | -------- |
| francesca | 123      |
| marco     | 123      |

## Features

- **Authentication** — register and log in with username and password
- **Fields** — view available sports fields and book time slots
- **Tournaments** — create and manage tournaments with teams, players, a round-robin match schedule and live standings
- **Search** — search teams, players and users

## Project structure

```text
sport-booking-app/
├── backend/
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express routes
│   ├── seed/          # Database seed script
│   ├── Dockerfile     # builds frontend + starts backend
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/     # one component per route
│       ├── api.js     # API calls
│       └── App.js
└── docker-compose.yml
```

## Author

Francesca Craievich
