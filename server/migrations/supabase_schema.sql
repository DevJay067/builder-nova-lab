-- Supabase Database Schema for Healthcare System
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create health_records table (replaces medical_history)
CREATE TABLE IF NOT EXISTS health_records (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  doctor VARCHAR(255),
  date DATE NOT NULL,
  metadata JSONB,
  secure_record_id VARCHAR(255),
  storage_path VARCHAR(500), -- Path to file in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for health_records
CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(date);
CREATE INDEX IF NOT EXISTS idx_health_records_record_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_created_at ON health_records(created_at);

-- Create secure_data_records table
CREATE TABLE IF NOT EXISTS secure_data_records (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  encrypted_data TEXT NOT NULL,
  key_id VARCHAR(255) NOT NULL,
  blockchain_hash VARCHAR(255) UNIQUE NOT NULL,
  access_level VARCHAR(50) NOT NULL DEFAULT 'provider',
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  checksum VARCHAR(255) NOT NULL,
  storage_vault_path VARCHAR(500) -- Path in Supabase Storage vault
);

-- Create indexes for secure_data_records
CREATE INDEX IF NOT EXISTS idx_secure_data_patient_id ON secure_data_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_secure_data_key_id ON secure_data_records(key_id);
CREATE INDEX IF NOT EXISTS idx_secure_data_blockchain_hash ON secure_data_records(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_secure_data_created_at ON secure_data_records(created_at);

-- Create key_store table
CREATE TABLE IF NOT EXISTS key_store (
  key_id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  system_key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  rotation_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  last_used TIMESTAMP WITH TIME ZONE
);

-- Create indexes for key_store
CREATE INDEX IF NOT EXISTS idx_key_store_patient_id ON key_store(patient_id);
CREATE INDEX IF NOT EXISTS idx_key_store_provider_id ON key_store(provider_id);
CREATE INDEX IF NOT EXISTS idx_key_store_status ON key_store(status);

-- Create key_distributions table
CREATE TABLE IF NOT EXISTS key_distributions (
  distribution_id VARCHAR(255) PRIMARY KEY,
  key_id VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL,
  recipient_id VARCHAR(255) NOT NULL,
  key_fragment_encrypted TEXT NOT NULL,
  delivery_method VARCHAR(50) NOT NULL,
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (key_id) REFERENCES key_store(key_id) ON DELETE CASCADE
);

-- Create indexes for key_distributions
CREATE INDEX IF NOT EXISTS idx_key_distributions_key_id ON key_distributions(key_id);
CREATE INDEX IF NOT EXISTS idx_key_distributions_recipient_id ON key_distributions(recipient_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  data_record_id VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_data_record_id ON audit_logs(data_record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create key_rotation_schedule table
CREATE TABLE IF NOT EXISTS key_rotation_schedule (
  schedule_id VARCHAR(255) PRIMARY KEY,
  key_id VARCHAR(255) NOT NULL,
  scheduled_rotation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rotation_reason VARCHAR(50) NOT NULL,
  auto_rotate BOOLEAN DEFAULT true,
  notifications_sent JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  FOREIGN KEY (key_id) REFERENCES key_store(key_id) ON DELETE CASCADE
);

-- Create indexes for key_rotation_schedule
CREATE INDEX IF NOT EXISTS idx_key_rotation_key_id ON key_rotation_schedule(key_id);
CREATE INDEX IF NOT EXISTS idx_key_rotation_scheduled_date ON key_rotation_schedule(scheduled_rotation_date);
CREATE INDEX IF NOT EXISTS idx_key_rotation_completed ON key_rotation_schedule(completed);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  user_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  secure_system_activated BOOLEAN DEFAULT false,
  split_key_system_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_hash ON user_profiles(user_hash);

-- Enable Row Level Security (RLS)
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for health_records
CREATE POLICY "Users can view their own health records" ON health_records
  FOR SELECT USING (auth.uid()::text = patient_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid()::text = patient_id);

CREATE POLICY "Users can update their own health records" ON health_records
  FOR UPDATE USING (auth.uid()::text = patient_id);

-- Create RLS policies for secure_data_records
CREATE POLICY "Users can view their own secure records" ON secure_data_records
  FOR SELECT USING (auth.uid()::text = patient_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert their own secure records" ON secure_data_records
  FOR INSERT WITH CHECK (auth.uid()::text = patient_id);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_health_records_updated_at
  BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secure_data_records_updated_at
  BEFORE UPDATE ON secure_data_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets (if not already created via Supabase Dashboard)
-- Note: These might need to be created via the Supabase Dashboard or API
-- INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
-- VALUES 
--   ('health-vault', 'health-vault', false, false, 52428800, '{"application/json","text/plain","application/pdf","image/*"}'),
--   ('medical-records', 'medical-records', false, false, 104857600, '{"application/pdf","image/*","text/*"}');

-- Create storage policies
-- CREATE POLICY "Users can upload to their own vault folder" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'health-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own vault files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'health-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add some helpful views
CREATE OR REPLACE VIEW user_health_summary AS
SELECT 
  up.id,
  up.username,
  up.first_name,
  up.last_name,
  COUNT(hr.id) as total_health_records,
  COUNT(sdr.id) as total_secure_records,
  MAX(hr.date) as latest_record_date,
  up.secure_system_activated,
  up.split_key_system_active
FROM user_profiles up
LEFT JOIN health_records hr ON up.id::text = hr.patient_id
LEFT JOIN secure_data_records sdr ON up.id::text = sdr.patient_id
GROUP BY up.id, up.username, up.first_name, up.last_name, up.secure_system_activated, up.split_key_system_active;

-- Create a function to get health record statistics
CREATE OR REPLACE FUNCTION get_health_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_health_records', (SELECT COUNT(*) FROM health_records),
    'total_secure_records', (SELECT COUNT(*) FROM secure_data_records),
    'total_users', (SELECT COUNT(*) FROM user_profiles),
    'records_this_month', (SELECT COUNT(*) FROM health_records WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    'active_users', (SELECT COUNT(*) FROM user_profiles WHERE secure_system_activated = true)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_health_statistics() TO authenticated;
