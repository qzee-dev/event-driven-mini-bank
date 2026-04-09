CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  balance NUMERIC DEFAULT 1000
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  request_id TEXT UNIQUE,
  from_user INT,
  to_user INT,
  amount NUMERIC,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE outbox (
  id SERIAL PRIMARY KEY,
  event_type TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE
);

INSERT INTO users (name, balance) VALUES
('Alice', 1000),
('Bob', 1000);
