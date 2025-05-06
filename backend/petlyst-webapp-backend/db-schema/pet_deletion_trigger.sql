-- Create a function to handle pet deletion
CREATE OR REPLACE FUNCTION discharge_hospitalized_pet() RETURNS TRIGGER AS $$
DECLARE
    hospitalization_record RECORD;
BEGIN
    -- If the pet's status is being changed to 'deleted'
    IF NEW.pet_status = 'deleted' AND (OLD.pet_status IS NULL OR OLD.pet_status != 'deleted') THEN
        -- Find all active hospitalizations for this pet
        FOR hospitalization_record IN 
            SELECT h.id, h.room_id
            FROM pet_hospitalizations h
            WHERE h.pet_id = NEW.pet_id AND h.actual_discharge_date IS NULL
        LOOP
            -- Update hospitalization record with today's date as discharge date
            UPDATE pet_hospitalizations
            SET actual_discharge_date = CURRENT_DATE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = hospitalization_record.id;
            
            -- Update room status back to vacant
            UPDATE clinic_hospitalization_rooms
            SET room_status = 'vacant',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = hospitalization_record.room_id;
            
            RAISE NOTICE 'Auto-discharged hospitalization ID % for deleted pet ID %, room ID % marked as vacant',
                hospitalization_record.id, NEW.pet_id, hospitalization_record.room_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the pets table
DROP TRIGGER IF EXISTS pet_deleted_discharge_trigger ON pets;
CREATE TRIGGER pet_deleted_discharge_trigger
AFTER UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION discharge_hospitalized_pet();

-- Log that the trigger has been created
DO $$
BEGIN
    RAISE NOTICE 'Pet deletion hospitalization discharge trigger installed successfully';
END $$; 