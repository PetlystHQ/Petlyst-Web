-- Create sequence for auto-incrementing ID
CREATE SEQUENCE IF NOT EXISTS public.standard_diagnoses_diagnosis_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.standard_diagnoses_diagnosis_id_seq
    OWNER TO "petlystAdmin";

-- Add new ID column
ALTER TABLE public.standard_diagnoses
    ADD COLUMN diagnosis_id integer NOT NULL DEFAULT nextval('standard_diagnoses_diagnosis_id_seq'::regclass);

-- Add veterinarian_id column
ALTER TABLE public.standard_diagnoses
    ADD COLUMN veterinarian_id integer;

-- Drop the existing primary key constraint
ALTER TABLE public.standard_diagnoses
    DROP CONSTRAINT standard_diagnoses_pkey;

-- Add a unique constraint to the code column to maintain uniqueness
ALTER TABLE public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_code_key UNIQUE (code);

-- Set the new primary key
ALTER TABLE public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_pkey PRIMARY KEY (diagnosis_id);

-- Add foreign key constraint for veterinarian_id
ALTER TABLE public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_veterinarian_id_fkey
    FOREIGN KEY (veterinarian_id)
    REFERENCES public.users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- Update sequence ownership
ALTER SEQUENCE public.standard_diagnoses_diagnosis_id_seq
    OWNED BY public.standard_diagnoses.diagnosis_id; 