-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sports fields
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sport_type VARCHAR(50) NOT NULL CHECK (sport_type IN ('football', 'volleyball', 'basketball')),
    address VARCHAR(500) NOT NULL
);

-- Time slots for fields
CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slot_id, date)
);

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sport VARCHAR(50) NOT NULL CHECK (sport IN ('football', 'volleyball', 'basketball')),
    max_teams INTEGER NOT NULL,
    start_date DATE NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    UNIQUE(name, tournament_id)
);

-- Players
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
    UNIQUE (team_id, jersey_number)
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team1_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team2_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    field_id INTEGER REFERENCES fields(id),
    score1 INTEGER CHECK (score1 >= 0),
    score2 INTEGER CHECK (score2 >= 0),
    CHECK (team1_id <> team2_id)
);

-- Seed some sample fields with slots
INSERT INTO fields (name, sport_type, address) VALUES
    ('Campo Calcio San Giovanni', 'football', 'Via Roma 15, Trieste'),
    ('Palestra Centrale Volley', 'volleyball', 'Piazza Unità 3, Trieste'),
    ('Playground Basket City', 'basketball', 'Via Mazzini 42, Trieste'),
    ('Stadio Nereo Rocco - Campo B', 'football', 'Viale del Tramonto 8, Trieste'),
    ('Palazzetto dello Sport', 'basketball', 'Via dello Sport 1, Trieste');

-- Slots for each field (1-hour slots from 9:00 to 21:00)
DO $$
DECLARE
    f RECORD;
    h INTEGER;
BEGIN
    FOR f IN SELECT id FROM fields LOOP
        FOR h IN 9..20 LOOP
            INSERT INTO slots (field_id, start_time, end_time)
            VALUES (f.id, make_time(h, 0, 0), make_time(h + 1, 0, 0));
        END LOOP;
    END LOOP;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_date  ON bookings(slot_id, date);
CREATE INDEX IF NOT EXISTS idx_teams_tournament    ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_team        ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament  ON matches(tournament_id);
