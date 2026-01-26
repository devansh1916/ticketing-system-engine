DROP TABLE if EXISTS seats;
DROP TABLE if EXISTS events;
DROP TABLE if EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    total_Seats INTEGER NOT NULL,
    date TIMESTAMP NOT NULL
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER References events(id),
    row_letter CHAR(1) NOT NULL,
    seat_number INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'Avaialble',
    
    holder_id INTEGER REFERENCES users(id),

    hold_expires_at TIMESTAMP
);

CREATE INDEX idx_seats_status ON seats(event_id,status);

INSERT INTO events(name , total_seats,date)
VALUES ('Concert-Tour',100,NOW()+ INTERVAL '1 month');

INSERT INTO users(email) VALUES
('sudhit@example.com'),('aaryan@example.com');


INSERT INTO seats (event_id, row_letter, seat_number)
SELECT 1, CHR(65+(i/10)), (i%10) +1 FROM generate_Series(0,99) AS i;