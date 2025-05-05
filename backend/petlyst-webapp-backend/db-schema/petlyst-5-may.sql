--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-05 17:35:46

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 913 (class 1247 OID 16506)
-- Name: appointment_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.appointment_status_enum AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'canceled',
    'grinch'
);


ALTER TYPE public.appointment_status_enum OWNER TO "petlystAdmin";

--
-- TOC entry 976 (class 1247 OID 17004)
-- Name: clinic_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.clinic_type_enum AS ENUM (
    'veterinary_clinic',
    'animal_hospital'
);


ALTER TYPE public.clinic_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 910 (class 1247 OID 16498)
-- Name: clinic_verification_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.clinic_verification_status_enum AS ENUM (
    'pending',
    'archived',
    'active',
    'verified',
    'pending_submission',
    'not_verified'
);


ALTER TYPE public.clinic_verification_status_enum OWNER TO "petlystAdmin";

--
-- TOC entry 991 (class 1247 OID 17232)
-- Name: clinic_veterinarian_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.clinic_veterinarian_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.clinic_veterinarian_status_enum OWNER TO "petlystAdmin";

--
-- TOC entry 970 (class 1247 OID 16941)
-- Name: phone_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.phone_type_enum AS ENUM (
    'fixed_line',
    'mobile_number'
);


ALTER TYPE public.phone_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 1021 (class 1247 OID 17870)
-- Name: room_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.room_status_enum AS ENUM (
    'vacant',
    'occupied',
    'maintenance'
);


ALTER TYPE public.room_status_enum OWNER TO "petlystAdmin";

--
-- TOC entry 1018 (class 1247 OID 17861)
-- Name: room_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.room_type_enum AS ENUM (
    'intensive_care',
    'observation',
    'standard',
    'isolation'
);


ALTER TYPE public.room_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 1012 (class 1247 OID 17652)
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.transaction_type AS ENUM (
    'purchase',
    'usage',
    'adjustment',
    'expired',
    'damaged',
    'return'
);


ALTER TYPE public.transaction_type OWNER TO "petlystAdmin";

--
-- TOC entry 904 (class 1247 OID 16471)
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.user_type_enum AS ENUM (
    'veterinarian',
    'pet_owner',
    'admin'
);


ALTER TYPE public.user_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 907 (class 1247 OID 16478)
-- Name: veterinarian_verification_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.veterinarian_verification_status_enum AS ENUM (
    'not_verified',
    'pending',
    'verified'
);


ALTER TYPE public.veterinarian_verification_status_enum OWNER TO "petlystAdmin";

--
-- TOC entry 279 (class 1255 OID 17629)
-- Name: update_timestamp_column(); Type: FUNCTION; Schema: public; Owner: petlystAdmin
--

