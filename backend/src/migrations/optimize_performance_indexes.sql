-- Index pour améliorer les performances de recherche et de filtrage

-- Table properties
CREATE INDEX IF NOT EXISTS idx_properties_is_published ON properties(is_published);
CREATE INDEX IF NOT EXISTS idx_properties_published_at ON properties(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

-- Table property_units
CREATE INDEX IF NOT EXISTS idx_property_units_property_id ON property_units(property_id);
CREATE INDEX IF NOT EXISTS idx_property_units_is_available ON property_units(is_available);
CREATE INDEX IF NOT EXISTS idx_property_units_price ON property_units(monthly_rent);

-- Table messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Table site_visits
CREATE INDEX IF NOT EXISTS idx_site_visits_ip_path ON site_visits(ip_address, path);
