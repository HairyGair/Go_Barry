-- Go BARRY Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Table: supervisors

    CREATE TABLE IF NOT EXISTS supervisors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      badge TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      shift TEXT NOT NULL,
      permissions TEXT[] NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_supervisors_badge ON supervisors(badge);
    CREATE INDEX IF NOT EXISTS idx_supervisors_active ON supervisors(active);
  

-- Table: dismissed_alerts

    CREATE TABLE IF NOT EXISTS dismissed_alerts (
      id TEXT PRIMARY KEY,
      supervisor_id TEXT REFERENCES supervisors(id),
      supervisor_badge TEXT NOT NULL,
      reason TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      alert_hash TEXT,
      alert_data JSONB
    );
    
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_supervisor ON dismissed_alerts(supervisor_id);
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_timestamp ON dismissed_alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_dismissed_alerts_hash ON dismissed_alerts(alert_hash);
  

-- Table: major_events

    CREATE TABLE IF NOT EXISTS major_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      affected_routes TEXT[],
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_major_events_status ON major_events(status);
    CREATE INDEX IF NOT EXISTS idx_major_events_start_time ON major_events(start_time);
  

-- Table: message_templates

    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL,
      variables TEXT[],
      channels TEXT[],
      auto_trigger JSONB,
      usage_count INTEGER DEFAULT 0,
      last_used TIMESTAMP WITH TIME ZONE,
      created_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
    CREATE INDEX IF NOT EXISTS idx_message_templates_priority ON message_templates(priority);
  

-- Table: template_categories

    CREATE TABLE IF NOT EXISTS template_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  

-- Table: supervisor_sessions

    CREATE TABLE IF NOT EXISTS supervisor_sessions (
      id TEXT PRIMARY KEY,
      supervisor_id TEXT REFERENCES supervisors(id),
      badge TEXT NOT NULL,
      login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      active BOOLEAN DEFAULT true
    );
    
    CREATE INDEX IF NOT EXISTS idx_supervisor_sessions_supervisor ON supervisor_sessions(supervisor_id);
    CREATE INDEX IF NOT EXISTS idx_supervisor_sessions_active ON supervisor_sessions(active);
  

-- Table: historical_incidents

    CREATE TABLE IF NOT EXISTS historical_incidents (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      coordinates FLOAT[],
      source TEXT NOT NULL,
      features JSONB,
      affected_routes TEXT[],
      resolution_time_minutes INTEGER,
      predicted_severity TEXT,
      predicted_impact TEXT,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_timestamp ON historical_incidents(timestamp);
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_source ON historical_incidents(source);
    CREATE INDEX IF NOT EXISTS idx_historical_incidents_location ON historical_incidents(location);
  