CREATE FUNCTION public.update_timestamp_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp_column() OWNER TO "petlystAdmin";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 245 (class 1259 OID 16902)
-- Name: additional_services; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.additional_services (
    additional_service_id integer NOT NULL,
    service_name character varying(200) NOT NULL,
    service_description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.additional_services OWNER TO "petlystAdmin";

--
-- TOC entry 244 (class 1259 OID 16901)
-- Name: additional_services_additional_service_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.additional_services_additional_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.additional_services_additional_service_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4806 (class 0 OID 0)
-- Dependencies: 244
-- Name: additional_services_additional_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.additional_services_additional_service_id_seq OWNED BY public.additional_services.additional_service_id;


--
-- TOC entry 237 (class 1259 OID 16842)
-- Name: animal_types; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.animal_types (
    animal_type_id integer NOT NULL,
    animal_type_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.animal_types OWNER TO "petlystAdmin";

--
-- TOC entry 236 (class 1259 OID 16841)
-- Name: animal_types_animal_type_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.animal_types_animal_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.animal_types_animal_type_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4807 (class 0 OID 0)
-- Dependencies: 236
-- Name: animal_types_animal_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.animal_types_animal_type_id_seq OWNED BY public.animal_types.animal_type_id;


--
-- TOC entry 226 (class 1259 OID 16602)
-- Name: appointments; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.appointments (
    appointment_id integer NOT NULL,
    video_meeting boolean DEFAULT false,
    pet_id integer,
    meeting_url text,
    appointment_start_hour timestamp without time zone NOT NULL,
    appointment_status public.appointment_status_enum DEFAULT 'pending'::public.appointment_status_enum,
    notes text,
    appointment_end_hour timestamp without time zone NOT NULL,
    meeting_password character varying(255),
    appointment_date date NOT NULL,
    clinic_id integer,
    pet_owner_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.appointments OWNER TO "petlystAdmin";

--
-- TOC entry 225 (class 1259 OID 16601)
-- Name: appointments_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.appointments_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_appointment_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4808 (class 0 OID 0)
-- Dependencies: 225
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- TOC entry 247 (class 1259 OID 16914)
-- Name: clinic_additional_services; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_additional_services (
    clinic_additional_service_id integer NOT NULL,
    clinic_id integer NOT NULL,
    additional_service_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_additional_services OWNER TO "petlystAdmin";

--
-- TOC entry 246 (class 1259 OID 16913)
-- Name: clinic_additional_services_clinic_additional_service_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_additional_services_clinic_additional_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_additional_services_clinic_additional_service_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4809 (class 0 OID 0)
-- Dependencies: 246
-- Name: clinic_additional_services_clinic_additional_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_additional_services_clinic_additional_service_id_seq OWNED BY public.clinic_additional_services.clinic_additional_service_id;


--
-- TOC entry 224 (class 1259 OID 16587)
-- Name: clinic_albums; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_albums (
    clinic_album_photo_id integer NOT NULL,
    clinic_id integer NOT NULL,
    clinic_album_photo_url text NOT NULL,
    clinic_album_photo_url_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clinic_type public.clinic_type_enum NOT NULL
);


ALTER TABLE public.clinic_albums OWNER TO "petlystAdmin";

--
-- TOC entry 239 (class 1259 OID 16852)
-- Name: clinic_animal_types; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_animal_types (
    clinic_animal_type_id integer NOT NULL,
    clinic_id integer NOT NULL,
    animal_type_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_animal_types OWNER TO "petlystAdmin";

--
-- TOC entry 238 (class 1259 OID 16851)
-- Name: clinic_animal_types_clinic_animal_type_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_animal_types_clinic_animal_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_animal_types_clinic_animal_type_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4810 (class 0 OID 0)
-- Dependencies: 238
-- Name: clinic_animal_types_clinic_animal_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_animal_types_clinic_animal_type_id_seq OWNED BY public.clinic_animal_types.clinic_animal_type_id;


--
-- TOC entry 270 (class 1259 OID 17878)
-- Name: clinic_hospitalization_rooms; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_hospitalization_rooms (
    id integer NOT NULL,
    clinic_id integer NOT NULL,
    room_name character varying(100) NOT NULL,
    room_type public.room_type_enum NOT NULL,
    room_status public.room_status_enum DEFAULT 'vacant'::public.room_status_enum,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_hospitalization_rooms OWNER TO "petlystAdmin";

--
-- TOC entry 269 (class 1259 OID 17877)
-- Name: clinic_hospitalization_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_hospitalization_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_hospitalization_rooms_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4811 (class 0 OID 0)
-- Dependencies: 269
-- Name: clinic_hospitalization_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_hospitalization_rooms_id_seq OWNED BY public.clinic_hospitalization_rooms.id;


--
-- TOC entry 235 (class 1259 OID 16806)
-- Name: clinic_locations; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_locations (
    location_id integer NOT NULL,
    clinic_id integer NOT NULL,
    province character varying(255),
    district character varying(255),
    clinic_address text,
    latitude numeric(10,7),
    longitude numeric(11,7)
);


ALTER TABLE public.clinic_locations OWNER TO "petlystAdmin";

--
-- TOC entry 234 (class 1259 OID 16805)
-- Name: clinic_locations_location_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_locations_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_locations_location_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4812 (class 0 OID 0)
-- Dependencies: 234
-- Name: clinic_locations_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_locations_location_id_seq OWNED BY public.clinic_locations.location_id;


--
-- TOC entry 243 (class 1259 OID 16882)
-- Name: clinic_medical_services; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_medical_services (
    clinic_medical_service_id integer NOT NULL,
    clinic_id integer NOT NULL,
    medical_service_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_medical_services OWNER TO "petlystAdmin";

--
-- TOC entry 242 (class 1259 OID 16881)
-- Name: clinic_medical_services_clinic_medical_service_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_medical_services_clinic_medical_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_medical_services_clinic_medical_service_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4813 (class 0 OID 0)
-- Dependencies: 242
-- Name: clinic_medical_services_clinic_medical_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_medical_services_clinic_medical_service_id_seq OWNED BY public.clinic_medical_services.clinic_medical_service_id;


--
-- TOC entry 263 (class 1259 OID 17573)
-- Name: clinic_patients; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_patients (
    id integer NOT NULL,
    clinic_id integer NOT NULL,
    pet_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_patients OWNER TO "petlystAdmin";

--
-- TOC entry 264 (class 1259 OID 17578)
-- Name: clinic_patients_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_patients_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4814 (class 0 OID 0)
-- Dependencies: 264
-- Name: clinic_patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_patients_id_seq OWNED BY public.clinic_patients.id;


--
-- TOC entry 249 (class 1259 OID 16955)
-- Name: clinic_phone_numbers; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_phone_numbers (
    id integer NOT NULL,
    clinic_id integer,
    phone_number character varying(20),
    phone_type public.phone_type_enum,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clinic_phone_numbers OWNER TO "petlystAdmin";

--
-- TOC entry 248 (class 1259 OID 16954)
-- Name: clinic_phone_numbers_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_phone_numbers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_phone_numbers_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4815 (class 0 OID 0)
-- Dependencies: 248
-- Name: clinic_phone_numbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_phone_numbers_id_seq OWNED BY public.clinic_phone_numbers.id;


--
-- TOC entry 233 (class 1259 OID 16774)
-- Name: clinic_social_media; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_social_media (
    link_id integer NOT NULL,
    clinic_id integer,
    platform character varying(50),
    url character varying(255)
);


ALTER TABLE public.clinic_social_media OWNER TO "petlystAdmin";

--
-- TOC entry 232 (class 1259 OID 16773)
-- Name: clinic_social_media_link_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_social_media_link_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_social_media_link_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4816 (class 0 OID 0)
-- Dependencies: 232
-- Name: clinic_social_media_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_social_media_link_id_seq OWNED BY public.clinic_social_media.link_id;


--
-- TOC entry 260 (class 1259 OID 17240)
-- Name: clinic_veterinarians; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinic_veterinarians (
    id integer NOT NULL,
    clinic_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    status public.clinic_veterinarian_status_enum DEFAULT 'pending'::public.clinic_veterinarian_status_enum,
    is_clinic_creator boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clinic_veterinarians OWNER TO "petlystAdmin";

--
-- TOC entry 259 (class 1259 OID 17239)
-- Name: clinic_veterinarians_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinic_veterinarians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinic_veterinarians_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4817 (class 0 OID 0)
-- Dependencies: 259
-- Name: clinic_veterinarians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_veterinarians_id_seq OWNED BY public.clinic_veterinarians.id;


--
-- TOC entry 223 (class 1259 OID 16586)
-- Name: clinicalbum_clinic_album_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinicalbum_clinic_album_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicalbum_clinic_album_photo_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4818 (class 0 OID 0)
-- Dependencies: 223
-- Name: clinicalbum_clinic_album_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinicalbum_clinic_album_photo_id_seq OWNED BY public.clinic_albums.clinic_album_photo_id;


--
-- TOC entry 228 (class 1259 OID 16642)
-- Name: reviews; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.reviews (
    clinic_review_id integer NOT NULL,
    appointment_id integer NOT NULL,
    clinic_id integer NOT NULL,
    pet_owner_id integer NOT NULL,
    pet_id integer NOT NULL,
    clinic_review_hygiene_rating double precision,
    clinic_review_stuff_behaviour_rating double precision,
    clinic_review_price_rating double precision,
    comments text,
    clinic_review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO "petlystAdmin";

--
-- TOC entry 227 (class 1259 OID 16641)
-- Name: clinicreviews_clinic_review_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinicreviews_clinic_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicreviews_clinic_review_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4819 (class 0 OID 0)
-- Dependencies: 227
-- Name: clinicreviews_clinic_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinicreviews_clinic_review_id_seq OWNED BY public.reviews.clinic_review_id;


--
-- TOC entry 222 (class 1259 OID 16570)
-- Name: clinics; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.clinics (
    clinic_id integer NOT NULL,
    clinic_name character varying(255) NOT NULL,
    clinic_email character varying(255),
    clinic_operator_id integer NOT NULL,
    clinic_description text,
    opening_time time without time zone,
    closing_time time without time zone,
    clinic_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clinic_updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clinic_verification_status public.clinic_verification_status_enum DEFAULT 'pending'::public.clinic_verification_status_enum,
    establishment_year smallint,
    establishment_month smallint,
    show_phone_number boolean,
    allow_direct_messages boolean,
    clinic_creation_status character varying(20),
    tax_identification_number character varying(10),
    veterinary_license_number character varying(10),
    show_mail_address boolean,
    allow_online_meetings boolean,
    available_days boolean[],
    emergency_available_days boolean[],
    clinic_time_slots integer,
    is_open_24_7 character varying(3),
    clinic_type public.clinic_type_enum,
    clinic_address text,
    slug character varying(255),
    CONSTRAINT clinics_establishment_month_check CHECK (((establishment_month >= 1) AND (establishment_month <= 12)))
);


ALTER TABLE public.clinics OWNER TO "petlystAdmin";

--
-- TOC entry 4820 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN clinics.slug; Type: COMMENT; Schema: public; Owner: petlystAdmin
--

COMMENT ON COLUMN public.clinics.slug IS 'Clinic SEO-friendly URL slug';


--
-- TOC entry 221 (class 1259 OID 16569)
-- Name: clinics_clinic_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.clinics_clinic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinics_clinic_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4821 (class 0 OID 0)
-- Dependencies: 221
-- Name: clinics_clinic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinics_clinic_id_seq OWNED BY public.clinics.clinic_id;


--
-- TOC entry 276 (class 1259 OID 17961)
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.diagnoses (
    diagnosis_id integer NOT NULL,
    examination_id integer NOT NULL,
    diagnosis_type character varying(20) NOT NULL,
    diagnosis_code character varying(50),
    diagnosis_name character varying(200) NOT NULL,
    description text,
    diagnosis_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    severity character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT diagnoses_diagnosis_type_check CHECK (((diagnosis_type)::text = ANY ((ARRAY['standard'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT diagnoses_severity_check CHECK (((severity)::text = ANY ((ARRAY['mild'::character varying, 'moderate'::character varying, 'severe'::character varying])::text[])))
);


ALTER TABLE public.diagnoses OWNER TO "petlystAdmin";

--
-- TOC entry 275 (class 1259 OID 17960)
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.diagnoses_diagnosis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.diagnoses_diagnosis_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4822 (class 0 OID 0)
-- Dependencies: 275
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.diagnoses_diagnosis_id_seq OWNED BY public.diagnoses.diagnosis_id;


--
-- TOC entry 229 (class 1259 OID 16701)
-- Name: emergency_contacts; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.emergency_contacts (
    pet_id integer NOT NULL,
    pet_name character varying(255) NOT NULL,
    emergency_contact_name character varying(255) NOT NULL,
    emergency_contact_phone character varying(15) NOT NULL
);


ALTER TABLE public.emergency_contacts OWNER TO "petlystAdmin";

--
-- TOC entry 274 (class 1259 OID 17933)
-- Name: examinations; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.examinations (
    examination_id integer NOT NULL,
    pet_id integer NOT NULL,
    vet_id integer NOT NULL,
    examination_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) NOT NULL,
    temperature numeric(5,2),
    heart_rate integer,
    respiratory_rate integer,
    weight numeric(6,2),
    notes text,
    appointment_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT examinations_status_check CHECK (((status)::text = ANY ((ARRAY['started'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.examinations OWNER TO "petlystAdmin";

--
-- TOC entry 273 (class 1259 OID 17932)
-- Name: examinations_examination_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.examinations_examination_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.examinations_examination_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4823 (class 0 OID 0)
-- Dependencies: 273
-- Name: examinations_examination_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.examinations_examination_id_seq OWNED BY public.examinations.examination_id;


--
-- TOC entry 266 (class 1259 OID 17613)
-- Name: inventory_categories; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.inventory_categories (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id character varying(36),
    clinic_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.inventory_categories OWNER TO "petlystAdmin";

--
-- TOC entry 267 (class 1259 OID 17631)
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.inventory_items (
    id character varying(36) NOT NULL,
    name character varying(200) NOT NULL,
    sku character varying(50),
    category_id character varying(36) NOT NULL,
    description text,
    unit_type character varying(30) NOT NULL,
    current_quantity integer DEFAULT 0,
    min_quantity integer DEFAULT 0,
    purchase_price integer,
    sale_price integer,
    location character varying(100),
    expiry_date date,
    batch_number character varying(50),
    clinic_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.inventory_items OWNER TO "petlystAdmin";

--
-- TOC entry 268 (class 1259 OID 17665)
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.inventory_transactions (
    id character varying(36) NOT NULL,
    inventory_item_id character varying(36) NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    quantity integer NOT NULL,
    unit_price integer,
    total_price integer,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    batch_number character varying(50),
    expiry_date date,
    notes text,
    performed_by_user_id character varying(36) NOT NULL,
    reference_id character varying(50),
    clinic_id character varying(36) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_transactions OWNER TO "petlystAdmin";

--
-- TOC entry 241 (class 1259 OID 16872)
-- Name: medical_services; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.medical_services (
    medical_service_id integer NOT NULL,
    service_name character varying(200) NOT NULL,
    service_category character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.medical_services OWNER TO "petlystAdmin";

--
-- TOC entry 240 (class 1259 OID 16871)
-- Name: medical_services_medical_service_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.medical_services_medical_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_services_medical_service_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4824 (class 0 OID 0)
-- Dependencies: 240
-- Name: medical_services_medical_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.medical_services_medical_service_id_seq OWNED BY public.medical_services.medical_service_id;


--
-- TOC entry 231 (class 1259 OID 16712)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.password_reset_tokens (
    reset_token_id integer NOT NULL,
    user_id integer NOT NULL,
    user_email character varying(255) NOT NULL,
    reset_code character varying(10) NOT NULL,
    reset_token_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reset_token_expires_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reset_token_is_used boolean DEFAULT false
);


ALTER TABLE public.password_reset_tokens OWNER TO "petlystAdmin";

--
-- TOC entry 230 (class 1259 OID 16711)
-- Name: password_reset_tokens_reset_token_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.password_reset_tokens_reset_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_reset_token_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4825 (class 0 OID 0)
-- Dependencies: 230
-- Name: password_reset_tokens_reset_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.password_reset_tokens_reset_token_id_seq OWNED BY public.password_reset_tokens.reset_token_id;


--
-- TOC entry 272 (class 1259 OID 17895)
-- Name: pet_hospitalizations; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.pet_hospitalizations (
    id integer NOT NULL,
    room_id integer NOT NULL,
    pet_id integer NOT NULL,
    admission_date timestamp without time zone NOT NULL,
    expected_discharge_date timestamp without time zone,
    actual_discharge_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pet_hospitalizations OWNER TO "petlystAdmin";

--
-- TOC entry 271 (class 1259 OID 17894)
-- Name: pet_hospitalizations_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.pet_hospitalizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pet_hospitalizations_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4826 (class 0 OID 0)
-- Dependencies: 271
-- Name: pet_hospitalizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.pet_hospitalizations_id_seq OWNED BY public.pet_hospitalizations.id;


--
-- TOC entry 262 (class 1259 OID 17337)
-- Name: pet_owner_favorite_clinics; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.pet_owner_favorite_clinics (
    favorite_id integer NOT NULL,
    pet_owner_id integer NOT NULL,
    clinic_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pet_owner_favorite_clinics OWNER TO "petlystAdmin";

--
-- TOC entry 261 (class 1259 OID 17336)
-- Name: pet_owner_favorite_clinics_favorite_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.pet_owner_favorite_clinics_favorite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pet_owner_favorite_clinics_favorite_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4827 (class 0 OID 0)
-- Dependencies: 261
-- Name: pet_owner_favorite_clinics_favorite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.pet_owner_favorite_clinics_favorite_id_seq OWNED BY public.pet_owner_favorite_clinics.favorite_id;


--
-- TOC entry 218 (class 1259 OID 16545)
-- Name: pet_owners; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.pet_owners (
    pet_owner_id integer NOT NULL
);


ALTER TABLE public.pet_owners OWNER TO "petlystAdmin";

--
-- TOC entry 220 (class 1259 OID 16556)
-- Name: pets; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.pets (
    pet_id integer NOT NULL,
    pet_owner_id integer NOT NULL,
    pet_name character varying(255) NOT NULL,
    pet_breed character varying(255) NOT NULL,
    pet_photo text,
    pet_gender character varying(10),
    pet_species character varying(50) NOT NULL,
    pet_birth_day integer,
    pet_birth_month integer,
    pet_birth_year integer,
    pet_birth_date date,
    chip_number character varying(15),
    CONSTRAINT pet_birth_day_check CHECK (((pet_birth_day >= 1) AND (pet_birth_day <= 31))),
    CONSTRAINT pet_birth_month_check CHECK (((pet_birth_month >= 1) AND (pet_birth_month <= 12)))
);


ALTER TABLE public.pets OWNER TO "petlystAdmin";

--
-- TOC entry 219 (class 1259 OID 16555)
-- Name: pets_pet_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.pets_pet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pets_pet_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4828 (class 0 OID 0)
-- Dependencies: 219
-- Name: pets_pet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.pets_pet_id_seq OWNED BY public.pets.pet_id;


--
-- TOC entry 277 (class 1259 OID 17979)
-- Name: standard_diagnoses; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.standard_diagnoses (
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    category character varying(100),
    species character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    diagnosis_id integer NOT NULL,
    veterinarian_id integer
);


ALTER TABLE public.standard_diagnoses OWNER TO "petlystAdmin";

--
-- TOC entry 278 (class 1259 OID 18132)
-- Name: standard_diagnoses_diagnosis_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.standard_diagnoses_diagnosis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER SEQUENCE public.standard_diagnoses_diagnosis_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4829 (class 0 OID 0)
-- Dependencies: 278
-- Name: standard_diagnoses_diagnosis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.standard_diagnoses_diagnosis_id_seq OWNED BY public.standard_diagnoses.diagnosis_id;


--
-- TOC entry 265 (class 1259 OID 17596)
-- Name: user_tokens; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.user_tokens (
    user_id integer NOT NULL,
    user_token_expo text NOT NULL
);


ALTER TABLE public.user_tokens OWNER TO "petlystAdmin";

--
-- TOC entry 216 (class 1259 OID 16518)
-- Name: users; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_type public.user_type_enum NOT NULL,
    user_name character varying(255) NOT NULL,
    user_surname character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    user_password character varying(255) NOT NULL,
    user_phone character varying(15),
    user_address text,
    user_profile_photo text,
    user_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO "petlystAdmin";

--
-- TOC entry 215 (class 1259 OID 16517)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4830 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 257 (class 1259 OID 17173)
-- Name: veterinarian_albums; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.veterinarian_albums (
    veterinarian_album_photo_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    veterinarian_album_photo_url text NOT NULL,
    veterinarian_album_photo_url_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.veterinarian_albums OWNER TO "petlystAdmin";

--
-- TOC entry 256 (class 1259 OID 17172)
-- Name: veterinarian_album_veterinarian_album_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.veterinarian_album_veterinarian_album_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.veterinarian_album_veterinarian_album_photo_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4831 (class 0 OID 0)
-- Dependencies: 256
-- Name: veterinarian_album_veterinarian_album_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_album_veterinarian_album_photo_id_seq OWNED BY public.veterinarian_albums.veterinarian_album_photo_id;


--
-- TOC entry 258 (class 1259 OID 17189)
-- Name: veterinarian_albums_veterinarian_album_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.veterinarian_albums_veterinarian_album_photo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.veterinarian_albums_veterinarian_album_photo_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4832 (class 0 OID 0)
-- Dependencies: 258
-- Name: veterinarian_albums_veterinarian_album_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_albums_veterinarian_album_photo_id_seq OWNED BY public.veterinarian_albums.veterinarian_album_photo_id;


--
-- TOC entry 253 (class 1259 OID 17104)
-- Name: veterinarian_certifications; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.veterinarian_certifications (
    certification_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    certification_name character varying(255) NOT NULL,
    issuing_organization character varying(255) NOT NULL,
    issue_date date NOT NULL,
    certification_number character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.veterinarian_certifications OWNER TO "petlystAdmin";

--
-- TOC entry 252 (class 1259 OID 17103)
-- Name: veterinarian_certifications_certification_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.veterinarian_certifications_certification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.veterinarian_certifications_certification_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4833 (class 0 OID 0)
-- Dependencies: 252
-- Name: veterinarian_certifications_certification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_certifications_certification_id_seq OWNED BY public.veterinarian_certifications.certification_id;


--
-- TOC entry 251 (class 1259 OID 17083)
-- Name: veterinarian_education; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.veterinarian_education (
    education_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    school_name character varying(255) NOT NULL,
    field_of_study character varying(255) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.veterinarian_education OWNER TO "petlystAdmin";

--
-- TOC entry 250 (class 1259 OID 17082)
-- Name: veterinarian_education_education_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.veterinarian_education_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.veterinarian_education_education_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4834 (class 0 OID 0)
-- Dependencies: 250
-- Name: veterinarian_education_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_education_education_id_seq OWNED BY public.veterinarian_education.education_id;


--
-- TOC entry 255 (class 1259 OID 17124)
-- Name: veterinarian_expertise; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.veterinarian_expertise (
    expertise_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    expertise_area character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.veterinarian_expertise OWNER TO "petlystAdmin";

--
-- TOC entry 254 (class 1259 OID 17123)
-- Name: veterinarian_expertise_expertise_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.veterinarian_expertise_expertise_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.veterinarian_expertise_expertise_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4835 (class 0 OID 0)
-- Dependencies: 254
-- Name: veterinarian_expertise_expertise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_expertise_expertise_id_seq OWNED BY public.veterinarian_expertise.expertise_id;


--
-- TOC entry 217 (class 1259 OID 16530)
-- Name: veterinarians; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.veterinarians (
    veterinarian_id integer NOT NULL,
    veterinarian_graduate_barcode text,
    veterinarian_verification_status public.veterinarian_verification_status_enum DEFAULT 'not_verified'::public.veterinarian_verification_status_enum,
    veterinarian_tc_number text,
    veterinarian_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    veterinarian_updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    biography text,
    preferred_languages character varying(100)[],
    is_profile_public boolean DEFAULT false NOT NULL,
    slug character varying(255)
);


ALTER TABLE public.veterinarians OWNER TO "petlystAdmin";

--
-- TOC entry 4370 (class 2604 OID 16905)
-- Name: additional_services additional_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services ALTER COLUMN additional_service_id SET DEFAULT nextval('public.additional_services_additional_service_id_seq'::regclass);


--
-- TOC entry 4362 (class 2604 OID 16845)
-- Name: animal_types animal_type_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types ALTER COLUMN animal_type_id SET DEFAULT nextval('public.animal_types_animal_type_id_seq'::regclass);


--
-- TOC entry 4349 (class 2604 OID 16605)
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- TOC entry 4372 (class 2604 OID 16917)
-- Name: clinic_additional_services clinic_additional_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services ALTER COLUMN clinic_additional_service_id SET DEFAULT nextval('public.clinic_additional_services_clinic_additional_service_id_seq'::regclass);


--
-- TOC entry 4347 (class 2604 OID 16590)
-- Name: clinic_albums clinic_album_photo_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums ALTER COLUMN clinic_album_photo_id SET DEFAULT nextval('public.clinicalbum_clinic_album_photo_id_seq'::regclass);


--
-- TOC entry 4364 (class 2604 OID 16855)
-- Name: clinic_animal_types clinic_animal_type_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types ALTER COLUMN clinic_animal_type_id SET DEFAULT nextval('public.clinic_animal_types_clinic_animal_type_id_seq'::regclass);


--
-- TOC entry 4406 (class 2604 OID 17881)
-- Name: clinic_hospitalization_rooms id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_hospitalization_rooms ALTER COLUMN id SET DEFAULT nextval('public.clinic_hospitalization_rooms_id_seq'::regclass);


--
-- TOC entry 4361 (class 2604 OID 16809)
-- Name: clinic_locations location_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations ALTER COLUMN location_id SET DEFAULT nextval('public.clinic_locations_location_id_seq'::regclass);


--
-- TOC entry 4368 (class 2604 OID 16885)
-- Name: clinic_medical_services clinic_medical_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services ALTER COLUMN clinic_medical_service_id SET DEFAULT nextval('public.clinic_medical_services_clinic_medical_service_id_seq'::regclass);


--
-- TOC entry 4393 (class 2604 OID 17579)
-- Name: clinic_patients id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_patients ALTER COLUMN id SET DEFAULT nextval('public.clinic_patients_id_seq'::regclass);


--
-- TOC entry 4374 (class 2604 OID 16958)
-- Name: clinic_phone_numbers id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers ALTER COLUMN id SET DEFAULT nextval('public.clinic_phone_numbers_id_seq'::regclass);


--
-- TOC entry 4360 (class 2604 OID 16777)
-- Name: clinic_social_media link_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media ALTER COLUMN link_id SET DEFAULT nextval('public.clinic_social_media_link_id_seq'::regclass);


--
-- TOC entry 4386 (class 2604 OID 17243)
-- Name: clinic_veterinarians id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_veterinarians ALTER COLUMN id SET DEFAULT nextval('public.clinic_veterinarians_id_seq'::regclass);


--
-- TOC entry 4343 (class 2604 OID 16573)
-- Name: clinics clinic_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics ALTER COLUMN clinic_id SET DEFAULT nextval('public.clinics_clinic_id_seq'::regclass);


--
-- TOC entry 4417 (class 2604 OID 17964)
-- Name: diagnoses diagnosis_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.diagnoses ALTER COLUMN diagnosis_id SET DEFAULT nextval('public.diagnoses_diagnosis_id_seq'::regclass);


--
-- TOC entry 4413 (class 2604 OID 17936)
-- Name: examinations examination_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.examinations ALTER COLUMN examination_id SET DEFAULT nextval('public.examinations_examination_id_seq'::regclass);


--
-- TOC entry 4366 (class 2604 OID 16875)
-- Name: medical_services medical_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services ALTER COLUMN medical_service_id SET DEFAULT nextval('public.medical_services_medical_service_id_seq'::regclass);


--
-- TOC entry 4356 (class 2604 OID 16715)
-- Name: password_reset_tokens reset_token_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN reset_token_id SET DEFAULT nextval('public.password_reset_tokens_reset_token_id_seq'::regclass);


--
-- TOC entry 4410 (class 2604 OID 17898)
-- Name: pet_hospitalizations id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_hospitalizations ALTER COLUMN id SET DEFAULT nextval('public.pet_hospitalizations_id_seq'::regclass);


--
-- TOC entry 4391 (class 2604 OID 17340)
-- Name: pet_owner_favorite_clinics favorite_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owner_favorite_clinics ALTER COLUMN favorite_id SET DEFAULT nextval('public.pet_owner_favorite_clinics_favorite_id_seq'::regclass);


--
-- TOC entry 4342 (class 2604 OID 16559)
-- Name: pets pet_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets ALTER COLUMN pet_id SET DEFAULT nextval('public.pets_pet_id_seq'::regclass);


--
-- TOC entry 4354 (class 2604 OID 16645)
-- Name: reviews clinic_review_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews ALTER COLUMN clinic_review_id SET DEFAULT nextval('public.clinicreviews_clinic_review_id_seq'::regclass);


--
-- TOC entry 4422 (class 2604 OID 18133)
-- Name: standard_diagnoses diagnosis_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.standard_diagnoses ALTER COLUMN diagnosis_id SET DEFAULT nextval('public.standard_diagnoses_diagnosis_id_seq'::regclass);


--
-- TOC entry 4335 (class 2604 OID 16521)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4384 (class 2604 OID 17190)
-- Name: veterinarian_albums veterinarian_album_photo_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_albums ALTER COLUMN veterinarian_album_photo_id SET DEFAULT nextval('public.veterinarian_albums_veterinarian_album_photo_id_seq'::regclass);


--
-- TOC entry 4380 (class 2604 OID 17107)
-- Name: veterinarian_certifications certification_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications ALTER COLUMN certification_id SET DEFAULT nextval('public.veterinarian_certifications_certification_id_seq'::regclass);


--
-- TOC entry 4377 (class 2604 OID 17086)
-- Name: veterinarian_education education_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education ALTER COLUMN education_id SET DEFAULT nextval('public.veterinarian_education_education_id_seq'::regclass);


--
-- TOC entry 4382 (class 2604 OID 17127)
-- Name: veterinarian_expertise expertise_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise ALTER COLUMN expertise_id SET DEFAULT nextval('public.veterinarian_expertise_expertise_id_seq'::regclass);


--
-- TOC entry 4767 (class 0 OID 16902)
-- Dependencies: 245
-- Data for Name: additional_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.additional_services (additional_service_id, service_name, service_description, created_at) FROM stdin;
1	Grooming	Professional pet grooming services	2025-03-10 23:08:27.54852
2	Boarding	Overnight pet care facilities	2025-03-10 23:08:27.54852
3	Pet Hotel	Extended pet boarding with luxury amenities	2025-03-10 23:08:27.54852
4	Pet Training	Behavior training and obedience classes	2025-03-10 23:08:27.54852
5	Pet Transportation	Pet pickup and delivery services	2025-03-10 23:08:27.54852
6	Home Visits	Veterinary services provided at your home	2025-03-10 23:08:27.54852
7	Nutritional Counseling	Diet and nutrition advice for pets	2025-03-10 23:08:27.54852
8	Pet Adoption Services	Helping pets find new homes	2025-03-10 23:08:27.54852
9	Microchipping	Pet identification and tracking	2025-03-10 23:08:27.54852
10	Pet Insurance Assistance	Help with pet insurance paperwork and claims	2025-03-10 23:08:27.54852
11	Online Consultations	Remote veterinary consultations	2025-03-10 23:08:27.54852
13	Online Consultation	\N	2025-03-15 23:58:23.816057
14	Pet Adoption	\N	2025-03-19 18:14:01.354894
15	Pet Insurance	\N	2025-03-19 18:28:32.395103
16	Pet Food & Supplies	\N	2025-03-20 14:47:22.840753
17	Pet Daycare	\N	2025-03-28 13:55:00.61498
\.


--
-- TOC entry 4759 (class 0 OID 16842)
-- Dependencies: 237
-- Data for Name: animal_types; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.animal_types (animal_type_id, animal_type_name, created_at) FROM stdin;
1	Dog	2025-03-10 23:07:36.284075
2	Cat	2025-03-10 23:07:36.284075
3	Bird	2025-03-10 23:07:36.284075
4	Small Mammals	2025-03-10 23:07:36.284075
5	Reptiles	2025-03-10 23:07:36.284075
6	Farm Animals	2025-03-10 23:07:36.284075
7	Exotic Animals	2025-03-10 23:07:36.284075
8	Fish	2025-03-10 23:07:36.284075
9	Amphibians	2025-03-10 23:07:36.284075
10	Insects	2025-03-10 23:07:36.284075
11	Dogs	2025-03-13 09:15:14.826187
12	Cats	2025-03-13 09:15:14.826187
13	Birds	2025-03-13 09:15:14.826187
14	Rodents	2025-03-16 00:14:24.836114
15	Rabbits	2025-03-19 12:57:06.578774
16	Horses	2025-03-19 17:47:11.205838
17	Ferrets	2025-03-19 18:14:01.354894
18	Exotic Pets	2025-03-19 19:52:31.775588
\.


--
-- TOC entry 4748 (class 0 OID 16602)
-- Dependencies: 226
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.appointments (appointment_id, video_meeting, pet_id, meeting_url, appointment_start_hour, appointment_status, notes, appointment_end_hour, meeting_password, appointment_date, clinic_id, pet_owner_id, created_at, updated_at) FROM stdin;
91	t	86	Room-ID-444-115-088-623-242	2025-05-05 11:30:00	canceled		2025-05-05 12:00:00	\N	2025-05-05	75	23	2025-05-04 15:20:52.332536	2025-05-04 15:20:52.332536
79	t	83	Room-ID-653-976-090-107-703	2025-05-04 05:40:00	completed	Gjh	2025-05-04 07:00:00	\N	2025-05-04	74	23	2025-05-01 20:55:33.314675	2025-05-01 20:55:33.314675
104	t	86	Room-ID-344-901-247-827-066	2025-05-06 11:30:00	canceled		2025-05-06 12:00:00	\N	2025-05-06	75	23	2025-05-05 14:30:56.386402	2025-05-05 14:31:40.632244
92	t	83	Room-ID-551-696-783-546-902	2025-05-05 11:00:00	canceled		2025-05-05 11:30:00	\N	2025-05-05	75	23	2025-05-04 15:21:34.465614	2025-05-04 15:21:34.465614
76	f	59	Room-ID-706-282-886-495-165	2025-05-01 20:00:00	completed	Onur Hera Randevu Request Desktop Anal Sonda Takımı 	2025-05-01 20:20:00	\N	2025-05-01	74	43	2025-05-01 13:45:24.619023	2025-05-01 13:45:24.619023
93	t	83	Room-ID-439-794-151-756-561	2025-05-05 18:20:00	confirmed		2025-05-05 18:40:00	\N	2025-05-04	74	23	2025-05-04 15:23:21.837732	2025-05-04 15:23:21.837732
75	f	59	\N	2025-04-30 16:00:00	canceled	Hera - 30 April - Eryaman - New Column Data Check	2025-04-30 16:30:00	\N	2025-04-30	75	43	2025-04-30 11:03:08.745085	2025-04-30 11:05:20.338324
87	f	89	Room-ID-374-801-213-975-095	2025-05-04 10:00:00	canceled	10.00	2025-05-04 10:30:00	\N	2025-05-04	79	54	2025-05-03 19:15:28.186905	2025-05-05 11:11:08.509304
105	t	83	Room-ID-527-611-179-022-930	2025-05-06 11:30:00	confirmed		2025-05-06 12:00:00	\N	2025-05-06	75	23	2025-05-05 14:32:10.637414	2025-05-05 14:32:44.928478
70	f	59	\N	2025-04-29 16:30:00	completed	Hera - 16:30 - 29 April - Eryaman	2025-04-29 17:00:00	\N	2025-04-29	75	43	2025-04-30 10:57:29.131982	2025-05-04 21:40:39.637256
94	t	83	Room-ID-803-324-393-230-650	2025-05-05 14:40:00	confirmed		2025-05-05 15:00:00	\N	2025-05-05	74	23	2025-05-04 22:15:12.873083	2025-05-04 22:15:12.873083
85	f	89	Room-ID-244-827-704-944-087	2025-05-05 11:00:00	canceled	Ben eko geliyorum	2025-05-05 12:00:00	\N	2025-05-05	80	54	2025-05-03 19:10:51.613986	2025-05-04 11:39:40.59
90	t	86	Room-ID-758-044-424-817-320	2025-05-04 14:00:00	completed	Xxx	2025-05-04 14:20:00	\N	2025-05-04	74	23	2025-05-04 10:57:46.615672	2025-05-04 11:39:40.654
84	f	65	Room-ID-204-406-947-733-321	2025-05-04 12:00:00	completed	Pablo - 12:00 - 4 May - Eryaman	2025-05-04 12:30:00	\N	2025-05-04	75	51	2025-05-03 14:49:10.455211	2025-05-04 11:39:40.718
97	f	83	Room-ID-219-516-958-004-146	2025-05-05 13:40:00	canceled		2025-05-05 14:00:00	\N	2025-05-05	74	23	2025-05-04 22:29:32.677321	2025-05-04 22:29:32.677321
98	t	83	Room-ID-270-621-620-140-786	2025-05-07 10:00:00	confirmed		2025-05-07 10:20:00	\N	2025-05-07	74	23	2025-05-04 22:39:57.137022	2025-05-04 22:39:57.137022
83	f	59	Room-ID-682-673-379-558-086	2025-05-04 11:30:00	canceled	Hera - 11:30 - 4 May - Eryaman	2025-05-04 12:00:00	\N	2025-05-04	75	43	2025-05-03 14:48:03.977914	2025-05-04 11:39:40.772
86	t	89	Room-ID-569-484-414-732-703	2025-05-04 10:20:00	canceled	geliyorum\n	2025-05-04 10:40:00	\N	2025-05-04	78	54	2025-05-03 19:14:35.933944	2025-05-04 11:39:40.825
95	t	83	Room-ID-534-484-023-931-129	2025-05-05 12:00:00	completed		2025-05-05 12:20:00	\N	2025-05-05	74	23	2025-05-04 22:28:38.724575	2025-05-04 22:28:38.724575
96	f	83	Room-ID-948-547-774-415-363	2025-05-05 13:40:00	completed		2025-05-05 14:00:00	\N	2025-05-05	74	23	2025-05-04 22:29:21.196307	2025-05-04 22:29:21.196307
88	f	89	Room-ID-256-777-493-418-340	2025-05-04 10:00:00	pending	10.00	2025-05-04 10:20:00	\N	2025-05-04	78	54	2025-05-03 19:15:42.504988	2025-05-04 11:39:40.936
82	f	65	Room-ID-489-307-790-926-502	2025-05-03 18:00:00	completed	Pablo - Saraçhane - 3 May - 18:00	2025-05-03 18:20:00	\N	2025-05-03	74	51	2025-05-03 11:40:21.749744	2025-05-04 11:39:40.993
78	t	83	Room-ID-090-494-237-129-300	2025-05-01 12:30:00	canceled	Updated from PostgreSQL at 2025-05-02T08:00:00.016Z	2025-05-01 13:00:00	\N	2025-05-01	76	23	2025-05-01 20:54:34.286477	2025-05-04 11:39:41.046
71	f	59	\N	2025-04-30 14:00:00	completed	Hera - 14:00 - 30 April - Saraçhane	2025-04-30 14:20:00	\N	2025-04-30	74	43	2025-04-30 10:57:29.131982	2025-05-04 11:39:41.099
101	f	86	Room-ID-611-221-847-133-380	2025-05-09 10:20:00	pending		2025-05-09 10:40:00	\N	2025-05-09	74	23	2025-05-04 22:53:13.196765	2025-05-04 22:53:13.196765
102	f	83	Room-ID-564-436-106-383-565	2025-05-09 13:40:00	pending		2025-05-09 14:00:00	\N	2025-05-09	74	23	2025-05-04 22:53:41.785154	2025-05-04 22:53:41.785154
103	t	86	Room-ID-434-831-908-783-058	2025-05-10 14:00:00	pending		2025-05-10 14:20:00	\N	2025-05-10	74	23	2025-05-04 22:53:57.413191	2025-05-04 22:53:57.413191
77	f	59	Room-ID-379-057-902-599-219	2025-05-02 16:20:00	canceled	Bu da 2 Mayıs için olan randevu	2025-05-02 16:40:00	\N	2025-05-02	74	43	2025-05-01 13:47:36.068262	2025-05-04 11:40:13.589
100	f	86	Room-ID-664-231-191-796-957	2025-05-09 10:00:00	canceled		2025-05-09 10:20:00	\N	2025-05-09	74	23	2025-05-04 22:49:10.551042	2025-05-04 22:49:10.551042
99	f	86	Room-ID-251-499-340-971-667	2025-05-05 10:40:00	completed		2025-05-05 11:00:00	\N	2025-05-05	74	23	2025-05-04 22:47:33.693041	2025-05-04 22:47:33.693041
\.


--
-- TOC entry 4769 (class 0 OID 16914)
-- Dependencies: 247
-- Data for Name: clinic_additional_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_additional_services (clinic_additional_service_id, clinic_id, additional_service_id, created_at) FROM stdin;
138	78	1	2025-04-06 17:12:53.998044
139	78	5	2025-04-06 17:12:53.998044
140	78	16	2025-04-06 17:12:53.998044
141	78	2	2025-04-06 17:12:53.998044
142	78	6	2025-04-06 17:12:53.998044
143	78	17	2025-04-06 17:12:53.998044
144	78	4	2025-04-06 17:12:53.998044
145	79	1	2025-04-06 17:26:24.06476
146	79	5	2025-04-06 17:26:24.06476
147	79	14	2025-04-06 17:26:24.06476
148	79	2	2025-04-06 17:26:24.06476
149	79	17	2025-04-06 17:26:24.06476
150	79	9	2025-04-06 17:26:24.06476
151	80	1	2025-04-26 17:26:49.877203
152	80	5	2025-04-26 17:26:49.877203
153	80	16	2025-04-26 17:26:49.877203
154	80	14	2025-04-26 17:26:49.877203
155	80	2	2025-04-26 17:26:49.877203
156	80	17	2025-04-26 17:26:49.877203
157	80	6	2025-04-26 17:26:49.877203
158	80	9	2025-04-26 17:26:49.877203
101	74	1	2025-03-25 11:07:54.748749
102	74	2	2025-03-25 11:07:54.748749
103	74	3	2025-03-25 11:07:54.748749
104	74	4	2025-03-25 11:07:54.748749
105	74	5	2025-03-25 11:07:54.748749
106	74	6	2025-03-25 11:07:54.748749
107	74	11	2025-03-25 11:07:54.748749
108	75	1	2025-03-28 13:55:00.61498
109	75	2	2025-03-28 13:55:00.61498
110	75	17	2025-03-28 13:55:00.61498
111	75	14	2025-03-28 13:55:00.61498
112	75	5	2025-03-28 13:55:00.61498
113	75	4	2025-03-28 13:55:00.61498
114	75	16	2025-03-28 13:55:00.61498
115	75	9	2025-03-28 13:55:00.61498
116	76	2	2025-04-06 16:32:59.232874
117	76	17	2025-04-06 16:32:59.232874
118	76	4	2025-04-06 16:32:59.232874
119	76	9	2025-04-06 16:32:59.232874
120	76	6	2025-04-06 16:32:59.232874
121	76	14	2025-04-06 16:32:59.232874
122	76	16	2025-04-06 16:32:59.232874
\.


--
-- TOC entry 4746 (class 0 OID 16587)
-- Dependencies: 224
-- Data for Name: clinic_albums; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_albums (clinic_album_photo_id, clinic_id, clinic_album_photo_url, clinic_album_photo_url_created_at, clinic_type) FROM stdin;
46	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948775.jpg	2025-04-05 23:15:48.34082	animal_hospital
47	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948814.jpg	2025-04-05 23:15:48.381209	animal_hospital
48	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948797.jpg	2025-04-05 23:15:48.417515	animal_hospital
49	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948871.jpg	2025-04-05 23:15:48.524073	animal_hospital
50	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948848.jpg	2025-04-05 23:15:48.554236	animal_hospital
40	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105048.jpg	2025-03-28 13:55:04.749703	animal_hospital
41	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105503.jpg	2025-03-28 13:55:05.305211	animal_hospital
42	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105542.jpg	2025-03-28 13:55:05.442929	animal_hospital
43	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105530.jpg	2025-03-28 13:55:05.474486	animal_hospital
44	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105559.jpg	2025-03-28 13:55:05.480284	animal_hospital
45	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105516.jpg	2025-03-28 13:55:05.502147	animal_hospital
51	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894948831.jpg	2025-04-05 23:15:48.655716	animal_hospital
52	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894949415.jpg	2025-04-05 23:15:48.982558	animal_hospital
53	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894949501.jpg	2025-04-05 23:15:49.051549	animal_hospital
54	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894949453.jpg	2025-04-05 23:15:49.172542	animal_hospital
55	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-animal-hospital/1743894949641.jpg	2025-04-05 23:15:49.375067	animal_hospital
56	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957181642.png	2025-04-06 16:33:03.646078	veterinary_clinic
57	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957181663.png	2025-04-06 16:33:03.713611	veterinary_clinic
58	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957182182.png	2025-04-06 16:33:04.223013	veterinary_clinic
59	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957182142.png	2025-04-06 16:33:04.234594	veterinary_clinic
60	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957182163.png	2025-04-06 16:33:04.30656	veterinary_clinic
61	76	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/76-vetica-veterinary-clinic/1743957182199.png	2025-04-06 16:33:04.370035	veterinary_clinic
63	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959119666.png	2025-04-06 17:05:17.417878	veterinary_clinic
64	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959527814.png	2025-04-06 17:12:08.911652	veterinary_clinic
65	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959528330.png	2025-04-06 17:12:09.406082	veterinary_clinic
66	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959528372.png	2025-04-06 17:12:09.435862	veterinary_clinic
67	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959528308.png	2025-04-06 17:12:09.404959	veterinary_clinic
68	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959528393.png	2025-04-06 17:12:09.437158	veterinary_clinic
69	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959528350.png	2025-04-06 17:12:09.432256	veterinary_clinic
70	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959529069.png	2025-04-06 17:12:10.125794	veterinary_clinic
71	78	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/78-petworks-veterinary-clinic/1743959529546.png	2025-04-06 17:12:10.64656	veterinary_clinic
72	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387067.png	2025-04-06 17:26:29.063116	veterinary_clinic
73	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387089.png	2025-04-06 17:26:29.108497	veterinary_clinic
74	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387105.png	2025-04-06 17:26:29.162165	veterinary_clinic
75	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387554.png	2025-04-06 17:26:29.467583	veterinary_clinic
76	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387492.png	2025-04-06 17:26:29.478316	veterinary_clinic
77	79	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/79-novavet-veterinary-clinic/1743960387536.png	2025-04-06 17:26:29.597841	veterinary_clinic
78	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688414524.png	2025-04-26 17:26:55.670512	veterinary_clinic
79	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688414603.png	2025-04-26 17:26:55.688892	veterinary_clinic
80	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688414582.png	2025-04-26 17:26:55.753972	veterinary_clinic
81	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688414959.png	2025-04-26 17:26:56.106529	veterinary_clinic
82	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688415003.png	2025-04-26 17:26:56.130383	veterinary_clinic
83	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688414984.png	2025-04-26 17:26:56.217995	veterinary_clinic
84	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688415715.png	2025-04-26 17:26:56.843107	veterinary_clinic
85	80	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/80-erdem-ege-veterinary-clinic/1745688415689.png	2025-04-26 17:26:56.895179	veterinary_clinic
\.


--
-- TOC entry 4761 (class 0 OID 16852)
-- Dependencies: 239
-- Data for Name: clinic_animal_types; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_animal_types (clinic_animal_type_id, clinic_id, animal_type_id, created_at) FROM stdin;
133	79	11	2025-04-06 17:26:24.06476
134	79	12	2025-04-06 17:26:24.06476
135	79	13	2025-04-06 17:26:24.06476
136	79	15	2025-04-06 17:26:24.06476
137	79	14	2025-04-06 17:26:24.06476
138	79	6	2025-04-06 17:26:24.06476
139	79	16	2025-04-06 17:26:24.06476
140	80	11	2025-04-26 17:26:49.877203
141	80	13	2025-04-26 17:26:49.877203
142	80	12	2025-04-26 17:26:49.877203
143	80	15	2025-04-26 17:26:49.877203
144	80	9	2025-04-26 17:26:49.877203
145	80	5	2025-04-26 17:26:49.877203
146	80	17	2025-04-26 17:26:49.877203
147	80	14	2025-04-26 17:26:49.877203
148	80	8	2025-04-26 17:26:49.877203
93	74	2	2025-03-25 11:07:54.748749
94	74	3	2025-03-25 11:07:54.748749
95	74	7	2025-03-25 11:07:54.748749
96	74	8	2025-03-25 11:07:54.748749
97	74	11	2025-03-25 11:07:54.748749
98	74	12	2025-03-25 11:07:54.748749
99	74	13	2025-03-25 11:07:54.748749
100	74	15	2025-03-25 11:07:54.748749
101	74	17	2025-03-25 11:07:54.748749
102	74	1	2025-03-25 11:07:54.748749
103	75	11	2025-03-28 13:55:00.61498
104	75	12	2025-03-28 13:55:00.61498
105	75	13	2025-03-28 13:55:00.61498
106	75	15	2025-03-28 13:55:00.61498
107	76	11	2025-04-06 16:32:59.232874
108	76	12	2025-04-06 16:32:59.232874
109	76	13	2025-04-06 16:32:59.232874
110	76	15	2025-04-06 16:32:59.232874
111	76	6	2025-04-06 16:32:59.232874
112	76	14	2025-04-06 16:32:59.232874
125	78	6	2025-04-06 17:12:53.998044
126	78	11	2025-04-06 17:12:53.998044
127	78	12	2025-04-06 17:12:53.998044
128	78	13	2025-04-06 17:12:53.998044
129	78	14	2025-04-06 17:12:53.998044
130	78	15	2025-04-06 17:12:53.998044
131	78	3	2025-04-06 17:12:53.998044
132	78	2	2025-04-06 17:12:53.998044
\.


--
-- TOC entry 4792 (class 0 OID 17878)
-- Dependencies: 270
-- Data for Name: clinic_hospitalization_rooms; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_hospitalization_rooms (id, clinic_id, room_name, room_type, room_status, created_at, updated_at) FROM stdin;
4	75	ICU 1	intensive_care	maintenance	2025-05-03 11:07:07.083138	2025-05-03 11:43:30.189352
5	75	Isolation 1	isolation	vacant	2025-05-03 11:43:46.470639	2025-05-03 11:43:46.470639
3	75	Observation 1	observation	occupied	2025-05-02 21:47:56.912308	2025-05-03 16:05:41.931968
6	74	ICU 1	intensive_care	occupied	2025-05-03 17:04:25.949809	2025-05-03 17:04:49.719685
\.


--
-- TOC entry 4757 (class 0 OID 16806)
-- Dependencies: 235
-- Data for Name: clinic_locations; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_locations (location_id, clinic_id, province, district, clinic_address, latitude, longitude) FROM stdin;
49	75	Ankara	Etimesgut	Şehit Osman Avcı, 45. Sk. No:2, 06820 Etimesgut/Ankara, Türkiye	39.9783281	32.6492646
50	76	Ankara	Çankaya	Bahçelievler, 36. Sk. No:15/1, 06490 Bahçelievler/Ankara, Türkiye	39.9266619	32.8258076
53	79	Ankara	Çankaya	İşçi Blokları, 1506. Cd. No:26, 06530 Çankaya/Ankara, Türkiye	39.8900888	32.8041675
48	74	Ankara	Çankaya	Ön Cebeci, Umut Sk. No:6, 06590 Çankaya/Ankara, Türkiye	39.9258639	32.8664377
54	80	Ankara	Etimesgut	Alsancak, 2127. Sk. No:8, 06790 Etimesgut/Ankara, Türkiye	39.9381385	32.6543930
52	78	İstanbul	Kadıköy	Oğuzlar, 1388. Sk. No:15, 06520 Çankaya/Ankara, Türkiye	39.9048307	32.8184476
\.


--
-- TOC entry 4765 (class 0 OID 16882)
-- Dependencies: 243
-- Data for Name: clinic_medical_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_medical_services (clinic_medical_service_id, clinic_id, medical_service_id, created_at) FROM stdin;
143	78	16	2025-04-06 17:12:53.998044
144	78	5	2025-04-06 17:12:53.998044
145	78	11	2025-04-06 17:12:53.998044
146	78	15	2025-04-06 17:12:53.998044
147	78	21	2025-04-06 17:12:53.998044
148	78	23	2025-04-06 17:12:53.998044
149	78	22	2025-04-06 17:12:53.998044
150	78	24	2025-04-06 17:12:53.998044
151	78	6	2025-04-06 17:12:53.998044
152	79	16	2025-04-06 17:26:24.06476
153	79	17	2025-04-06 17:26:24.06476
154	79	4	2025-04-06 17:26:24.06476
155	79	3	2025-04-06 17:26:24.06476
156	79	19	2025-04-06 17:26:24.06476
157	79	7	2025-04-06 17:26:24.06476
158	79	6	2025-04-06 17:26:24.06476
159	79	5	2025-04-06 17:26:24.06476
160	79	11	2025-04-06 17:26:24.06476
161	80	16	2025-04-26 17:26:49.877203
162	80	5	2025-04-26 17:26:49.877203
163	80	11	2025-04-26 17:26:49.877203
164	80	21	2025-04-26 17:26:49.877203
165	80	15	2025-04-26 17:26:49.877203
166	80	22	2025-04-26 17:26:49.877203
167	80	24	2025-04-26 17:26:49.877203
168	80	6	2025-04-26 17:26:49.877203
97	74	1	2025-03-25 11:07:54.748749
98	74	2	2025-03-25 11:07:54.748749
99	74	16	2025-03-25 11:07:54.748749
100	74	17	2025-03-25 11:07:54.748749
101	74	18	2025-03-25 11:07:54.748749
102	74	24	2025-03-25 11:07:54.748749
103	75	16	2025-03-28 13:55:00.61498
104	75	17	2025-03-28 13:55:00.61498
105	75	3	2025-03-28 13:55:00.61498
106	75	7	2025-03-28 13:55:00.61498
107	75	14	2025-03-28 13:55:00.61498
108	75	24	2025-03-28 13:55:00.61498
109	75	6	2025-03-28 13:55:00.61498
110	75	5	2025-03-28 13:55:00.61498
111	75	11	2025-03-28 13:55:00.61498
112	75	18	2025-03-28 13:55:00.61498
113	75	19	2025-03-28 13:55:00.61498
114	75	13	2025-03-28 13:55:00.61498
115	75	20	2025-03-28 13:55:00.61498
116	76	16	2025-04-06 16:32:59.232874
117	76	17	2025-04-06 16:32:59.232874
118	76	3	2025-04-06 16:32:59.232874
119	76	20	2025-04-06 16:32:59.232874
120	76	11	2025-04-06 16:32:59.232874
121	76	14	2025-04-06 16:32:59.232874
122	76	7	2025-04-06 16:32:59.232874
123	76	4	2025-04-06 16:32:59.232874
124	76	21	2025-04-06 16:32:59.232874
\.


--
-- TOC entry 4785 (class 0 OID 17573)
-- Dependencies: 263
-- Data for Name: clinic_patients; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_patients (id, clinic_id, pet_id, created_at, updated_at) FROM stdin;
2	74	59	2025-04-30 14:34:57.39862	2025-04-30 14:34:57.39862
4	75	65	2025-05-03 14:50:21.074533	2025-05-03 14:50:21.074533
3	75	59	2025-05-03 14:50:20.085823	2025-05-04 21:40:39.755962
5	75	83	2025-05-05 14:32:45.081646	2025-05-05 14:32:45.081646
\.


--
-- TOC entry 4771 (class 0 OID 16955)
-- Dependencies: 249
-- Data for Name: clinic_phone_numbers; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_phone_numbers (id, clinic_id, phone_number, phone_type, created_at, updated_at) FROM stdin;
61	80	55555555555	fixed_line	2025-04-26 17:26:49.877203	2025-04-26 17:26:49.877203
49	75	01234567891	mobile_number	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
50	75	11242385920	fixed_line	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
51	75	01234723453	mobile_number	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
52	76	05452901525	mobile_number	2025-04-06 16:32:59.232874	2025-04-06 16:32:59.232874
53	76	03122808466	fixed_line	2025-04-06 16:32:59.232874	2025-04-06 16:32:59.232874
56	78	05452901525	mobile_number	2025-04-06 17:05:17.417878	2025-04-06 17:05:17.417878
57	79	05452901525	mobile_number	2025-04-06 17:26:24.06476	2025-04-06 17:26:24.06476
59	74	00000000000	fixed_line	2025-04-07 14:28:38.314291	2025-04-07 14:28:38.314291
60	74	05452901525	mobile_number	2025-04-07 14:28:38.314291	2025-04-07 14:28:38.314291
\.


--
-- TOC entry 4755 (class 0 OID 16774)
-- Dependencies: 233
-- Data for Name: clinic_social_media; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_social_media (link_id, clinic_id, platform, url) FROM stdin;
27	75	Facebook	www.facebook.com
28	75	Instagram	www.instagram.com
29	75	Twitter	www.twitter.com
30	75	LinkedIn	www.linkedin.com
31	76	Facebook	www.facebook.com
32	76	Twitter	www.twitter.com
33	76	Instagram	www.instagram.com
35	74	instagram	https://www.instagram.com
36	74	facebook	https://www.facebook.com
37	74	twitter	https://www.x.com
\.


--
-- TOC entry 4782 (class 0 OID 17240)
-- Dependencies: 260
-- Data for Name: clinic_veterinarians; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_veterinarians (id, clinic_id, veterinarian_id, status, is_clinic_creator, created_at, updated_at) FROM stdin;
1	74	25	approved	t	2025-04-01 13:58:09.984236	2025-04-01 13:58:09.984236
2	75	27	approved	t	2025-04-01 13:58:09.984236	2025-04-01 13:58:09.984236
12	74	33	approved	f	2025-04-01 19:16:08.141174	2025-04-01 19:16:08.141174
13	74	34	approved	f	2025-04-03 19:22:19.533431	2025-04-03 21:23:26.279089
15	76	36	approved	t	2025-04-06 17:19:23.671395	2025-04-06 17:19:23.671395
16	78	37	approved	t	2025-04-06 17:19:24.829411	2025-04-06 17:19:24.829411
18	79	38	approved	t	2025-04-06 17:26:24.06476	2025-04-06 17:26:24.06476
19	74	39	approved	f	2025-04-08 11:12:38.610356	2025-04-08 11:14:45.185363
20	74	40	approved	f	2025-04-08 12:08:54.413354	2025-04-08 12:09:46.53485
23	80	50	approved	t	2025-04-26 17:26:49.877203	2025-04-26 17:26:49.877203
\.


--
-- TOC entry 4744 (class 0 OID 16570)
-- Dependencies: 222
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinics (clinic_id, clinic_name, clinic_email, clinic_operator_id, clinic_description, opening_time, closing_time, clinic_created_at, clinic_updated_at, clinic_verification_status, establishment_year, establishment_month, show_phone_number, allow_direct_messages, clinic_creation_status, tax_identification_number, veterinary_license_number, show_mail_address, allow_online_meetings, available_days, emergency_available_days, clinic_time_slots, is_open_24_7, clinic_type, clinic_address, slug) FROM stdin;
74	Saraçhane Animal Hospital	umutdncr@gmail.com	25	İmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğluİmamoğlu	06:20:00	21:20:00	2025-03-23 23:12:46.181559	2025-04-26 00:47:14.479893	verified	2025	3	t	t	complete	2222222222	5555555555	t	t	{f,t,t,t,t,t,t}	{t,t,f,f,f,t,t}	20	No	animal_hospital	Etimesgut	sarahane-animal-hospital
79	Novavet Veterinary Clinic	novavet@gmail.com	38	Novavet is a next-generation veterinary clinic dedicated to redefining pet healthcare. With a focus on innovation, precision, and compassionate service, we offer intelligent solutions for modern pet owners. At Novavet, every visit is powered by trust, care, and cutting-edge veterinary expertise.	10:00:00	18:00:00	2025-04-06 17:26:24.06476	2025-04-06 17:26:24.06476	verified	2023	11	t	t	complete	1234567890	1234567890	t	t	{t,t,t,t,t,t,t}	{t,t,t,t,t,t,t}	30	Yes	veterinary_clinic	Çankaya	novavet-veterinary-clinic
75	Eryaman Animal Hospital	eryamanveteriner@gmail.com	27	Eryaman Veterinary Hospital is a state-of-the-art medical facility dedicated to providing comprehensive healthcare for pets, offering a wide range of services including routine check-ups, vaccinations, surgical procedures, emergency care, and specialized treatments. With a team of experienced veterinarians, advanced medical equipment, and a compassionate approach, we are committed to ensuring the highest quality of care for your beloved animal companions, delivering professional and personalized veterinary services that address both preventive health needs and complex medical conditions in a modern, hygienic, and welcoming environment.	09:30:00	17:00:00	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498	verified	2023	8	t	t	complete	ERYAMANVET	VETLICENSE	t	t	{t,t,t,t,t,t,t}	{t,t,t,t,t,f,f}	30	No	animal_hospital	Çankaya	eryaman-animal-hospital
76	Vetica Veterinary Clinic	vetica@gmail.com	36	baskan sunu bi siliyom ekran gözükmüyo cok uzunlar aq	09:00:00	17:00:00	2025-04-06 16:32:59.232874	2025-04-06 16:32:59.232874	verified	2010	5	t	t	complete	1111111111	1234567890	t	t	{t,t,t,t,t,f,f}	{t,t,t,t,t,t,t}	30	No	veterinary_clinic	Yenimahalle	vetica-veterinary-clinic
80	Erdem Ege Veterinary Clinic	umutdncr@gmail.com	50	Erdem EgeErdem EgeErdem EgeErdem EgeErdem EgeErdem Ege	10:00:00	17:00:00	2025-04-26 17:26:49.877203	2025-04-26 17:26:49.877203	verified	2025	3	t	t	complete	1234567890	2222222222	t	t	{t,t,t,t,t,f,f}	{f,f,f,f,f,t,t}	60	No	veterinary_clinic	Keçiören	erdem-ege-veterinary-clinic
78	Petworks Veterinary Clinic	petworks@gmail.com	37	Petworks is a forward-thinking veterinary clinic where technology and compassionate care come together. We provide integrated health services for pets with a focus on smart diagnostics, seamless communication, and personalized treatment. At Petworks, we believe every connection matters — between pets, their owners, and the care they receive.	09:40:00	17:40:00	2025-04-06 17:05:17.417878	2025-04-06 17:12:32.833316	verified	2019	11	t	t	complete	1234567890	1234567890	t	t	{t,t,t,t,t,t,t}	{t,t,t,t,t,t,t}	20	Yes	veterinary_clinic	Polatlı	petworks-veterinary-clinic
\.


--
-- TOC entry 4798 (class 0 OID 17961)
-- Dependencies: 276
-- Data for Name: diagnoses; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.diagnoses (diagnosis_id, examination_id, diagnosis_type, diagnosis_code, diagnosis_name, description, diagnosis_date, severity, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4751 (class 0 OID 16701)
-- Dependencies: 229
-- Data for Name: emergency_contacts; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.emergency_contacts (pet_id, pet_name, emergency_contact_name, emergency_contact_phone) FROM stdin;
\.


--
-- TOC entry 4796 (class 0 OID 17933)
-- Dependencies: 274
-- Data for Name: examinations; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.examinations (examination_id, pet_id, vet_id, examination_date, status, temperature, heart_rate, respiratory_rate, weight, notes, appointment_id, created_at, updated_at) FROM stdin;
13	59	27	2025-05-05 14:34:14.360474	started	37.00	80	20	16.00	Hera Diagnosis Deneme	70	2025-05-05 14:34:14.360474	2025-05-05 14:34:14.360474
\.


--
-- TOC entry 4788 (class 0 OID 17613)
-- Dependencies: 266
-- Data for Name: inventory_categories; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.inventory_categories (id, name, description, parent_id, clinic_id, created_at, updated_at, created_by, is_active) FROM stdin;
cat-1746190810888	Medikal	Medikal Eşyalar Üst Grubu	\N	75	2025-05-02 13:00:10.858545	2025-05-02 13:00:10.858545	27	t
cat-1746190827498	İlaçlar	İlaçlar Alt Grubu	cat-1746190810888	75	2025-05-02 13:00:27.468698	2025-05-02 13:00:27.468698	27	t
cat-1746201322590	Yarraklar	Yarraklar Üst Grubu	\N	75	2025-05-02 15:55:22.351302	2025-05-02 20:43:49.282135	27	t
cat-1746297911248	Onurlar		\N	75	2025-05-03 18:45:10.543331	2025-05-03 18:45:10.543331	27	t
cat-1746297922430	Güngörler		cat-1746297911248	75	2025-05-03 18:45:21.723476	2025-05-03 18:45:21.723476	27	t
\.


--
-- TOC entry 4789 (class 0 OID 17631)
-- Dependencies: 267
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.inventory_items (id, name, sku, category_id, description, unit_type, current_quantity, min_quantity, purchase_price, sale_price, location, expiry_date, batch_number, clinic_id, created_at, updated_at, created_by, is_active) FROM stdin;
item-1746191754351	Amoksilin 500gr	AMOKSILIN-SKU	cat-1746190827498	Amoksilin Açıklama	Unit	9	10	20	25	Cabinet	2026-12-29	AMOKSILINBATCH	75	2025-05-02 13:15:54.307083	2025-05-04 11:46:44.635045	27	t
\.


--
-- TOC entry 4790 (class 0 OID 17665)
-- Dependencies: 268
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.inventory_transactions (id, inventory_item_id, transaction_type, quantity, unit_price, total_price, transaction_date, batch_number, expiry_date, notes, performed_by_user_id, reference_id, clinic_id, created_at) FROM stdin;
trans-1746191754423	item-1746191754351	purchase	10	\N	\N	2025-05-02 13:15:54.37553	\N	\N	Initial stock entry	27	\N	75	2025-05-02 13:15:54.37553
trans-1746193581622	item-1746191754351	adjustment	5	\N	\N	2025-05-02 13:46:21.539081	\N	\N	Quantity adjusted via item edit	27	\N	75	2025-05-02 13:46:21.539081
trans-1746200563552	item-1746191754351	purchase	5	200	1000	2025-05-02 15:42:43.339385	AMOKSILINBATCH	2026-12-31		27	\N	75	2025-05-02 15:42:43.339385
trans-1746200932662	item-1746191754351	usage	10	\N	\N	2025-05-02 15:48:52.430936		2027-12-30		27	\N	75	2025-05-02 15:48:52.430936
trans-1746358864943	item-1746191754351	adjustment	5	\N	\N	2025-05-04 11:41:03.562261	\N	\N	Quantity adjusted via item edit	27	\N	75	2025-05-04 11:41:03.562261
trans-1746359206009	item-1746191754351	usage	6	\N	\N	2025-05-04 11:46:44.635045		2027-12-31		27	\N	75	2025-05-04 11:46:44.635045
\.


--
-- TOC entry 4763 (class 0 OID 16872)
-- Dependencies: 241
-- Data for Name: medical_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.medical_services (medical_service_id, service_name, service_category, created_at) FROM stdin;
1	Routine Check-ups	Preventive Care	2025-03-10 23:08:02.850066
2	Vaccinations	Preventive Care	2025-03-10 23:08:02.850066
3	Surgery	Procedures	2025-03-10 23:08:02.850066
4	Dental Care	Procedures	2025-03-10 23:08:02.850066
5	X-Ray	Diagnostics	2025-03-10 23:08:02.850066
6	Ultrasound	Diagnostics	2025-03-10 23:08:02.850066
7	Laboratory Tests	Diagnostics	2025-03-10 23:08:02.850066
8	Emergency Services	Urgent Care	2025-03-10 23:08:02.850066
9	Neutering/Spaying	Procedures	2025-03-10 23:08:02.850066
10	Cancer Treatment	Specialized Care	2025-03-10 23:08:02.850066
11	Internal Medicine	Specialized Care	2025-03-10 23:08:02.850066
12	Orthopedic Services	Specialized Care	2025-03-10 23:08:02.850066
13	Dermatology	Specialized Care	2025-03-10 23:08:02.850066
14	Cardiology	Specialized Care	2025-03-10 23:08:02.850066
15	Ophthalmology	Specialized Care	2025-03-10 23:08:02.850066
16	Vaccination	\N	2025-03-13 09:15:14.826187
17	Preventive Care	\N	2025-03-13 09:15:14.826187
18	Emergency Care	\N	2025-03-16 00:14:24.836114
19	Pharmacy	\N	2025-03-16 00:14:24.836114
20	Behavior Consultation	\N	2025-03-19 12:57:06.578774
21	Nutrition Consultation	\N	2025-03-19 12:57:06.578774
22	Neurology	\N	2025-03-19 18:16:50.796156
23	Euthanasia	\N	2025-03-19 18:28:32.395103
24	Orthopedics	\N	2025-03-19 20:05:37.401399
\.


--
-- TOC entry 4753 (class 0 OID 16712)
-- Dependencies: 231
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.password_reset_tokens (reset_token_id, user_id, user_email, reset_code, reset_token_created_at, reset_token_expires_at, reset_token_is_used) FROM stdin;
\.


--
-- TOC entry 4794 (class 0 OID 17895)
-- Dependencies: 272
-- Data for Name: pet_hospitalizations; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pet_hospitalizations (id, room_id, pet_id, admission_date, expected_discharge_date, actual_discharge_date, created_at, updated_at) FROM stdin;
3	3	65	2025-05-03 00:00:00	2025-05-06 00:00:00	\N	2025-05-03 16:05:41.931968	2025-05-03 16:05:41.931968
4	6	59	2025-05-03 00:00:00	2025-05-06 00:00:00	\N	2025-05-03 17:04:49.719685	2025-05-03 17:04:49.719685
\.


--
-- TOC entry 4784 (class 0 OID 17337)
-- Dependencies: 262
-- Data for Name: pet_owner_favorite_clinics; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pet_owner_favorite_clinics (favorite_id, pet_owner_id, clinic_id, created_at) FROM stdin;
13	48	75	2025-04-25 08:19:58.533676+00
15	43	75	2025-04-26 17:10:30.676211+00
16	51	75	2025-04-27 14:38:10.876334+00
17	54	79	2025-05-03 19:17:50.700926+00
18	54	78	2025-05-03 19:17:51.593913+00
\.


--
-- TOC entry 4740 (class 0 OID 16545)
-- Dependencies: 218
-- Data for Name: pet_owners; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pet_owners (pet_owner_id) FROM stdin;
23
26
43
48
51
54
\.


--
-- TOC entry 4742 (class 0 OID 16556)
-- Dependencies: 220
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pets (pet_id, pet_owner_id, pet_name, pet_breed, pet_photo, pet_gender, pet_species, pet_birth_day, pet_birth_month, pet_birth_year, pet_birth_date, chip_number) FROM stdin;
59	43	Hera	Cocker Spaniel	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-43/hera.png	Female	Dog	15	9	2021	\N	123456789098766
64	48	Pamuk	Golden Retriever	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-48/pamuk.png	Female	Dog	28	5	2021	\N	\N
65	51	Pablo	Poodle	\N	Male	Dog	10	5	2023	\N	\N
83	23	Bitter	Border Collie	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-23/Bitter.jpeg	\N	dog	\N	\N	\N	2024-07-12	\N
89	54	3	Maine Coon	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-54/3.png	Male	Cat	1	1	2023	\N	\N
86	23	Çakıl	Cooker	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-23/%C3%87ak%C4%B1l.jpeg	Female	dog	2	3	2023	2021-03-10	\N
\.


--
-- TOC entry 4750 (class 0 OID 16642)
-- Dependencies: 228
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.reviews (clinic_review_id, appointment_id, clinic_id, pet_owner_id, pet_id, clinic_review_hygiene_rating, clinic_review_stuff_behaviour_rating, clinic_review_price_rating, comments, clinic_review_date) FROM stdin;
\.


--
-- TOC entry 4799 (class 0 OID 17979)
-- Dependencies: 277
-- Data for Name: standard_diagnoses; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.standard_diagnoses (code, name, description, category, species, is_active, diagnosis_id, veterinarian_id) FROM stdin;
CAT-693091	Fenine Viral Disease	Description Fenine Viral Disease	Viral Diseases	cat	t	4	27
\.


--
-- TOC entry 4787 (class 0 OID 17596)
-- Dependencies: 265
-- Data for Name: user_tokens; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.user_tokens (user_id, user_token_expo) FROM stdin;
23	ExponentPushToken[yAejs7NCMv1_41o8XznsFR]
23	ExponentPushToken[i71ax6MM8CImJZnx8Bu7A2]
25	ExponentPushToken[i71ax6MM8CImJZnx8Bu7A2]
\.


--
-- TOC entry 4738 (class 0 OID 16518)
-- Dependencies: 216
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.users (user_id, user_type, user_name, user_surname, user_email, user_password, user_phone, user_address, user_profile_photo, user_created_at, user_updated_at) FROM stdin;
54	pet_owner	Yücel	Çöllü	yucelcll@gm.com	$2b$10$0YlK2AI2m5ZfmzoUVaufv.r15gZNw46./48cAfzTfxQE7oEzSO7kK	(233) 412-3123	xxxasda123	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-owner-photos/petowner-54/y-cel-1746299326746.png	2025-05-03 19:00:17.125115	2025-05-03 19:08:48.120028
24	veterinarian	veteriner	veteriner	veteriner@gmail.com	Veteriner123	\N	\N	\N	2025-03-11 16:45:22.642386	2025-03-11 16:45:22.642386
25	veterinarian	Korhan	Maral	korhan@gmail.com	$2b$10$K8fnwYm.War.v7AFFXT1Cet57z8qtA7.CUV/LfKQG8QurYnHt1a2W	\N	\N	\N	2025-03-12 15:01:43.600885	2025-03-12 15:01:43.600885
26	admin	Umut	Yananer	umutdncr@gmail.com	$2b$10$XcGmKKT1Mux5eIGB7BN24.AOWpDRumSSQrG.yxyhtFNXn/hnZa7q2	\N	\N	\N	2025-03-12 15:02:48.836524	2025-03-12 15:02:48.836524
27	veterinarian	Mehmet	Öztürk	mehmet@gmail.com	$2b$10$ajDuY1isr1.qxguqgXDyfOu47dZ/dTKWLQX14.KwAxPwPNATc98qa	\N	\N	\N	2025-03-27 10:21:52.318334	2025-03-27 10:21:52.318334
30	veterinarian	Timur	Candaş	timur@gmail.com	$2b$10$D4DmrT77qdJyyGQ6eLYfMuimiTgFI2ZBP0/LUAq.E7rtSTpLTY/V6	\N	\N	\N	2025-04-01 00:21:13.665191	2025-04-01 00:21:13.665191
31	admin	Dinçer	Yananer	dincer.yananer@ug.bilkent.edu.tr	$2b$10$l5rFjFeBrvBjDRUDVsJipOAp18FbjhJ1uYRA.fKLXp1A8vOdQ4wbS	\N	\N	\N	2025-04-01 00:34:45.442856	2025-04-01 00:34:45.442856
33	veterinarian	Eyüp	Eroğlu	eyup@gmail.com	$2b$10$gJXev/3w0ulKmcJMxinlIek2jSJeqZvzhb6EVNXlwQhMU4g.gFb7y	\N	\N	\N	2025-04-01 14:50:29.392596	2025-04-01 14:50:29.392596
34	veterinarian	Kutlucan	Öztürk	kutlucan@gmail.com	$2b$10$7y6HaSSBc/iJ43w29Z.fXenXINDtFMkApcGqr9v/JfRBgI64PMlXe	\N	\N	\N	2025-04-03 19:21:25.238772	2025-04-03 19:21:25.238772
35	veterinarian	Saltuk	Emre	saltuk@gmail.com	$2b$10$7U8eLbXZx1SqrfQVNVT6Ne4hoS1xuRpR6JPc10WoLbV1qbVG2jV0i	\N	\N	\N	2025-04-04 17:10:47.222946	2025-04-04 17:10:47.222946
36	veterinarian	Osman	İç	osman@gmail.com	$2b$10$KXGkN1.iQmnnMcIxXyXzgulyI5SUdrOX.eQzxMHEWhPtP9y/ojQTm	\N	\N	\N	2025-04-06 16:24:40.055596	2025-04-06 16:24:40.055596
37	veterinarian	Ercan	Eroğlu	ercan@gmail.com	$2b$10$US9s0bH3EZ95HyEIUIw3M.nP/sGL1qvH6MCqqpPhRB38qsc7vKRxm	\N	\N	\N	2025-04-06 16:54:24.906553	2025-04-06 16:54:24.906553
38	veterinarian	Egehan	Özkan	egehan@gmail.com	$2b$10$JsaaQz1totLDH80SbJfbmu1hTne//ldGvsQL5pi0sB538VXkfNJBS	\N	\N	\N	2025-04-06 17:23:30.584267	2025-04-06 17:23:30.584267
39	veterinarian	Tuna	Çöllü	tuna@gmail.com	$2b$10$A7I7hsJ2TVVqJRUf2eeVxuvX8DQkt/o9s7rosOBB3umRW8ysW.V8i	\N	\N	\N	2025-04-08 11:10:26.624827	2025-04-08 11:10:26.624827
40	veterinarian	Kemal	Eray	kemal@gmail.com	$2b$10$gq3L4JZNq3cm87rFPxtVFOtEsFDGCiwatgh0DJF5xrCBinZbPLSrG	\N	\N	\N	2025-04-08 12:03:48.970294	2025-04-08 12:03:48.970294
43	pet_owner	Alev	Yananer	alev@gmail.com	$2b$10$4e6cHrPf/45QdsjzTH0NteyxRZwNd4t5J0DP0SVrTtw1fr5oJ3Ipa	(545) 290-1525	Şehit Osman Avcı Mah. Selçuklular Cad. İntes Blk. Cumhuriyet Sitesi B7 Blok No:25 Eryaman Etimesgut İstanbul	\N	2025-04-19 17:14:06.845732	2025-04-22 07:42:03.645519
48	pet_owner	Petlyst	Petlyst	petlyst@gmail.com	$2b$10$NGqctHwD9RYHR9LKuRaEGuQFlXgu3ZAZRnqcRNembu6B43Q.3K0BK	\N	\N	\N	2025-04-25 08:19:33.314826	2025-04-25 08:19:33.314826
49	veterinarian	Petlyst	Vet	petlystvet@gmail.com	$2b$10$i0dtRR4Yt3D8a37I87Rv5eT71Z.HAgzHtGmgFWdXUQEpPXZ9gQY5i	\N	\N	\N	2025-04-25 12:24:57.382783	2025-04-25 12:24:57.382783
57	veterinarian	Hokh	Lhlh	lhlhlh	$2a$10$.7Os8upq.zYrVcjLaUpjj.3BBShpLT4bwwfe39yyxtxuEVDdBuI2.	\N	\N	\N	2025-05-04 16:05:22.883199	2025-05-04 16:05:22.883199
50	veterinarian	Erdem	Ege	erdem@gmail.com	$2b$10$Eq4Th23j6i6aWlEFKWa5ou4YVle.azto2IAmXZmWtzv7Txq/ZwE1G	\N	\N	\N	2025-04-26 17:15:48.009244	2025-04-26 17:15:48.009244
51	pet_owner	Pelin	Şen	pelin@gmail.com	$2b$10$aCi0BsXaZuf2p1O89ElGwuRPulsuUhm1t757cxmuivl5pr6zogdXu	\N	\N	\N	2025-04-27 14:36:34.722569	2025-04-27 14:36:34.722569
58	veterinarian	vet	vet	vet	$2a$10$sNmk70ZSk3CB.GpXkG88M.SWbxG8FrS8EP/ySrzF12TqjfCu7DI.i	\N	\N	\N	2025-05-04 16:20:28.589582	2025-05-04 16:20:28.589582
23	pet_owner	Tarik	Lafci	tariklafci@gmail.com	$2a$10$o6pIZCCYP1hjVeSJG2yVbeZliInfSmcS8x7/eSiBsVJDGi.VGCQJa	\N	\N	\N	2025-03-11 16:18:00.338218	2025-03-11 16:18:00.338218
53	veterinarian	Orhan	Korhan	orhan@gmail.com	$2b$10$YGcjOLap1IIO55Ip8z6UhO/Los0YYBxfIYi4S/Q4iHGw7cd1xedwa	\N	\N	\N	2025-05-01 13:23:41.914428	2025-05-01 13:23:41.914428
\.


--
-- TOC entry 4779 (class 0 OID 17173)
-- Dependencies: 257
-- Data for Name: veterinarian_albums; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_albums (veterinarian_album_photo_id, veterinarian_id, veterinarian_album_photo_url, veterinarian_album_photo_url_created_at) FROM stdin;
5	27	https://petlyst-s3.s3.eu-central-1.amazonaws.com/veterinarian-photos/27-mehmet-zt-rk/1743444404278.png	2025-03-31 18:06:46.90268
6	25	https://petlyst-s3.s3.eu-central-1.amazonaws.com/veterinarian-photos/25-unknown/1743457587467.png	2025-03-31 21:46:29.098401
7	30	https://petlyst-s3.s3.eu-central-1.amazonaws.com/veterinarian-photos/30-unknown/1743466902247.png	2025-04-01 00:21:42.871916
8	36	https://petlyst-s3.s3.eu-central-1.amazonaws.com/veterinarian-photos/36-osman-i/1743956832589.png	2025-04-06 16:27:14.707164
\.


--
-- TOC entry 4775 (class 0 OID 17104)
-- Dependencies: 253
-- Data for Name: veterinarian_certifications; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_certifications (certification_id, veterinarian_id, certification_name, issuing_organization, issue_date, certification_number, created_at) FROM stdin;
5	36	Veterinary Surgery Specialist	Turkish Board of Veterinarians	0002-01-01	ABVP-1234	2025-04-06 16:25:33.812513
6	27	Veterinary Surgery Specialist	Turkish Board of Veterinarians	2022-09-30	\N	2025-04-26 17:21:17.108385
\.


--
-- TOC entry 4773 (class 0 OID 17083)
-- Dependencies: 251
-- Data for Name: veterinarian_education; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_education (education_id, veterinarian_id, school_name, field_of_study, start_date, end_date, is_current, created_at) FROM stdin;
4	27	Hacettepe University	Veterinary Medicine	2002-01-01	2006-01-01	f	2025-03-28 13:40:00.963535
8	25	Ankara University	Veterinary Medicine	2021-11-30	2025-02-28	f	2025-03-31 23:55:58.547961
9	36	Van University	Veterinary Medicine	1995-01-01	1999-01-01	f	2025-04-06 16:25:15.879823
10	53	Antalya Üniversitesi	Veterinerlik	2014-01-01	2019-02-01	f	2025-05-01 13:34:36.113243
\.


--
-- TOC entry 4777 (class 0 OID 17124)
-- Dependencies: 255
-- Data for Name: veterinarian_expertise; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_expertise (expertise_id, veterinarian_id, expertise_area, created_at) FROM stdin;
2	25	small_animal_dermatology	2025-03-27 21:42:39.274159
3	25	equine_medicine	2025-03-27 21:42:39.34864
4	25	bovine_medicine	2025-03-27 21:42:39.419623
5	25	amphibian_medicine	2025-03-27 21:42:39.489622
6	25	exotic_animal_medicine	2025-03-27 21:42:39.557153
8	25	veterinary_microbiology	2025-03-27 21:42:39.69564
9	25	public_health	2025-03-27 21:42:39.76466
10	25	small_animal_general	2025-03-27 21:42:53.320602
11	25	small_animal_internal	2025-03-31 23:33:39.487216
12	25	small_animal_surgery	2025-03-31 23:33:39.569683
13	30	small_animal_general	2025-04-01 00:22:45.120169
14	30	small_animal_cardiology	2025-04-01 00:22:45.209531
15	30	large_animal_general	2025-04-01 00:22:45.289167
16	30	food_animal_medicine	2025-04-01 00:22:45.36616
17	30	avian_medicine	2025-04-01 00:22:45.4505
18	30	fish_medicine	2025-04-01 00:22:45.535521
19	30	veterinary_nutrition	2025-04-01 00:22:45.61551
20	30	rehabilitation_medicine	2025-04-01 00:22:45.691763
21	30	veterinary_pharmacology	2025-04-01 00:22:45.767817
22	30	veterinary_anesthesia	2025-04-01 00:22:45.844779
23	30	veterinary_microbiology	2025-04-01 00:22:45.921789
24	30	emergency_critical_care	2025-04-01 00:22:45.999806
25	30	veterinary_pathology	2025-04-01 00:22:46.077088
26	30	epidemiology	2025-04-01 00:22:46.154708
27	30	public_health	2025-04-01 00:22:46.232251
28	30	laboratory_animal_medicine	2025-04-01 00:22:46.310837
29	36	small_animal_general	2025-04-06 16:26:16.879989
30	36	small_animal_cardiology	2025-04-06 16:26:16.947067
31	36	small_animal_internal	2025-04-06 16:26:17.012913
32	36	small_animal_surgery	2025-04-06 16:26:17.076982
33	36	large_animal_general	2025-04-06 16:26:17.147933
34	36	veterinary_microbiology	2025-04-06 16:26:17.216517
35	36	veterinary_pharmacology	2025-04-06 16:26:17.284518
36	36	veterinary_parasitology	2025-04-06 16:26:17.34893
37	36	preventive_medicine	2025-04-06 16:26:17.419829
38	36	veterinary_nutrition	2025-04-06 16:26:17.486275
39	36	toxicology	2025-04-06 16:26:17.550182
40	36	epidemiology	2025-04-06 16:26:17.614771
41	53	small_animal_general	2025-05-01 13:34:50.384431
42	53	amphibian_medicine	2025-05-01 13:34:50.456979
43	53	veterinary_microbiology	2025-05-01 13:34:50.52738
44	53	veterinary_anesthesia	2025-05-01 13:34:50.589429
45	53	veterinary_pathology	2025-05-01 13:34:50.653395
46	53	emergency_critical_care	2025-05-01 13:34:50.714312
47	53	small_animal_internal	2025-05-01 13:34:50.771349
48	53	small_animal_surgery	2025-05-01 13:34:50.830373
49	53	small_animal_dentistry	2025-05-01 13:34:50.890396
50	53	small_animal_dermatology	2025-05-01 13:34:50.953466
51	53	small_animal_cardiology	2025-05-01 13:34:51.01137
52	53	animal_welfare	2025-05-01 13:34:51.070377
53	53	epidemiology	2025-05-01 13:34:51.129393
54	53	toxicology	2025-05-01 13:34:51.189406
\.


--
-- TOC entry 4739 (class 0 OID 16530)
-- Dependencies: 217
-- Data for Name: veterinarians; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarians (veterinarian_id, veterinarian_graduate_barcode, veterinarian_verification_status, veterinarian_tc_number, veterinarian_created_at, veterinarian_updated_at, biography, preferred_languages, is_profile_public, slug) FROM stdin;
40	KEMALBARCODE	verified	b30faa20863fd848c00e2113d51c4e18:68fa24d74a77f040eec02a6be7110604	2025-04-08 12:03:49.230285	2025-04-08 12:03:49.230285	\N	\N	t	dr-kemal-eray-905bml
38	EGEHANBARCODE	verified	0087f302072f271b7a499be7ffa10590:a328e75af49842a568c0563a68b85e71	2025-04-06 17:23:30.638374	2025-04-06 17:23:30.638374	\N	\N	f	dr-egehan-zkan
50	ERDEMBARCODE	verified	2f93b36b211228ae2cfcd53eebed7198:b93b66add234fedbe184f1d3544678b1	2025-04-26 17:15:48.070691	2025-04-26 17:15:48.070691	\N	\N	t	dr-erdem-ege-n1sks4
49	123213123213131	verified	e0f5f1744d573831fde604ac5e21e899:3d81292ffe609aa3f393a1afa09e751d	2025-04-25 12:24:57.387543	2025-04-25 12:24:57.387543	\N	\N	f	dr-petlyst-vet
34	KUTLUCANBARCODE	verified	1a5d0cc11c50acf6bc40f32e216fb54d:52463f23229af9629a23ae86cc40f54f	2025-04-03 19:21:25.297825	2025-04-03 19:21:25.297825	\N	\N	t	dr-kutlucan-ztrk
27	MEHMETBARCODENUMBER	verified	48c0bcb3a4f2eb27e215ef9c96a9d277:8fc53eec5c3f69faa5273c11853ff0e2	2025-03-27 10:21:52.421944	2025-03-31 19:48:26.145876	Dr. Mehmet is a passionate veterinarian dedicated to providing compassionate care for animals of all kinds. With years of experience in small animal medicine, he combines expertise with a gentle approach to ensure every pet receives the best treatment.	{english,german}	t	dr-mehmet-ztrk
36	OSMANBARCODE	verified	2af08d70a0eb385ff0ceca4a1fb38f62:fdb280f49648d1d96fa1e7f5830db22f	2025-04-06 16:24:40.116182	2025-04-06 16:27:04.420483	Dr. Osman İç is a dedicated veterinary specialist in internal medicine, with a deep focus on diagnosing and managing complex diseases in companion animals. Known for his analytical approach and compassionate care, he strives to improve each patient’s quality of life through precise, evidence-based treatments.	{english,turkish}	t	dr-osman-i
24	\N	not_verified	b9ea071404d499044df72f9a49d805f0:23bbf7c1945d0c79bd8415bd28dfb4b8	2025-03-11 16:46:18.769778	2025-03-11 16:46:18.769778	\N	\N	f	dr-veteriner-veteriner
39	TUNABARCODE	verified	624834a136c655af396ba64ff9ad8d5b:9474747b490ecee5952349621a62a79f	2025-04-08 11:10:26.688737	2025-04-08 11:10:26.688737	\N	\N	f	dr-tuna-ll
30	TIMURBARCODE	verified	617a47e3060b351b634eb65f0ea0ccad:e0c35035c57947024cedce157225c72c	2025-04-01 00:21:13.72516	2025-04-01 00:21:13.72516	\N	\N	t	dr-timur-canda
35	\N	not_verified	\N	2025-04-04 17:10:47.279434	2025-04-04 17:10:47.279434	\N	\N	t	dr-saltuk-emre
33	EYUPBARCODE	verified	e168445633eed980313c951fbdd75ce0:7bbbbc678ebeb213a07ea91cc27c0b72	2025-04-01 14:50:29.451547	2025-04-01 14:50:29.451547	\N	\N	f	dr-eyp-erolu
25	DENEMEBARCODENUMBER	verified	fffa86d3009aaa41d983335a2c98cad2:dfcc12574b47a548ec343df3573899fe	2025-03-12 15:01:43.660487	2025-03-31 23:32:07.075703	Dr. Korhan is a passionate veterinarian dedicated to providing compassionate care for animals of all kinds. With years of experience in small animal medicine, he combines expertise with a gentle approach to ensure every pet receives the best treatment.	{turkish,azerbaijan,german,english}	t	dr-korhan-maral
37	ERCANBARCODE	verified	7dbe6b38d23ad9826bc788dde9f0822d:e5ea963bd7db6fa67e66f18485a8b34d	2025-04-06 16:54:24.964489	2025-04-06 16:54:24.964489	\N	\N	f	dr-ercan-erolu
53	\N	not_verified	\N	2025-05-01 13:23:41.970418	2025-05-01 13:35:19.244129	Kendini hayvanlara adamış bir veteriner. Ben Korhan Beyin kardeşi Orhan Bey	{english,turkish,german}	f	dr-orhan-korhan
57	\N	not_verified	\N	2025-05-04 16:05:22.883199	2025-05-04 16:05:22.883199	\N	\N	f	\N
58	\N	not_verified	\N	2025-05-04 16:20:28.589582	2025-05-04 16:20:28.589582	\N	\N	f	\N
\.


--
-- TOC entry 4836 (class 0 OID 0)
-- Dependencies: 244
-- Name: additional_services_additional_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.additional_services_additional_service_id_seq', 17, true);


--
-- TOC entry 4837 (class 0 OID 0)
-- Dependencies: 236
-- Name: animal_types_animal_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.animal_types_animal_type_id_seq', 18, true);


--
-- TOC entry 4838 (class 0 OID 0)
-- Dependencies: 225
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 105, true);


--
-- TOC entry 4839 (class 0 OID 0)
-- Dependencies: 246
-- Name: clinic_additional_services_clinic_additional_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_additional_services_clinic_additional_service_id_seq', 158, true);


--
-- TOC entry 4840 (class 0 OID 0)
-- Dependencies: 238
-- Name: clinic_animal_types_clinic_animal_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_animal_types_clinic_animal_type_id_seq', 148, true);


--
-- TOC entry 4841 (class 0 OID 0)
-- Dependencies: 269
-- Name: clinic_hospitalization_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_hospitalization_rooms_id_seq', 6, true);


--
-- TOC entry 4842 (class 0 OID 0)
-- Dependencies: 234
-- Name: clinic_locations_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_locations_location_id_seq', 54, true);


--
-- TOC entry 4843 (class 0 OID 0)
-- Dependencies: 242
-- Name: clinic_medical_services_clinic_medical_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_medical_services_clinic_medical_service_id_seq', 168, true);


--
-- TOC entry 4844 (class 0 OID 0)
-- Dependencies: 264
-- Name: clinic_patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_patients_id_seq', 5, true);


--
-- TOC entry 4845 (class 0 OID 0)
-- Dependencies: 248
-- Name: clinic_phone_numbers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_phone_numbers_id_seq', 61, true);


--
-- TOC entry 4846 (class 0 OID 0)
-- Dependencies: 232
-- Name: clinic_social_media_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_social_media_link_id_seq', 37, true);


--
-- TOC entry 4847 (class 0 OID 0)
-- Dependencies: 259
-- Name: clinic_veterinarians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_veterinarians_id_seq', 23, true);


--
-- TOC entry 4848 (class 0 OID 0)
-- Dependencies: 223
-- Name: clinicalbum_clinic_album_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinicalbum_clinic_album_photo_id_seq', 85, true);


--
-- TOC entry 4849 (class 0 OID 0)
-- Dependencies: 227
-- Name: clinicreviews_clinic_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinicreviews_clinic_review_id_seq', 1, false);


--
-- TOC entry 4850 (class 0 OID 0)
-- Dependencies: 221
-- Name: clinics_clinic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinics_clinic_id_seq', 80, true);


--
-- TOC entry 4851 (class 0 OID 0)
-- Dependencies: 275
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.diagnoses_diagnosis_id_seq', 5, true);


--
-- TOC entry 4852 (class 0 OID 0)
-- Dependencies: 273
-- Name: examinations_examination_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.examinations_examination_id_seq', 13, true);


--
-- TOC entry 4853 (class 0 OID 0)
-- Dependencies: 240
-- Name: medical_services_medical_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.medical_services_medical_service_id_seq', 24, true);


--
-- TOC entry 4854 (class 0 OID 0)
-- Dependencies: 230
-- Name: password_reset_tokens_reset_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.password_reset_tokens_reset_token_id_seq', 21, true);


--
-- TOC entry 4855 (class 0 OID 0)
-- Dependencies: 271
-- Name: pet_hospitalizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.pet_hospitalizations_id_seq', 4, true);


--
-- TOC entry 4856 (class 0 OID 0)
-- Dependencies: 261
-- Name: pet_owner_favorite_clinics_favorite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.pet_owner_favorite_clinics_favorite_id_seq', 18, true);


--
-- TOC entry 4857 (class 0 OID 0)
-- Dependencies: 219
-- Name: pets_pet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.pets_pet_id_seq', 89, true);


--
-- TOC entry 4858 (class 0 OID 0)
-- Dependencies: 278
-- Name: standard_diagnoses_diagnosis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.standard_diagnoses_diagnosis_id_seq', 4, true);


--
-- TOC entry 4859 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 58, true);


--
-- TOC entry 4860 (class 0 OID 0)
-- Dependencies: 256
-- Name: veterinarian_album_veterinarian_album_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_album_veterinarian_album_photo_id_seq', 1, false);


--
-- TOC entry 4861 (class 0 OID 0)
-- Dependencies: 258
-- Name: veterinarian_albums_veterinarian_album_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_albums_veterinarian_album_photo_id_seq', 8, true);


--
-- TOC entry 4862 (class 0 OID 0)
-- Dependencies: 252
-- Name: veterinarian_certifications_certification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_certifications_certification_id_seq', 6, true);


--
-- TOC entry 4863 (class 0 OID 0)
-- Dependencies: 250
-- Name: veterinarian_education_education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_education_education_id_seq', 10, true);


--
-- TOC entry 4864 (class 0 OID 0)
-- Dependencies: 254
-- Name: veterinarian_expertise_expertise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_expertise_expertise_id_seq', 54, true);


--
-- TOC entry 4479 (class 2606 OID 16910)
-- Name: additional_services additional_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services
    ADD CONSTRAINT additional_services_pkey PRIMARY KEY (additional_service_id);


--
-- TOC entry 4481 (class 2606 OID 16912)
-- Name: additional_services additional_services_service_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services
    ADD CONSTRAINT additional_services_service_name_key UNIQUE (service_name);


--
-- TOC entry 4463 (class 2606 OID 16850)
-- Name: animal_types animal_types_animal_type_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types
    ADD CONSTRAINT animal_types_animal_type_name_key UNIQUE (animal_type_name);


--
-- TOC entry 4465 (class 2606 OID 16848)
-- Name: animal_types animal_types_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types
    ADD CONSTRAINT animal_types_pkey PRIMARY KEY (animal_type_id);


--
-- TOC entry 4451 (class 2606 OID 16611)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- TOC entry 4483 (class 2606 OID 16922)
-- Name: clinic_additional_services clinic_additional_services_clinic_id_additional_service_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_clinic_id_additional_service_id_key UNIQUE (clinic_id, additional_service_id);


--
-- TOC entry 4485 (class 2606 OID 16920)
-- Name: clinic_additional_services clinic_additional_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_pkey PRIMARY KEY (clinic_additional_service_id);


--
-- TOC entry 4467 (class 2606 OID 16860)
-- Name: clinic_animal_types clinic_animal_types_clinic_id_animal_type_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_clinic_id_animal_type_id_key UNIQUE (clinic_id, animal_type_id);


--
-- TOC entry 4469 (class 2606 OID 16858)
-- Name: clinic_animal_types clinic_animal_types_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_pkey PRIMARY KEY (clinic_animal_type_id);


--
-- TOC entry 4527 (class 2606 OID 17888)
-- Name: clinic_hospitalization_rooms clinic_hospitalization_rooms_clinic_id_room_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_hospitalization_rooms
    ADD CONSTRAINT clinic_hospitalization_rooms_clinic_id_room_name_key UNIQUE (clinic_id, room_name);


--
-- TOC entry 4529 (class 2606 OID 17886)
-- Name: clinic_hospitalization_rooms clinic_hospitalization_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_hospitalization_rooms
    ADD CONSTRAINT clinic_hospitalization_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4461 (class 2606 OID 16813)
-- Name: clinic_locations clinic_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations
    ADD CONSTRAINT clinic_locations_pkey PRIMARY KEY (location_id);


--
-- TOC entry 4475 (class 2606 OID 16890)
-- Name: clinic_medical_services clinic_medical_services_clinic_id_medical_service_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_clinic_id_medical_service_id_key UNIQUE (clinic_id, medical_service_id);


--
-- TOC entry 4477 (class 2606 OID 16888)
-- Name: clinic_medical_services clinic_medical_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_pkey PRIMARY KEY (clinic_medical_service_id);


--
-- TOC entry 4510 (class 2606 OID 17581)
-- Name: clinic_patients clinic_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_patients
    ADD CONSTRAINT clinic_patients_pkey PRIMARY KEY (id);


--
-- TOC entry 4487 (class 2606 OID 16962)
-- Name: clinic_phone_numbers clinic_phone_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers
    ADD CONSTRAINT clinic_phone_numbers_pkey PRIMARY KEY (id);


--
-- TOC entry 4457 (class 2606 OID 16779)
-- Name: clinic_social_media clinic_social_media_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT clinic_social_media_pkey PRIMARY KEY (link_id);


--
-- TOC entry 4497 (class 2606 OID 17249)
-- Name: clinic_veterinarians clinic_veterinarians_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_veterinarians
    ADD CONSTRAINT clinic_veterinarians_pkey PRIMARY KEY (id);


--
-- TOC entry 4449 (class 2606 OID 16595)
-- Name: clinic_albums clinicalbum_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums
    ADD CONSTRAINT clinicalbum_pkey PRIMARY KEY (clinic_album_photo_id);


--
-- TOC entry 4453 (class 2606 OID 16650)
-- Name: reviews clinicreviews_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pkey PRIMARY KEY (clinic_review_id);


--
-- TOC entry 4444 (class 2606 OID 16580)
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id);


--
-- TOC entry 4446 (class 2606 OID 17308)
-- Name: clinics clinics_slug_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_slug_key UNIQUE (slug);


--
-- TOC entry 4535 (class 2606 OID 17973)
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (diagnosis_id);


--
-- TOC entry 4533 (class 2606 OID 17944)
-- Name: examinations examinations_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_pkey PRIMARY KEY (examination_id);


--
-- TOC entry 4516 (class 2606 OID 17622)
-- Name: inventory_categories inventory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT inventory_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4520 (class 2606 OID 17642)
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4525 (class 2606 OID 17673)
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4471 (class 2606 OID 16878)
-- Name: medical_services medical_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services
    ADD CONSTRAINT medical_services_pkey PRIMARY KEY (medical_service_id);


--
-- TOC entry 4473 (class 2606 OID 16880)
-- Name: medical_services medical_services_service_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services
    ADD CONSTRAINT medical_services_service_name_key UNIQUE (service_name);


--
-- TOC entry 4455 (class 2606 OID 16719)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (reset_token_id);


--
-- TOC entry 4531 (class 2606 OID 17902)
-- Name: pet_hospitalizations pet_hospitalizations_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_hospitalizations
    ADD CONSTRAINT pet_hospitalizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4506 (class 2606 OID 17343)
-- Name: pet_owner_favorite_clinics pet_owner_favorite_clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owner_favorite_clinics
    ADD CONSTRAINT pet_owner_favorite_clinics_pkey PRIMARY KEY (favorite_id);


--
-- TOC entry 4438 (class 2606 OID 16549)
-- Name: pet_owners petowners_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT petowners_pkey PRIMARY KEY (pet_owner_id);


--
-- TOC entry 4440 (class 2606 OID 17604)
-- Name: pets pets_chip_number_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_chip_number_key UNIQUE (chip_number);


--
-- TOC entry 4442 (class 2606 OID 16563)
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (pet_id);


--
-- TOC entry 4537 (class 2606 OID 18141)
-- Name: standard_diagnoses standard_diagnoses_code_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_code_key UNIQUE (code);


--
-- TOC entry 4539 (class 2606 OID 18145)
-- Name: standard_diagnoses standard_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_pkey PRIMARY KEY (diagnosis_id);


--
-- TOC entry 4514 (class 2606 OID 17583)
-- Name: clinic_patients unique_clinic_pet; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_patients
    ADD CONSTRAINT unique_clinic_pet UNIQUE (clinic_id, pet_id);


--
-- TOC entry 4459 (class 2606 OID 16781)
-- Name: clinic_social_media unique_clinic_platform; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT unique_clinic_platform UNIQUE (clinic_id, platform);


--
-- TOC entry 4508 (class 2606 OID 17345)
-- Name: pet_owner_favorite_clinics unique_pet_owner_clinic; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owner_favorite_clinics
    ADD CONSTRAINT unique_pet_owner_clinic UNIQUE (pet_owner_id, clinic_id);


--
-- TOC entry 4502 (class 2606 OID 17251)
-- Name: clinic_veterinarians unique_veterinarian; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_veterinarians
    ADD CONSTRAINT unique_veterinarian UNIQUE (veterinarian_id);


--
-- TOC entry 4430 (class 2606 OID 16527)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4432 (class 2606 OID 16529)
-- Name: users users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_email_key UNIQUE (user_email);


--
-- TOC entry 4495 (class 2606 OID 17180)
-- Name: veterinarian_albums veterinarian_album_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_albums
    ADD CONSTRAINT veterinarian_album_pkey PRIMARY KEY (veterinarian_album_photo_id);


--
-- TOC entry 4491 (class 2606 OID 17112)
-- Name: veterinarian_certifications veterinarian_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT veterinarian_certifications_pkey PRIMARY KEY (certification_id);


--
-- TOC entry 4489 (class 2606 OID 17092)
-- Name: veterinarian_education veterinarian_education_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT veterinarian_education_pkey PRIMARY KEY (education_id);


--
-- TOC entry 4493 (class 2606 OID 17130)
-- Name: veterinarian_expertise veterinarian_expertise_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT veterinarian_expertise_pkey PRIMARY KEY (expertise_id);


--
-- TOC entry 4434 (class 2606 OID 16539)
-- Name: veterinarians veterinarians_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_pkey PRIMARY KEY (veterinarian_id);


--
-- TOC entry 4436 (class 2606 OID 17213)
-- Name: veterinarians veterinarians_slug_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_slug_key UNIQUE (slug);


--
-- TOC entry 4511 (class 1259 OID 17584)
-- Name: idx_clinic_patients_clinic_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_patients_clinic_id ON public.clinic_patients USING btree (clinic_id);


--
-- TOC entry 4512 (class 1259 OID 17585)
-- Name: idx_clinic_patients_pet_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_patients_pet_id ON public.clinic_patients USING btree (pet_id);


--
-- TOC entry 4447 (class 1259 OID 17309)
-- Name: idx_clinic_slug; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_slug ON public.clinics USING btree (slug);


--
-- TOC entry 4498 (class 1259 OID 17262)
-- Name: idx_clinic_veterinarians_clinic_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_veterinarians_clinic_id ON public.clinic_veterinarians USING btree (clinic_id);


--
-- TOC entry 4499 (class 1259 OID 17264)
-- Name: idx_clinic_veterinarians_status; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_veterinarians_status ON public.clinic_veterinarians USING btree (status);


--
-- TOC entry 4500 (class 1259 OID 17263)
-- Name: idx_clinic_veterinarians_veterinarian_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_clinic_veterinarians_veterinarian_id ON public.clinic_veterinarians USING btree (veterinarian_id);


--
-- TOC entry 4517 (class 1259 OID 17650)
-- Name: idx_inventory_items_category; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_inventory_items_category ON public.inventory_items USING btree (category_id);


--
-- TOC entry 4518 (class 1259 OID 17762)
-- Name: idx_inventory_items_clinic; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_inventory_items_clinic ON public.inventory_items USING btree (clinic_id);


--
-- TOC entry 4521 (class 1259 OID 17680)
-- Name: idx_inventory_transactions_clinic; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_inventory_transactions_clinic ON public.inventory_transactions USING btree (clinic_id);


--
-- TOC entry 4522 (class 1259 OID 17681)
-- Name: idx_inventory_transactions_date; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions USING btree (transaction_date);


--
-- TOC entry 4523 (class 1259 OID 17679)
-- Name: idx_inventory_transactions_item; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_inventory_transactions_item ON public.inventory_transactions USING btree (inventory_item_id);


--
-- TOC entry 4503 (class 1259 OID 17365)
-- Name: idx_pet_owner_favorite_clinics_clinic_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_pet_owner_favorite_clinics_clinic_id ON public.pet_owner_favorite_clinics USING btree (clinic_id);


--
-- TOC entry 4504 (class 1259 OID 17364)
-- Name: idx_pet_owner_favorite_clinics_pet_owner_id; Type: INDEX; Schema: public; Owner: petlystAdmin
--

CREATE INDEX idx_pet_owner_favorite_clinics_pet_owner_id ON public.pet_owner_favorite_clinics USING btree (pet_owner_id);


--
-- TOC entry 4592 (class 2620 OID 17630)
-- Name: inventory_categories update_inventory_categories_timestamp; Type: TRIGGER; Schema: public; Owner: petlystAdmin
--

CREATE TRIGGER update_inventory_categories_timestamp BEFORE UPDATE ON public.inventory_categories FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- TOC entry 4593 (class 2620 OID 17648)
-- Name: inventory_items update_inventory_items_timestamp; Type: TRIGGER; Schema: public; Owner: petlystAdmin
--

CREATE TRIGGER update_inventory_items_timestamp BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();


--
-- TOC entry 4545 (class 2606 OID 16612)
-- Name: appointments appointments_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4561 (class 2606 OID 16928)
-- Name: clinic_additional_services clinic_additional_services_additional_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_additional_service_id_fkey FOREIGN KEY (additional_service_id) REFERENCES public.additional_services(additional_service_id) ON DELETE CASCADE;


--
-- TOC entry 4562 (class 2606 OID 16923)
-- Name: clinic_additional_services clinic_additional_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4557 (class 2606 OID 16866)
-- Name: clinic_animal_types clinic_animal_types_animal_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_animal_type_id_fkey FOREIGN KEY (animal_type_id) REFERENCES public.animal_types(animal_type_id) ON DELETE CASCADE;


--
-- TOC entry 4558 (class 2606 OID 16861)
-- Name: clinic_animal_types clinic_animal_types_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4584 (class 2606 OID 17889)
-- Name: clinic_hospitalization_rooms clinic_hospitalization_rooms_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_hospitalization_rooms
    ADD CONSTRAINT clinic_hospitalization_rooms_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4556 (class 2606 OID 16814)
-- Name: clinic_locations clinic_locations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations
    ADD CONSTRAINT clinic_locations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4559 (class 2606 OID 16891)
-- Name: clinic_medical_services clinic_medical_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4560 (class 2606 OID 16896)
-- Name: clinic_medical_services clinic_medical_services_medical_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_medical_service_id_fkey FOREIGN KEY (medical_service_id) REFERENCES public.medical_services(medical_service_id) ON DELETE CASCADE;


--
-- TOC entry 4575 (class 2606 OID 17586)
-- Name: clinic_patients clinic_patients_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_patients
    ADD CONSTRAINT clinic_patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4576 (class 2606 OID 17591)
-- Name: clinic_patients clinic_patients_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_patients
    ADD CONSTRAINT clinic_patients_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id) ON DELETE CASCADE;


--
-- TOC entry 4563 (class 2606 OID 16963)
-- Name: clinic_phone_numbers clinic_phone_numbers_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers
    ADD CONSTRAINT clinic_phone_numbers_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4555 (class 2606 OID 16782)
-- Name: clinic_social_media clinic_social_media_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT clinic_social_media_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4571 (class 2606 OID 17252)
-- Name: clinic_veterinarians clinic_veterinarians_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_veterinarians
    ADD CONSTRAINT clinic_veterinarians_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4572 (class 2606 OID 17257)
-- Name: clinic_veterinarians clinic_veterinarians_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_veterinarians
    ADD CONSTRAINT clinic_veterinarians_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4544 (class 2606 OID 16596)
-- Name: clinic_albums clinicalbum_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums
    ADD CONSTRAINT clinicalbum_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4548 (class 2606 OID 16666)
-- Name: reviews clinicreviews_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- TOC entry 4549 (class 2606 OID 16656)
-- Name: reviews clinicreviews_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4550 (class 2606 OID 16661)
-- Name: reviews clinicreviews_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4551 (class 2606 OID 16651)
-- Name: reviews clinicreviews_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id);


--
-- TOC entry 4543 (class 2606 OID 16581)
-- Name: clinics clinics_clinic_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_clinic_operator_id_fkey FOREIGN KEY (clinic_operator_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4590 (class 2606 OID 17974)
-- Name: diagnoses diagnoses_examination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_examination_id_fkey FOREIGN KEY (examination_id) REFERENCES public.examinations(examination_id);


--
-- TOC entry 4552 (class 2606 OID 16706)
-- Name: emergency_contacts emergencycontacts_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergencycontacts_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4587 (class 2606 OID 17955)
-- Name: examinations examinations_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- TOC entry 4588 (class 2606 OID 17945)
-- Name: examinations examinations_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4589 (class 2606 OID 17950)
-- Name: examinations examinations_vet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.examinations
    ADD CONSTRAINT examinations_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4546 (class 2606 OID 17327)
-- Name: appointments fk_clinic; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT fk_clinic FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4573 (class 2606 OID 17351)
-- Name: pet_owner_favorite_clinics fk_clinic; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owner_favorite_clinics
    ADD CONSTRAINT fk_clinic FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4577 (class 2606 OID 17791)
-- Name: inventory_categories fk_inventory_categories_clinic; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT fk_inventory_categories_clinic FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4578 (class 2606 OID 17796)
-- Name: inventory_categories fk_inventory_categories_created_by; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT fk_inventory_categories_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 4579 (class 2606 OID 17830)
-- Name: inventory_categories fk_inventory_categories_parent; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT fk_inventory_categories_parent FOREIGN KEY (parent_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL;


--
-- TOC entry 4580 (class 2606 OID 17835)
-- Name: inventory_items fk_inventory_items_category; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT fk_inventory_items_category FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) ON DELETE CASCADE;


--
-- TOC entry 4581 (class 2606 OID 17768)
-- Name: inventory_items fk_inventory_items_clinic; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT fk_inventory_items_clinic FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4582 (class 2606 OID 17773)
-- Name: inventory_items fk_inventory_items_created_by; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT fk_inventory_items_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 4583 (class 2606 OID 17840)
-- Name: inventory_transactions fk_inventory_transactions_item; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT fk_inventory_transactions_item FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- TOC entry 4574 (class 2606 OID 17346)
-- Name: pet_owner_favorite_clinics fk_pet_owner; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owner_favorite_clinics
    ADD CONSTRAINT fk_pet_owner FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id) ON DELETE CASCADE;


--
-- TOC entry 4547 (class 2606 OID 17357)
-- Name: appointments fk_pet_owner; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT fk_pet_owner FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id);


--
-- TOC entry 4566 (class 2606 OID 17118)
-- Name: veterinarian_certifications fk_veterinarian_certifications; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT fk_veterinarian_certifications FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4564 (class 2606 OID 17098)
-- Name: veterinarian_education fk_veterinarian_education; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT fk_veterinarian_education FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4568 (class 2606 OID 17136)
-- Name: veterinarian_expertise fk_veterinarian_expertise; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT fk_veterinarian_expertise FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4553 (class 2606 OID 16725)
-- Name: password_reset_tokens password_reset_tokens_user_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(user_email);


--
-- TOC entry 4554 (class 2606 OID 16720)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4585 (class 2606 OID 17908)
-- Name: pet_hospitalizations pet_hospitalizations_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_hospitalizations
    ADD CONSTRAINT pet_hospitalizations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4586 (class 2606 OID 17903)
-- Name: pet_hospitalizations pet_hospitalizations_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_hospitalizations
    ADD CONSTRAINT pet_hospitalizations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.clinic_hospitalization_rooms(id);


--
-- TOC entry 4541 (class 2606 OID 16550)
-- Name: pet_owners petowners_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT petowners_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.users(user_id);


--
-- TOC entry 4542 (class 2606 OID 16564)
-- Name: pets pets_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id);


--
-- TOC entry 4591 (class 2606 OID 18146)
-- Name: standard_diagnoses standard_diagnoses_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.standard_diagnoses
    ADD CONSTRAINT standard_diagnoses_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4570 (class 2606 OID 17181)
-- Name: veterinarian_albums veterinarian_album_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_albums
    ADD CONSTRAINT veterinarian_album_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4567 (class 2606 OID 17113)
-- Name: veterinarian_certifications veterinarian_certifications_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT veterinarian_certifications_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4565 (class 2606 OID 17093)
-- Name: veterinarian_education veterinarian_education_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT veterinarian_education_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4569 (class 2606 OID 17131)
-- Name: veterinarian_expertise veterinarian_expertise_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT veterinarian_expertise_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4540 (class 2606 OID 16540)
-- Name: veterinarians veterinarians_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.users(user_id);


-- Completed on 2025-05-05 17:35:55

--
-- PostgreSQL database dump complete
--

