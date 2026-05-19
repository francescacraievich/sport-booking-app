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

-- Demo users (password: "password" for all)
INSERT INTO users (username, password, name, surname) VALUES
    ('demo',  '$2b$10$eaz45QwTlezA14EdVGcyw.SDJePhNSWSZcREtOVQRFSzdOpItHDiG', 'Demo',  'User'),
    ('alice', '$2b$10$XB/LGSpwHdfV3lUWupI9KefYSBrbuC6mTyb/CJ4rEkDql1qCyYqJS', 'Alice', 'Bianchi'),
    ('bob',   '$2b$10$k9mqmsv1tOPUWau6wiYjQe.p5JbN.o/QH46P1bS7caK.DMGKsAq22', 'Bob',   'Rossi');

-- Tournaments
INSERT INTO tournaments (name, sport, max_teams, start_date, creator_id) VALUES
    ('Torneo Calcio Trieste',  'football',   4, '2025-09-01', 2),  -- alice, CONCLUSO
    ('Coppa Pallavolo UniTS',  'volleyball', 4, '2025-10-01', 3),  -- bob,   IN CORSO
    ('Winter Basketball Cup',  'basketball', 4, '2026-07-01', 1);  -- demo,  IN ARRIVO

-- Teams: football (tournament 1)
INSERT INTO teams (name, tournament_id) VALUES
    ('Aquile FC',           1),
    ('Leoni SC',            1),
    ('Triestina B',         1),
    ('Porto Vecchio United',1);

-- Teams: volleyball (tournament 2)
INSERT INTO teams (name, tournament_id) VALUES
    ('Falchi Volley', 2),
    ('Delfini',       2),
    ('Aquilotti',     2),
    ('Pionieri',      2);

-- Teams: basketball (tournament 3)
INSERT INTO teams (name, tournament_id) VALUES
    ('Bulls',    3),
    ('Lakers',   3),
    ('Warriors', 3),
    ('Celtics',  3);

-- Players: Aquile FC (team 1)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (1, 'Marco',  'Bianchi',  9),
    (1, 'Luca',   'Ferrari',  7),
    (1, 'Andrea', 'Russo',    1);

-- Players: Leoni SC (team 2)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (2, 'Paolo',  'Moretti', 10),
    (2, 'Simone', 'Costa',    5);

-- Players: Triestina B (team 3)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (3, 'Davide', 'Ricci',    11),
    (3, 'Giorgio','Esposito',  3);

-- Players: Porto Vecchio United (team 4)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (4, 'Antonio',  'Romano',   8),
    (4, 'Francesco','Colombo',  4);

-- Players: Falchi Volley (team 5)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (5, 'Sara',   'Mancini', 1),
    (5, 'Laura',  'Conti',   7),
    (5, 'Giulia', 'Romano',  4);

-- Players: Delfini (team 6)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (6, 'Chiara', 'Fontana',  3),
    (6, 'Marta',  'Barbieri', 9);

-- Players: Aquilotti (team 7)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (7, 'Elena', 'Greco', 4),
    (7, 'Sofia', 'Russo', 8);

-- Players: Pionieri (team 8)
INSERT INTO players (team_id, name, surname, jersey_number) VALUES
    (8, 'Federica',  'Martini', 6),
    (8, 'Valentina', 'Costa',   2);

-- Matches: football round-robin (all played → CONCLUSO)
-- Aquile 7pts, Leoni 4pts, Triestina 4pts, Porto 1pt
INSERT INTO matches (tournament_id, team1_id, team2_id, date, field_id, score1, score2) VALUES
    (1, 1, 2, '2025-09-08', 1, 3, 1),  -- Aquile 3-1 Leoni
    (1, 1, 3, '2025-09-15', 1, 2, 2),  -- Aquile 2-2 Triestina
    (1, 1, 4, '2025-09-22', 4, 1, 0),  -- Aquile 1-0 Porto
    (1, 2, 3, '2025-09-29', 1, 2, 0),  -- Leoni  2-0 Triestina
    (1, 2, 4, '2025-10-06', 4, 1, 1),  -- Leoni  1-1 Porto
    (1, 3, 4, '2025-10-13', 1, 3, 0);  -- Triestina 3-0 Porto

-- Matches: volleyball round-robin (4 played, 2 upcoming → IN CORSO)
INSERT INTO matches (tournament_id, team1_id, team2_id, date, field_id, score1, score2) VALUES
    (2, 5, 6, '2025-10-08', 2, 3, 1),    -- Falchi 3-1 Delfini
    (2, 5, 7, '2025-10-15', 2, 3, 0),    -- Falchi 3-0 Aquilotti
    (2, 5, 8, '2025-10-22', 2, 3, 2),    -- Falchi 3-2 Pionieri
    (2, 6, 7, '2025-10-29', 2, 2, 3),    -- Delfini 2-3 Aquilotti
    (2, 6, 8, '2026-06-10', NULL, NULL, NULL),  -- upcoming
    (2, 7, 8, '2026-06-24', NULL, NULL, NULL);  -- upcoming

-- Matches: basketball round-robin (all upcoming → IN ARRIVO)
INSERT INTO matches (tournament_id, team1_id, team2_id, date, field_id, score1, score2) VALUES
    (3,  9, 10, '2026-07-07', NULL, NULL, NULL),
    (3,  9, 11, '2026-07-14', NULL, NULL, NULL),
    (3,  9, 12, '2026-07-21', NULL, NULL, NULL),
    (3, 10, 11, '2026-07-28', NULL, NULL, NULL),
    (3, 10, 12, '2026-08-04', NULL, NULL, NULL),
    (3, 11, 12, '2026-08-11', NULL, NULL, NULL);

-- A demo booking (demo user, Campo Calcio San Giovanni, slot 11:00-12:00, future date)
INSERT INTO bookings (user_id, field_id, slot_id, date) VALUES (1, 1, 3, '2026-06-15');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_date  ON bookings(slot_id, date);
CREATE INDEX IF NOT EXISTS idx_teams_tournament    ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_team        ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament  ON matches(tournament_id);
