# Sport Booking App

Project for the Web Application Programming course, UniTS 2025/26.  
Web application to book sports fields and manage amateur tournaments.

## Stack

- **Frontend**: React 18 + React Router, built with Vite and served by nginx
- **Backend**: Node.js + Express, REST API with JWT authentication (httpOnly cookie)
- **Database**: PostgreSQL 16
- **Containerization**: Docker Compose (3 containers)

The nginx container serves the React build and proxies `/api` requests to the backend — the browser always talks to a single origin, no CORS needed.

## How to run

Requires Docker. On Windows and Mac, Docker Desktop must be open before running any command.

```bash
docker compose up --build
```

The app will be available at **<http://localhost:8080>**

On subsequent runs (no code changes):

```bash
docker compose up
```

To stop:

```bash
docker compose down
```

## Database

On first startup, PostgreSQL automatically executes `db/init.sql`, which creates all the tables and seeds the 5 sports fields with hourly time slots (9:00–21:00). No other data is pre-loaded — users, tournaments and bookings are created through the app.

Data is stored in a Docker named volume (`pgdata`) and persists between restarts. To reset the database to its initial state:

```bash
docker compose down -v
docker compose up
```

## Project structure

```
sport-booking-app/
├── client/              # React SPA
│   ├── src/
│   │   ├── pages/       # one component per route
│   │   ├── components/  # Navbar, ProtectedRoute
│   │   └── context/     # AuthContext
│   ├── nginx.conf       # serves SPA + proxies /api to backend
│   └── Dockerfile       # multi-stage: Vite build → nginx
├── server/              # Node.js + Express
│   └── src/
│       ├── routes/      # one file per resource
│       ├── middleware/   # JWT auth, rate limiting
│       └── app.js
├── db/
│   └── init.sql         # schema + seed data
└── docker-compose.yml
```

## Author

Francesca Craievich
