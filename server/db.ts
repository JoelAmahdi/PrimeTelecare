/**
 * Prime Telecare Database Layer & Cloud SQL Integration
 * Provides support for Cloud PostgreSQL (Neon, Render Postgres, Supabase)
 * with automatic fallback to persistent JSON storage.
 */

export interface DatabaseStatus {
  connected: boolean;
  type: 'postgresql' | 'file_json';
  urlConfigured: boolean;
  activePool?: boolean;
}

export function getDatabaseConfig(): DatabaseStatus {
  const dbUrl = process.env.DATABASE_URL;
  return {
    connected: true,
    type: dbUrl ? 'postgresql' : 'file_json',
    urlConfigured: !!dbUrl,
  };
}

/**
 * SQL Schema definition for PostgreSQL deployments
 */
export const POSTGRES_TABLE_SCHEMAS = `
-- Prime Telecare Clinical Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL,
  phone VARCHAR(64),
  wallet_balance NUMERIC DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(128) NOT NULL,
  license_number VARCHAR(64) NOT NULL,
  is_online BOOLEAN DEFAULT false,
  consultation_fee NUMERIC DEFAULT 10000,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialty VARCHAR(128),
  doctor_avatar TEXT,
  patient_name VARCHAR(255) NOT NULL,
  scheduled_date VARCHAR(64) NOT NULL,
  time_slot VARCHAR(64) NOT NULL,
  type VARCHAR(32) DEFAULT 'Video',
  status VARCHAR(32) DEFAULT 'upcoming',
  notes TEXT,
  price NUMERIC DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(64) PRIMARY KEY,
  reference_no VARCHAR(64) UNIQUE NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_license VARCHAR(64) NOT NULL,
  diagnosis TEXT,
  medications JSONB NOT NULL,
  auth_seal_token TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  sender VARCHAR(32) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  status VARCHAR(32) DEFAULT 'delivered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  reference VARCHAR(128) UNIQUE NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  purpose VARCHAR(64) NOT NULL,
  method VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  consultation_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

