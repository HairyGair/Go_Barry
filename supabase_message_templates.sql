-- Go BARRY Message Templates Table
-- Run this in your Supabase SQL Editor

-- Create the message_templates table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('diversion', 'closure', 'incident', 'custom')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  routes TEXT[], -- Array of route numbers
  is_urgent BOOLEAN DEFAULT false,
  
  -- Supervisor tracking
  created_by TEXT NOT NULL, -- Supervisor badge (e.g., 'AG003')
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Modification tracking
  last_modified_by TEXT,
  last_modified_by_name TEXT,
  last_modified_at TIMESTAMPTZ,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

-- Create indexes for performance
CREATE INDEX idx_templates_active ON public.message_templates(is_active);
CREATE INDEX idx_templates_category ON public.message_templates(category) WHERE is_active = true;
CREATE INDEX idx_templates_urgent ON public.message_templates(is_urgent) WHERE is_active = true;
CREATE INDEX idx_templates_use_count ON public.message_templates(use_count DESC) WHERE is_active = true;
CREATE INDEX idx_templates_created_by ON public.message_templates(created_by);

-- Enable Row Level Security
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read templates
CREATE POLICY "Templates are viewable by all" ON public.message_templates
  FOR SELECT USING (true);

-- Create policy to allow all authenticated users to create templates
CREATE POLICY "Supervisors can create templates" ON public.message_templates
  FOR INSERT WITH CHECK (true);

-- Create policy to allow all authenticated users to update templates
CREATE POLICY "Supervisors can update templates" ON public.message_templates
  FOR UPDATE USING (true);

-- Create policy for soft delete (only update is_active flag)
CREATE POLICY "Supervisors can soft delete templates" ON public.message_templates
  FOR UPDATE USING (true) WITH CHECK (
    -- Only allow updating is_active, deleted_at, and deleted_by fields
    id = id
  );

-- Insert the High Level Bridge template as default
INSERT INTO public.message_templates (
  template_id,
  name,
  category,
  subject,
  content,
  routes,
  is_urgent,
  created_by,
  created_by_name
) VALUES (
  'TPL_HIGH_LEVEL_BRIDGE_DEFAULT',
  'High Level Bridge Closure',
  'closure',
  'URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE',
  E'URGENT MESSAGE REGARDING CLOSURE OF HIGH LEVEL BRIDGE IN NEWCASTLE\n\nWe have been advised that Northumbria Police are currently dealing with a Serious Incident on the High Level Bridge in Newcastle.\n\nAs a result, the bridge is closed to all traffic, including buses, in both directions. This is affecting all our services that use this crossing.\n\nAll services that operate over the High Level Bridge - 1, 10, 10A, 10B, 11, 11X, 12, 12A, Q3, 21, 28B, 29, 56, 57, 58, 84, 85, 93 & 94 as well as any others that use the bridge crossing will be affected by the closure.\n\nServices operating to/from Eldon Square Bus Station will start/terminate at Central Station where possible. All connections to Gateshead will be suspended whilst the bridge is closed, any services scheduled to serve Gateshead Interchange after operating to Eldon Square will operate via Pilgrim Street, Market Street, and Clayton Street to Newcastle Central Station instead.\n\nAny customers making journeys that need to use the bridge to cross the Tyne should make alternative arrangements - we''d suggest travelling to Four Lane Ends Metro Interchange to pick up the 1, 309, 310 or 311 to get to Gateshead Interchange.\n\nPlease discourage any customers from walking over the bridge during the closure.\n\nWe''ll update as soon as we have further information.\n\nThank you.',
  ARRAY['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
  true,
  'SYSTEM',
  'System Default'
) ON CONFLICT (template_id) DO NOTHING;

-- Create a function to update use count and last used timestamp
CREATE OR REPLACE FUNCTION update_template_usage(p_template_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.message_templates
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE template_id = p_template_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get most used templates
CREATE OR REPLACE FUNCTION get_most_used_templates(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  template_id TEXT,
  name TEXT,
  category TEXT,
  subject TEXT,
  content TEXT,
  routes TEXT[],
  is_urgent BOOLEAN,
  use_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.template_id,
    mt.name,
    mt.category,
    mt.subject,
    mt.content,
    mt.routes,
    mt.is_urgent,
    mt.use_count
  FROM public.message_templates mt
  WHERE mt.is_active = true
  ORDER BY mt.use_count DESC, mt.last_used_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;
