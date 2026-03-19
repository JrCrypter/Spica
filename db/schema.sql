CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE,
  payment_link TEXT,
  stripe_session_id TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_events (
  id SERIAL PRIMARY KEY,
  wa_message_id TEXT,
  from_number TEXT,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billers (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_transactions (
  id SERIAL PRIMARY KEY,
  transaction_ref TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'simulated_provider',
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  biller_code TEXT,
  account_number TEXT,
  operator_code TEXT,
  mobile_number TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'inr',
  status TEXT NOT NULL DEFAULT 'initiated',
  provider_reference TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

INSERT INTO customers (name, email, phone, whatsapp_number)
VALUES
  ('Northstar Studio', 'ops@northstar.test', '+15551230001', '15551230001'),
  ('Helio Commerce', 'finance@helio.test', '+15551230002', '15551230002')
ON CONFLICT DO NOTHING;

INSERT INTO billers (category, code, name, region)
VALUES
  ('electricity', 'TORRENT_POWER', 'Torrent Power', 'India'),
  ('broadband', 'AIRTEL_BB', 'Airtel Broadband', 'India'),
  ('gas', 'ADANI_GAS', 'Adani Gas', 'India'),
  ('water', 'BWSSB', 'Bangalore Water Supply', 'India')
ON CONFLICT (code) DO NOTHING;
