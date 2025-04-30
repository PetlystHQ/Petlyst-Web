-- Update inventory_categories table to use integer for clinic_id
ALTER TABLE inventory_categories 
ALTER COLUMN clinic_id TYPE integer USING clinic_id::integer,
ALTER COLUMN created_by TYPE integer USING created_by::integer;

-- Update inventory_items table to use integer for clinic_id
ALTER TABLE inventory_items 
ALTER COLUMN clinic_id TYPE integer USING clinic_id::integer,
ALTER COLUMN created_by TYPE integer USING created_by::integer;

-- Update inventory_transactions table to use integer for clinic_id
ALTER TABLE inventory_transactions
ALTER COLUMN clinic_id TYPE integer USING clinic_id::integer,
ALTER COLUMN performed_by_user_id TYPE integer USING performed_by_user_id::integer;

-- Remove the placeholder data that might be causing errors
DELETE FROM inventory_categories WHERE clinic_id = '{{clinicId}}';

-- Add some example categories for clinic 75
INSERT INTO inventory_categories (id, name, description, parent_id, clinic_id, created_at, updated_at, created_by, is_active)
VALUES 
('cat-1', 'Medications', 'All types of medications', NULL, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 27, true),
('cat-2', 'Vaccines', 'All types of vaccines', NULL, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 27, true),
('cat-3', 'Medical Supplies', 'Bandages, gauze, etc.', NULL, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 27, true),
('cat-4', 'Diet Foods', 'Special dietary foods', NULL, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 27, true),
('cat-5', 'Equipment', 'Medical equipment', NULL, 75, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 27, true); 