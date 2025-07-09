-- Enhanced Icon Management Schema for Brainliest Platform
-- Comprehensive database schema for unified icon system

-- Icon categories enum
CREATE TYPE icon_category AS ENUM (
  'certification',
  'test-prep', 
  'academic',
  'technology',
  'general',
  'brand'
);

-- Icon styles enum
CREATE TYPE icon_style AS ENUM (
  'filled',
  'outlined',
  'duotone',
  'brand'
);

-- Core icons table
CREATE TABLE icons (
  id SERIAL PRIMARY KEY,
  icon_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category icon_category NOT NULL,
  style icon_style DEFAULT 'outlined',
  svg_content TEXT NOT NULL,
  brand_colors JSONB DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  size_variants JSONB DEFAULT '{"16": true, "24": true, "32": true, "48": true}',
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subject icon mappings with priority system
CREATE TABLE subject_icon_mappings (
  id SERIAL PRIMARY KEY,
  subject_slug VARCHAR(255) REFERENCES subjects(slug) ON DELETE CASCADE,
  icon_id VARCHAR(100) REFERENCES icons(icon_id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1, -- 1 = highest priority
  mapping_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'pattern', 'auto'
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subject_slug, icon_id)
);

-- Exam icon mappings (optional, inherits from subject if not specified)
CREATE TABLE exam_icon_mappings (
  id SERIAL PRIMARY KEY,
  exam_slug VARCHAR(255) REFERENCES exams(slug) ON DELETE CASCADE,
  icon_id VARCHAR(100) REFERENCES icons(icon_id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  mapping_source VARCHAR(50) DEFAULT 'manual',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_slug, icon_id)
);

-- Icon usage analytics
CREATE TABLE icon_usage_analytics (
  id SERIAL PRIMARY KEY,
  icon_id VARCHAR(100) REFERENCES icons(icon_id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  view_count INTEGER DEFAULT 0,
  load_time_avg DECIMAL(8,2), -- in milliseconds
  cache_hit_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(icon_id, usage_date)
);

-- Icon pattern mappings for automatic resolution
CREATE TABLE icon_pattern_mappings (
  id SERIAL PRIMARY KEY,
  icon_id VARCHAR(100) REFERENCES icons(icon_id) ON DELETE CASCADE,
  pattern VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(50) DEFAULT 'keyword', -- 'keyword', 'regex', 'exact'
  weight DECIMAL(3,2) DEFAULT 1.0, -- Pattern matching weight
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_icons_category ON icons(category);
CREATE INDEX idx_icons_active ON icons(is_active) WHERE is_active = true;
CREATE INDEX idx_icons_official ON icons(is_official) WHERE is_official = true;
CREATE INDEX idx_subject_mappings_slug ON subject_icon_mappings(subject_slug);
CREATE INDEX idx_subject_mappings_priority ON subject_icon_mappings(priority);
CREATE INDEX idx_exam_mappings_slug ON exam_icon_mappings(exam_slug);
CREATE INDEX idx_usage_analytics_date ON icon_usage_analytics(usage_date);
CREATE INDEX idx_pattern_mappings_active ON icon_pattern_mappings(is_active) WHERE is_active = true;
CREATE INDEX idx_pattern_mappings_type ON icon_pattern_mappings(pattern_type);

-- Full-text search index for icon names and keywords
CREATE INDEX idx_icons_search ON icons USING gin(
  to_tsvector('english', name || ' ' || array_to_string(keywords, ' ') || ' ' || array_to_string(tags, ' '))
);

-- Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_icons_updated_at BEFORE UPDATE ON icons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO icons (icon_id, name, category, style, svg_content, brand_colors, keywords, tags, is_official) VALUES
('aws', 'Amazon Web Services', 'certification', 'brand', '<svg viewBox="0 0 100 100"><!-- AWS SVG content --></svg>', '{"primary": "#ff9900", "secondary": "#ffffff"}', ARRAY['aws', 'amazon', 'cloud'], ARRAY['cloud', 'certification'], true),
('azure', 'Microsoft Azure', 'certification', 'brand', '<svg viewBox="0 0 100 100"><!-- Azure SVG content --></svg>', '{"primary": "#0078d4", "secondary": "#ffffff"}', ARRAY['azure', 'microsoft', 'cloud'], ARRAY['cloud', 'certification'], true),
('comptia', 'CompTIA', 'certification', 'brand', '<svg viewBox="0 0 100 100"><!-- CompTIA SVG content --></svg>', '{"primary": "#e31837", "secondary": "#ffffff"}', ARRAY['comptia', 'security', 'it'], ARRAY['security', 'certification'], true),
('hesi', 'HESI', 'test-prep', 'brand', '<svg viewBox="0 0 100 100"><!-- HESI SVG content --></svg>', '{"primary": "#2563eb", "secondary": "#ffffff"}', ARRAY['hesi', 'nursing', 'health'], ARRAY['test-prep', 'nursing'], true),
('teas', 'TEAS', 'test-prep', 'brand', '<svg viewBox="0 0 100 100"><!-- TEAS SVG content --></svg>', '{"primary": "#16a34a", "secondary": "#ffffff"}', ARRAY['teas', 'nursing', 'assessment'], ARRAY['test-prep', 'nursing'], true),
('academic', 'Academic', 'general', 'outlined', '<svg viewBox="0 0 100 100"><!-- Academic SVG content --></svg>', '{"primary": "#6b7280"}', ARRAY['academic', 'education', 'general'], ARRAY['general', 'fallback'], false);

-- Sample pattern mappings
INSERT INTO icon_pattern_mappings (icon_id, pattern, pattern_type, weight) VALUES
('aws', 'aws', 'keyword', 1.0),
('aws', 'amazon', 'keyword', 0.9),
('aws', 'cloud', 'keyword', 0.7),
('azure', 'azure', 'keyword', 1.0),
('azure', 'microsoft', 'keyword', 0.8),
('comptia', 'comptia', 'keyword', 1.0),
('comptia', 'security\+', 'regex', 0.9),
('hesi', 'hesi', 'keyword', 1.0),
('hesi', 'health education', 'keyword', 0.8),
('teas', 'teas', 'keyword', 1.0),
('teas', 'test of essential', 'keyword', 0.8),
('academic', '.*', 'regex', 0.1); -- Fallback pattern

-- Views for common queries
CREATE VIEW v_subject_icons AS
SELECT 
  s.slug as subject_slug,
  s.name as subject_name,
  i.icon_id,
  i.name as icon_name,
  i.category,
  i.svg_content,
  i.brand_colors,
  sim.priority,
  sim.mapping_source
FROM subjects s
LEFT JOIN subject_icon_mappings sim ON s.slug = sim.subject_slug
LEFT JOIN icons i ON sim.icon_id = i.icon_id
WHERE i.is_active = true
ORDER BY s.slug, sim.priority;

CREATE VIEW v_icon_performance AS
SELECT 
  i.icon_id,
  i.name,
  i.category,
  COUNT(iua.id) as total_usage_days,
  AVG(iua.view_count) as avg_daily_views,
  AVG(iua.load_time_avg) as avg_load_time,
  AVG(iua.cache_hit_rate) as avg_cache_hit_rate,
  SUM(iua.error_count) as total_errors
FROM icons i
LEFT JOIN icon_usage_analytics iua ON i.icon_id = iua.icon_id
WHERE i.is_active = true
GROUP BY i.icon_id, i.name, i.category
ORDER BY avg_daily_views DESC;

-- Comments for documentation
COMMENT ON TABLE icons IS 'Core table storing all icon definitions with metadata';
COMMENT ON TABLE subject_icon_mappings IS 'Maps subjects to their assigned icons with priority system';
COMMENT ON TABLE icon_usage_analytics IS 'Tracks icon usage patterns and performance metrics';
COMMENT ON TABLE icon_pattern_mappings IS 'Defines patterns for automatic icon resolution';
COMMENT ON VIEW v_subject_icons IS 'Combined view of subjects with their assigned icons';
COMMENT ON VIEW v_icon_performance IS 'Performance analytics summary for all icons';