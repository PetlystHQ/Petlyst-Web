--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2025-03-31 20:11:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 896 (class 1247 OID 16506)
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
-- TOC entry 962 (class 1247 OID 17004)
-- Name: clinic_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.clinic_type_enum AS ENUM (
    'veterinary_clinic',
    'animal_hospital'
);


ALTER TYPE public.clinic_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 893 (class 1247 OID 16498)
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
-- TOC entry 890 (class 1247 OID 16486)
-- Name: pet_species_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.pet_species_enum AS ENUM (
    'cat',
    'dog',
    'rabbit',
    'hamster',
    'bird'
);


ALTER TYPE public.pet_species_enum OWNER TO "petlystAdmin";

--
-- TOC entry 956 (class 1247 OID 16941)
-- Name: phone_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.phone_type_enum AS ENUM (
    'fixed_line',
    'mobile_number'
);


ALTER TYPE public.phone_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 884 (class 1247 OID 16471)
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.user_type_enum AS ENUM (
    'veterinarian',
    'pet_owner',
    'admin'
);


ALTER TYPE public.user_type_enum OWNER TO "petlystAdmin";

--
-- TOC entry 887 (class 1247 OID 16478)
-- Name: veterinarian_verification_status_enum; Type: TYPE; Schema: public; Owner: petlystAdmin
--

CREATE TYPE public.veterinarian_verification_status_enum AS ENUM (
    'not_verified',
    'pending',
    'verified'
);


ALTER TYPE public.veterinarian_verification_status_enum OWNER TO "petlystAdmin";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 247 (class 1259 OID 16902)
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
-- TOC entry 246 (class 1259 OID 16901)
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
-- TOC entry 4608 (class 0 OID 0)
-- Dependencies: 246
-- Name: additional_services_additional_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.additional_services_additional_service_id_seq OWNED BY public.additional_services.additional_service_id;


--
-- TOC entry 239 (class 1259 OID 16842)
-- Name: animal_types; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.animal_types (
    animal_type_id integer NOT NULL,
    animal_type_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.animal_types OWNER TO "petlystAdmin";

--
-- TOC entry 238 (class 1259 OID 16841)
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
-- TOC entry 4609 (class 0 OID 0)
-- Dependencies: 238
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
    pet_id integer NOT NULL,
    clinic_id integer NOT NULL,
    veterinarian_id integer NOT NULL,
    meeting_url text,
    appointment_start_hour timestamp without time zone NOT NULL,
    appointment_status public.appointment_status_enum DEFAULT 'pending'::public.appointment_status_enum,
    notes text,
    appointment_end_hour timestamp without time zone NOT NULL,
    meeting_password character varying(255),
    appointment_date date NOT NULL
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
-- TOC entry 4610 (class 0 OID 0)
-- Dependencies: 225
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- TOC entry 249 (class 1259 OID 16914)
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
-- TOC entry 248 (class 1259 OID 16913)
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
-- TOC entry 4611 (class 0 OID 0)
-- Dependencies: 248
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
-- TOC entry 241 (class 1259 OID 16852)
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
-- TOC entry 240 (class 1259 OID 16851)
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
-- TOC entry 4612 (class 0 OID 0)
-- Dependencies: 240
-- Name: clinic_animal_types_clinic_animal_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_animal_types_clinic_animal_type_id_seq OWNED BY public.clinic_animal_types.clinic_animal_type_id;


--
-- TOC entry 237 (class 1259 OID 16806)
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
-- TOC entry 236 (class 1259 OID 16805)
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
-- TOC entry 4613 (class 0 OID 0)
-- Dependencies: 236
-- Name: clinic_locations_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_locations_location_id_seq OWNED BY public.clinic_locations.location_id;


--
-- TOC entry 245 (class 1259 OID 16882)
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
-- TOC entry 244 (class 1259 OID 16881)
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
-- TOC entry 4614 (class 0 OID 0)
-- Dependencies: 244
-- Name: clinic_medical_services_clinic_medical_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_medical_services_clinic_medical_service_id_seq OWNED BY public.clinic_medical_services.clinic_medical_service_id;


--
-- TOC entry 251 (class 1259 OID 16955)
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
-- TOC entry 250 (class 1259 OID 16954)
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
-- TOC entry 4615 (class 0 OID 0)
-- Dependencies: 250
-- Name: clinic_phone_numbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_phone_numbers_id_seq OWNED BY public.clinic_phone_numbers.id;


--
-- TOC entry 235 (class 1259 OID 16774)
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
-- TOC entry 234 (class 1259 OID 16773)
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
-- TOC entry 4616 (class 0 OID 0)
-- Dependencies: 234
-- Name: clinic_social_media_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinic_social_media_link_id_seq OWNED BY public.clinic_social_media.link_id;


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
-- TOC entry 4617 (class 0 OID 0)
-- Dependencies: 223
-- Name: clinicalbum_clinic_album_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinicalbum_clinic_album_photo_id_seq OWNED BY public.clinic_albums.clinic_album_photo_id;


--
-- TOC entry 230 (class 1259 OID 16642)
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
-- TOC entry 229 (class 1259 OID 16641)
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
-- TOC entry 4618 (class 0 OID 0)
-- Dependencies: 229
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
    CONSTRAINT clinics_establishment_month_check CHECK (((establishment_month >= 1) AND (establishment_month <= 12)))
);


ALTER TABLE public.clinics OWNER TO "petlystAdmin";

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
-- TOC entry 4619 (class 0 OID 0)
-- Dependencies: 221
-- Name: clinics_clinic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.clinics_clinic_id_seq OWNED BY public.clinics.clinic_id;


--
-- TOC entry 231 (class 1259 OID 16701)
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
-- TOC entry 243 (class 1259 OID 16872)
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
-- TOC entry 242 (class 1259 OID 16871)
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
-- TOC entry 4620 (class 0 OID 0)
-- Dependencies: 242
-- Name: medical_services_medical_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.medical_services_medical_service_id_seq OWNED BY public.medical_services.medical_service_id;


--
-- TOC entry 233 (class 1259 OID 16712)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.password_reset_tokens (
    reset_token_id integer NOT NULL,
    user_id integer NOT NULL,
    user_email character varying(255) NOT NULL,
    reset_code character varying(10) NOT NULL,
    reset_token_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reset_token_expires_at timestamp without time zone NOT NULL,
    reset_token_is_used boolean DEFAULT false
);


ALTER TABLE public.password_reset_tokens OWNER TO "petlystAdmin";

--
-- TOC entry 232 (class 1259 OID 16711)
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
-- TOC entry 4621 (class 0 OID 0)
-- Dependencies: 232
-- Name: password_reset_tokens_reset_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.password_reset_tokens_reset_token_id_seq OWNED BY public.password_reset_tokens.reset_token_id;


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
    pet_species public.pet_species_enum NOT NULL,
    pet_breed character varying(255) NOT NULL,
    pet_birth_date date,
    pet_photo text
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
-- TOC entry 4622 (class 0 OID 0)
-- Dependencies: 219
-- Name: pets_pet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.pets_pet_id_seq OWNED BY public.pets.pet_id;


--
-- TOC entry 228 (class 1259 OID 16628)
-- Name: treatments; Type: TABLE; Schema: public; Owner: petlystAdmin
--

CREATE TABLE public.treatments (
    treatment_id integer NOT NULL,
    appointment_id integer NOT NULL,
    description text NOT NULL,
    actions text,
    materials text,
    diagnosis text
);


ALTER TABLE public.treatments OWNER TO "petlystAdmin";

--
-- TOC entry 227 (class 1259 OID 16627)
-- Name: treatments_treatment_id_seq; Type: SEQUENCE; Schema: public; Owner: petlystAdmin
--

CREATE SEQUENCE public.treatments_treatment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.treatments_treatment_id_seq OWNER TO "petlystAdmin";

--
-- TOC entry 4623 (class 0 OID 0)
-- Dependencies: 227
-- Name: treatments_treatment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.treatments_treatment_id_seq OWNED BY public.treatments.treatment_id;


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
-- TOC entry 4624 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 259 (class 1259 OID 17173)
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
-- TOC entry 258 (class 1259 OID 17172)
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
-- TOC entry 4625 (class 0 OID 0)
-- Dependencies: 258
-- Name: veterinarian_album_veterinarian_album_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_album_veterinarian_album_photo_id_seq OWNED BY public.veterinarian_albums.veterinarian_album_photo_id;


--
-- TOC entry 255 (class 1259 OID 17104)
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
-- TOC entry 254 (class 1259 OID 17103)
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
-- TOC entry 4626 (class 0 OID 0)
-- Dependencies: 254
-- Name: veterinarian_certifications_certification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_certifications_certification_id_seq OWNED BY public.veterinarian_certifications.certification_id;


--
-- TOC entry 253 (class 1259 OID 17083)
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
-- TOC entry 252 (class 1259 OID 17082)
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
-- TOC entry 4627 (class 0 OID 0)
-- Dependencies: 252
-- Name: veterinarian_education_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: petlystAdmin
--

ALTER SEQUENCE public.veterinarian_education_education_id_seq OWNED BY public.veterinarian_education.education_id;


--
-- TOC entry 257 (class 1259 OID 17124)
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
-- TOC entry 256 (class 1259 OID 17123)
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
-- TOC entry 4628 (class 0 OID 0)
-- Dependencies: 256
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
    preferred_languages character varying(100)[]
);


ALTER TABLE public.veterinarians OWNER TO "petlystAdmin";

--
-- TOC entry 4305 (class 2604 OID 16905)
-- Name: additional_services additional_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services ALTER COLUMN additional_service_id SET DEFAULT nextval('public.additional_services_additional_service_id_seq'::regclass);


--
-- TOC entry 4297 (class 2604 OID 16845)
-- Name: animal_types animal_type_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types ALTER COLUMN animal_type_id SET DEFAULT nextval('public.animal_types_animal_type_id_seq'::regclass);


--
-- TOC entry 4286 (class 2604 OID 16605)
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- TOC entry 4307 (class 2604 OID 16917)
-- Name: clinic_additional_services clinic_additional_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services ALTER COLUMN clinic_additional_service_id SET DEFAULT nextval('public.clinic_additional_services_clinic_additional_service_id_seq'::regclass);


--
-- TOC entry 4284 (class 2604 OID 16590)
-- Name: clinic_albums clinic_album_photo_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums ALTER COLUMN clinic_album_photo_id SET DEFAULT nextval('public.clinicalbum_clinic_album_photo_id_seq'::regclass);


--
-- TOC entry 4299 (class 2604 OID 16855)
-- Name: clinic_animal_types clinic_animal_type_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types ALTER COLUMN clinic_animal_type_id SET DEFAULT nextval('public.clinic_animal_types_clinic_animal_type_id_seq'::regclass);


--
-- TOC entry 4296 (class 2604 OID 16809)
-- Name: clinic_locations location_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations ALTER COLUMN location_id SET DEFAULT nextval('public.clinic_locations_location_id_seq'::regclass);


--
-- TOC entry 4303 (class 2604 OID 16885)
-- Name: clinic_medical_services clinic_medical_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services ALTER COLUMN clinic_medical_service_id SET DEFAULT nextval('public.clinic_medical_services_clinic_medical_service_id_seq'::regclass);


--
-- TOC entry 4309 (class 2604 OID 16958)
-- Name: clinic_phone_numbers id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers ALTER COLUMN id SET DEFAULT nextval('public.clinic_phone_numbers_id_seq'::regclass);


--
-- TOC entry 4295 (class 2604 OID 16777)
-- Name: clinic_social_media link_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media ALTER COLUMN link_id SET DEFAULT nextval('public.clinic_social_media_link_id_seq'::regclass);


--
-- TOC entry 4280 (class 2604 OID 16573)
-- Name: clinics clinic_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics ALTER COLUMN clinic_id SET DEFAULT nextval('public.clinics_clinic_id_seq'::regclass);


--
-- TOC entry 4301 (class 2604 OID 16875)
-- Name: medical_services medical_service_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services ALTER COLUMN medical_service_id SET DEFAULT nextval('public.medical_services_medical_service_id_seq'::regclass);


--
-- TOC entry 4292 (class 2604 OID 16715)
-- Name: password_reset_tokens reset_token_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN reset_token_id SET DEFAULT nextval('public.password_reset_tokens_reset_token_id_seq'::regclass);


--
-- TOC entry 4279 (class 2604 OID 16559)
-- Name: pets pet_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets ALTER COLUMN pet_id SET DEFAULT nextval('public.pets_pet_id_seq'::regclass);


--
-- TOC entry 4290 (class 2604 OID 16645)
-- Name: reviews clinic_review_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews ALTER COLUMN clinic_review_id SET DEFAULT nextval('public.clinicreviews_clinic_review_id_seq'::regclass);


--
-- TOC entry 4289 (class 2604 OID 16631)
-- Name: treatments treatment_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.treatments ALTER COLUMN treatment_id SET DEFAULT nextval('public.treatments_treatment_id_seq'::regclass);


--
-- TOC entry 4273 (class 2604 OID 16521)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4315 (class 2604 OID 17107)
-- Name: veterinarian_certifications certification_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications ALTER COLUMN certification_id SET DEFAULT nextval('public.veterinarian_certifications_certification_id_seq'::regclass);


--
-- TOC entry 4312 (class 2604 OID 17086)
-- Name: veterinarian_education education_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education ALTER COLUMN education_id SET DEFAULT nextval('public.veterinarian_education_education_id_seq'::regclass);


--
-- TOC entry 4317 (class 2604 OID 17127)
-- Name: veterinarian_expertise expertise_id; Type: DEFAULT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise ALTER COLUMN expertise_id SET DEFAULT nextval('public.veterinarian_expertise_expertise_id_seq'::regclass);


--
-- TOC entry 4590 (class 0 OID 16902)
-- Dependencies: 247
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
-- TOC entry 4582 (class 0 OID 16842)
-- Dependencies: 239
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
-- TOC entry 4569 (class 0 OID 16602)
-- Dependencies: 226
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.appointments (appointment_id, video_meeting, pet_id, clinic_id, veterinarian_id, meeting_url, appointment_start_hour, appointment_status, notes, appointment_end_hour, meeting_password, appointment_date) FROM stdin;
\.


--
-- TOC entry 4592 (class 0 OID 16914)
-- Dependencies: 249
-- Data for Name: clinic_additional_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_additional_services (clinic_additional_service_id, clinic_id, additional_service_id, created_at) FROM stdin;
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
\.


--
-- TOC entry 4567 (class 0 OID 16587)
-- Dependencies: 224
-- Data for Name: clinic_albums; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_albums (clinic_album_photo_id, clinic_id, clinic_album_photo_url, clinic_album_photo_url_created_at, clinic_type) FROM stdin;
32	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-veterinary-clinic/1742771566577.jpg	2025-03-23 23:12:47.863361	veterinary_clinic
35	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-veterinary-clinic/1742771626708.jpg	2025-03-23 23:13:48.284492	veterinary_clinic
39	74	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/74-sara-hane-veterinary-clinic/1742852659945.png	2025-03-24 21:44:20.051239	veterinary_clinic
40	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105048.jpg	2025-03-28 13:55:04.749703	animal_hospital
41	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105503.jpg	2025-03-28 13:55:05.305211	animal_hospital
42	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105542.jpg	2025-03-28 13:55:05.442929	animal_hospital
43	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105530.jpg	2025-03-28 13:55:05.474486	animal_hospital
44	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105559.jpg	2025-03-28 13:55:05.480284	animal_hospital
45	75	https://petlyst-s3.s3.eu-central-1.amazonaws.com/clinic-photos/75-eryaman-animal-hospital/1743170105516.jpg	2025-03-28 13:55:05.502147	animal_hospital
\.


--
-- TOC entry 4584 (class 0 OID 16852)
-- Dependencies: 241
-- Data for Name: clinic_animal_types; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_animal_types (clinic_animal_type_id, clinic_id, animal_type_id, created_at) FROM stdin;
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
\.


--
-- TOC entry 4580 (class 0 OID 16806)
-- Dependencies: 237
-- Data for Name: clinic_locations; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_locations (location_id, clinic_id, province, district, clinic_address, latitude, longitude) FROM stdin;
48	74	Ankara	Çankaya	Çamlıtepe, Dede Efendi Cd. No:81, 06590 Çankaya/Ankara, Türkiye	39.9256335	32.8709438
49	75	Ankara	Etimesgut	Şehit Osman Avcı, 45. Sk. No:2, 06820 Etimesgut/Ankara, Türkiye	39.9783281	32.6492646
\.


--
-- TOC entry 4588 (class 0 OID 16882)
-- Dependencies: 245
-- Data for Name: clinic_medical_services; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_medical_services (clinic_medical_service_id, clinic_id, medical_service_id, created_at) FROM stdin;
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
\.


--
-- TOC entry 4594 (class 0 OID 16955)
-- Dependencies: 251
-- Data for Name: clinic_phone_numbers; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_phone_numbers (id, clinic_id, phone_number, phone_type, created_at, updated_at) FROM stdin;
48	74	00000000000	fixed_line	2025-03-23 23:12:46.181559	2025-03-23 23:12:46.181559
49	75	01234567891	mobile_number	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
50	75	11242385920	fixed_line	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
51	75	01234723453	mobile_number	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498
\.


--
-- TOC entry 4578 (class 0 OID 16774)
-- Dependencies: 235
-- Data for Name: clinic_social_media; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinic_social_media (link_id, clinic_id, platform, url) FROM stdin;
27	75	Facebook	www.facebook.com
28	75	Instagram	www.instagram.com
29	75	Twitter	www.twitter.com
30	75	LinkedIn	www.linkedin.com
\.


--
-- TOC entry 4565 (class 0 OID 16570)
-- Dependencies: 222
-- Data for Name: clinics; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.clinics (clinic_id, clinic_name, clinic_email, clinic_operator_id, clinic_description, opening_time, closing_time, clinic_created_at, clinic_updated_at, clinic_verification_status, establishment_year, establishment_month, show_phone_number, allow_direct_messages, clinic_creation_status, tax_identification_number, veterinary_license_number, show_mail_address, allow_online_meetings, available_days, emergency_available_days, clinic_time_slots, is_open_24_7, clinic_type) FROM stdin;
75	Eryaman Animal Hospital	eryamanveteriner@gmail.com	27	Eryaman Veterinary Hospital is a state-of-the-art medical facility dedicated to providing comprehensive healthcare for pets, offering a wide range of services including routine check-ups, vaccinations, surgical procedures, emergency care, and specialized treatments. With a team of experienced veterinarians, advanced medical equipment, and a compassionate approach, we are committed to ensuring the highest quality of care for your beloved animal companions, delivering professional and personalized veterinary services that address both preventive health needs and complex medical conditions in a modern, hygienic, and welcoming environment.	09:30:00	17:00:00	2025-03-28 13:55:00.61498	2025-03-28 13:55:00.61498	verified	2023	8	t	t	complete	ERYAMANVET	VETLICENSE	t	t	{t,t,t,t,t,f,f}	{t,t,t,t,t,f,f}	30	No	animal_hospital
74	Saraçhane Animal Hospital	umutdncr@gmail.com	25	İmamoğlu	06:20:00	19:20:00	2025-03-23 23:12:46.181559	2025-03-25 11:19:38.706934	verified	2025	3	t	t	complete	2222222222	5555555555	t	t	{f,f,t,t,t,t,t}	{t,t,f,f,f,t,t}	20	No	animal_hospital
\.


--
-- TOC entry 4574 (class 0 OID 16701)
-- Dependencies: 231
-- Data for Name: emergency_contacts; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.emergency_contacts (pet_id, pet_name, emergency_contact_name, emergency_contact_phone) FROM stdin;
\.


--
-- TOC entry 4586 (class 0 OID 16872)
-- Dependencies: 243
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
-- TOC entry 4576 (class 0 OID 16712)
-- Dependencies: 233
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.password_reset_tokens (reset_token_id, user_id, user_email, reset_code, reset_token_created_at, reset_token_expires_at, reset_token_is_used) FROM stdin;
\.


--
-- TOC entry 4561 (class 0 OID 16545)
-- Dependencies: 218
-- Data for Name: pet_owners; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pet_owners (pet_owner_id) FROM stdin;
23
26
\.


--
-- TOC entry 4563 (class 0 OID 16556)
-- Dependencies: 220
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.pets (pet_id, pet_owner_id, pet_name, pet_species, pet_breed, pet_birth_date, pet_photo) FROM stdin;
12	23	Hddj	dog	Jddk	2025-03-03	https://petlyst-s3.s3.eu-central-1.amazonaws.com/pet-photos/petowner-23/Hddj.jpeg
\.


--
-- TOC entry 4573 (class 0 OID 16642)
-- Dependencies: 230
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.reviews (clinic_review_id, appointment_id, clinic_id, pet_owner_id, pet_id, clinic_review_hygiene_rating, clinic_review_stuff_behaviour_rating, clinic_review_price_rating, comments, clinic_review_date) FROM stdin;
\.


--
-- TOC entry 4571 (class 0 OID 16628)
-- Dependencies: 228
-- Data for Name: treatments; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.treatments (treatment_id, appointment_id, description, actions, materials, diagnosis) FROM stdin;
\.


--
-- TOC entry 4559 (class 0 OID 16518)
-- Dependencies: 216
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.users (user_id, user_type, user_name, user_surname, user_email, user_password, user_phone, user_address, user_profile_photo, user_created_at, user_updated_at) FROM stdin;
23	pet_owner	Tarik	Lafci	tariklafci@gmail.com	$2a$10$o6pIZCCYP1hjVeSJG2yVbeZliInfSmcS8x7/eSiBsVJDGi.VGCQJa	\N	\N	\N	2025-03-11 16:18:00.338218	2025-03-11 16:18:00.338218
24	veterinarian	veteriner	veteriner	veteriner@gmail.com	Veteriner123	\N	\N	\N	2025-03-11 16:45:22.642386	2025-03-11 16:45:22.642386
25	veterinarian	Korhan	Maral	korhan@gmail.com	$2b$10$K8fnwYm.War.v7AFFXT1Cet57z8qtA7.CUV/LfKQG8QurYnHt1a2W	\N	\N	\N	2025-03-12 15:01:43.600885	2025-03-12 15:01:43.600885
26	admin	Umut	Yananer	umutdncr@gmail.com	$2b$10$XcGmKKT1Mux5eIGB7BN24.AOWpDRumSSQrG.yxyhtFNXn/hnZa7q2	\N	\N	\N	2025-03-12 15:02:48.836524	2025-03-12 15:02:48.836524
27	veterinarian	Mehmet	Öztürk	mehmet@gmail.com	$2b$10$ajDuY1isr1.qxguqgXDyfOu47dZ/dTKWLQX14.KwAxPwPNATc98qa	\N	\N	\N	2025-03-27 10:21:52.318334	2025-03-27 10:21:52.318334
\.


--
-- TOC entry 4602 (class 0 OID 17173)
-- Dependencies: 259
-- Data for Name: veterinarian_albums; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_albums (veterinarian_album_photo_id, veterinarian_id, veterinarian_album_photo_url, veterinarian_album_photo_url_created_at) FROM stdin;
\.


--
-- TOC entry 4598 (class 0 OID 17104)
-- Dependencies: 255
-- Data for Name: veterinarian_certifications; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_certifications (certification_id, veterinarian_id, certification_name, issuing_organization, issue_date, certification_number, created_at) FROM stdin;
\.


--
-- TOC entry 4596 (class 0 OID 17083)
-- Dependencies: 253
-- Data for Name: veterinarian_education; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarian_education (education_id, veterinarian_id, school_name, field_of_study, start_date, end_date, is_current, created_at) FROM stdin;
4	27	Hacettepe University	Veterinary Medicine	2002-01-01	2006-01-01	f	2025-03-28 13:40:00.963535
\.


--
-- TOC entry 4600 (class 0 OID 17124)
-- Dependencies: 257
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
\.


--
-- TOC entry 4560 (class 0 OID 16530)
-- Dependencies: 217
-- Data for Name: veterinarians; Type: TABLE DATA; Schema: public; Owner: petlystAdmin
--

COPY public.veterinarians (veterinarian_id, veterinarian_graduate_barcode, veterinarian_verification_status, veterinarian_tc_number, veterinarian_created_at, veterinarian_updated_at, biography, preferred_languages) FROM stdin;
24	\N	not_verified	b9ea071404d499044df72f9a49d805f0:23bbf7c1945d0c79bd8415bd28dfb4b8	2025-03-11 16:46:18.769778	2025-03-11 16:46:18.769778	\N	\N
25	DENEMEBARCODENUMBER	verified	fffa86d3009aaa41d983335a2c98cad2:dfcc12574b47a548ec343df3573899fe	2025-03-12 15:01:43.660487	2025-03-27 22:10:08.993421	Hello, its me Korhan	{spanish,turkish,french,azerbaijan}
27	MEHMETBARCODENUMBER	verified	48c0bcb3a4f2eb27e215ef9c96a9d277:8fc53eec5c3f69faa5273c11853ff0e2	2025-03-27 10:21:52.421944	2025-03-27 10:21:52.421944	\N	\N
\.


--
-- TOC entry 4629 (class 0 OID 0)
-- Dependencies: 246
-- Name: additional_services_additional_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.additional_services_additional_service_id_seq', 17, true);


--
-- TOC entry 4630 (class 0 OID 0)
-- Dependencies: 238
-- Name: animal_types_animal_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.animal_types_animal_type_id_seq', 18, true);


--
-- TOC entry 4631 (class 0 OID 0)
-- Dependencies: 225
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 1, false);


--
-- TOC entry 4632 (class 0 OID 0)
-- Dependencies: 248
-- Name: clinic_additional_services_clinic_additional_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_additional_services_clinic_additional_service_id_seq', 115, true);


--
-- TOC entry 4633 (class 0 OID 0)
-- Dependencies: 240
-- Name: clinic_animal_types_clinic_animal_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_animal_types_clinic_animal_type_id_seq', 106, true);


--
-- TOC entry 4634 (class 0 OID 0)
-- Dependencies: 236
-- Name: clinic_locations_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_locations_location_id_seq', 49, true);


--
-- TOC entry 4635 (class 0 OID 0)
-- Dependencies: 244
-- Name: clinic_medical_services_clinic_medical_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_medical_services_clinic_medical_service_id_seq', 115, true);


--
-- TOC entry 4636 (class 0 OID 0)
-- Dependencies: 250
-- Name: clinic_phone_numbers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_phone_numbers_id_seq', 51, true);


--
-- TOC entry 4637 (class 0 OID 0)
-- Dependencies: 234
-- Name: clinic_social_media_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinic_social_media_link_id_seq', 30, true);


--
-- TOC entry 4638 (class 0 OID 0)
-- Dependencies: 223
-- Name: clinicalbum_clinic_album_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinicalbum_clinic_album_photo_id_seq', 45, true);


--
-- TOC entry 4639 (class 0 OID 0)
-- Dependencies: 229
-- Name: clinicreviews_clinic_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinicreviews_clinic_review_id_seq', 1, false);


--
-- TOC entry 4640 (class 0 OID 0)
-- Dependencies: 221
-- Name: clinics_clinic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.clinics_clinic_id_seq', 75, true);


--
-- TOC entry 4641 (class 0 OID 0)
-- Dependencies: 242
-- Name: medical_services_medical_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.medical_services_medical_service_id_seq', 24, true);


--
-- TOC entry 4642 (class 0 OID 0)
-- Dependencies: 232
-- Name: password_reset_tokens_reset_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.password_reset_tokens_reset_token_id_seq', 1, false);


--
-- TOC entry 4643 (class 0 OID 0)
-- Dependencies: 219
-- Name: pets_pet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.pets_pet_id_seq', 12, true);


--
-- TOC entry 4644 (class 0 OID 0)
-- Dependencies: 227
-- Name: treatments_treatment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.treatments_treatment_id_seq', 1, false);


--
-- TOC entry 4645 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 27, true);


--
-- TOC entry 4646 (class 0 OID 0)
-- Dependencies: 258
-- Name: veterinarian_album_veterinarian_album_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_album_veterinarian_album_photo_id_seq', 1, false);


--
-- TOC entry 4647 (class 0 OID 0)
-- Dependencies: 254
-- Name: veterinarian_certifications_certification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_certifications_certification_id_seq', 1, true);


--
-- TOC entry 4648 (class 0 OID 0)
-- Dependencies: 252
-- Name: veterinarian_education_education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_education_education_id_seq', 4, true);


--
-- TOC entry 4649 (class 0 OID 0)
-- Dependencies: 256
-- Name: veterinarian_expertise_expertise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: petlystAdmin
--

SELECT pg_catalog.setval('public.veterinarian_expertise_expertise_id_seq', 10, true);


--
-- TOC entry 4366 (class 2606 OID 16910)
-- Name: additional_services additional_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services
    ADD CONSTRAINT additional_services_pkey PRIMARY KEY (additional_service_id);


--
-- TOC entry 4368 (class 2606 OID 16912)
-- Name: additional_services additional_services_service_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.additional_services
    ADD CONSTRAINT additional_services_service_name_key UNIQUE (service_name);


--
-- TOC entry 4350 (class 2606 OID 16850)
-- Name: animal_types animal_types_animal_type_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types
    ADD CONSTRAINT animal_types_animal_type_name_key UNIQUE (animal_type_name);


--
-- TOC entry 4352 (class 2606 OID 16848)
-- Name: animal_types animal_types_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.animal_types
    ADD CONSTRAINT animal_types_pkey PRIMARY KEY (animal_type_id);


--
-- TOC entry 4336 (class 2606 OID 16611)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- TOC entry 4370 (class 2606 OID 16922)
-- Name: clinic_additional_services clinic_additional_services_clinic_id_additional_service_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_clinic_id_additional_service_id_key UNIQUE (clinic_id, additional_service_id);


--
-- TOC entry 4372 (class 2606 OID 16920)
-- Name: clinic_additional_services clinic_additional_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_pkey PRIMARY KEY (clinic_additional_service_id);


--
-- TOC entry 4354 (class 2606 OID 16860)
-- Name: clinic_animal_types clinic_animal_types_clinic_id_animal_type_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_clinic_id_animal_type_id_key UNIQUE (clinic_id, animal_type_id);


--
-- TOC entry 4356 (class 2606 OID 16858)
-- Name: clinic_animal_types clinic_animal_types_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_pkey PRIMARY KEY (clinic_animal_type_id);


--
-- TOC entry 4348 (class 2606 OID 16813)
-- Name: clinic_locations clinic_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations
    ADD CONSTRAINT clinic_locations_pkey PRIMARY KEY (location_id);


--
-- TOC entry 4362 (class 2606 OID 16890)
-- Name: clinic_medical_services clinic_medical_services_clinic_id_medical_service_id_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_clinic_id_medical_service_id_key UNIQUE (clinic_id, medical_service_id);


--
-- TOC entry 4364 (class 2606 OID 16888)
-- Name: clinic_medical_services clinic_medical_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_pkey PRIMARY KEY (clinic_medical_service_id);


--
-- TOC entry 4374 (class 2606 OID 16962)
-- Name: clinic_phone_numbers clinic_phone_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers
    ADD CONSTRAINT clinic_phone_numbers_pkey PRIMARY KEY (id);


--
-- TOC entry 4344 (class 2606 OID 16779)
-- Name: clinic_social_media clinic_social_media_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT clinic_social_media_pkey PRIMARY KEY (link_id);


--
-- TOC entry 4334 (class 2606 OID 16595)
-- Name: clinic_albums clinicalbum_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums
    ADD CONSTRAINT clinicalbum_pkey PRIMARY KEY (clinic_album_photo_id);


--
-- TOC entry 4340 (class 2606 OID 16650)
-- Name: reviews clinicreviews_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pkey PRIMARY KEY (clinic_review_id);


--
-- TOC entry 4332 (class 2606 OID 16580)
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (clinic_id);


--
-- TOC entry 4358 (class 2606 OID 16878)
-- Name: medical_services medical_services_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services
    ADD CONSTRAINT medical_services_pkey PRIMARY KEY (medical_service_id);


--
-- TOC entry 4360 (class 2606 OID 16880)
-- Name: medical_services medical_services_service_name_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.medical_services
    ADD CONSTRAINT medical_services_service_name_key UNIQUE (service_name);


--
-- TOC entry 4342 (class 2606 OID 16719)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (reset_token_id);


--
-- TOC entry 4328 (class 2606 OID 16549)
-- Name: pet_owners petowners_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT petowners_pkey PRIMARY KEY (pet_owner_id);


--
-- TOC entry 4330 (class 2606 OID 16563)
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (pet_id);


--
-- TOC entry 4338 (class 2606 OID 16635)
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (treatment_id);


--
-- TOC entry 4346 (class 2606 OID 16781)
-- Name: clinic_social_media unique_clinic_platform; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT unique_clinic_platform UNIQUE (clinic_id, platform);


--
-- TOC entry 4322 (class 2606 OID 16527)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4324 (class 2606 OID 16529)
-- Name: users users_user_email_key; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_email_key UNIQUE (user_email);


--
-- TOC entry 4382 (class 2606 OID 17180)
-- Name: veterinarian_albums veterinarian_album_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_albums
    ADD CONSTRAINT veterinarian_album_pkey PRIMARY KEY (veterinarian_album_photo_id);


--
-- TOC entry 4378 (class 2606 OID 17112)
-- Name: veterinarian_certifications veterinarian_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT veterinarian_certifications_pkey PRIMARY KEY (certification_id);


--
-- TOC entry 4376 (class 2606 OID 17092)
-- Name: veterinarian_education veterinarian_education_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT veterinarian_education_pkey PRIMARY KEY (education_id);


--
-- TOC entry 4380 (class 2606 OID 17130)
-- Name: veterinarian_expertise veterinarian_expertise_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT veterinarian_expertise_pkey PRIMARY KEY (expertise_id);


--
-- TOC entry 4326 (class 2606 OID 16539)
-- Name: veterinarians veterinarians_pkey; Type: CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_pkey PRIMARY KEY (veterinarian_id);


--
-- TOC entry 4388 (class 2606 OID 16622)
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4389 (class 2606 OID 16612)
-- Name: appointments appointments_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4390 (class 2606 OID 16617)
-- Name: appointments appointments_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4405 (class 2606 OID 16928)
-- Name: clinic_additional_services clinic_additional_services_additional_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_additional_service_id_fkey FOREIGN KEY (additional_service_id) REFERENCES public.additional_services(additional_service_id) ON DELETE CASCADE;


--
-- TOC entry 4406 (class 2606 OID 16923)
-- Name: clinic_additional_services clinic_additional_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_additional_services
    ADD CONSTRAINT clinic_additional_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4401 (class 2606 OID 16866)
-- Name: clinic_animal_types clinic_animal_types_animal_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_animal_type_id_fkey FOREIGN KEY (animal_type_id) REFERENCES public.animal_types(animal_type_id) ON DELETE CASCADE;


--
-- TOC entry 4402 (class 2606 OID 16861)
-- Name: clinic_animal_types clinic_animal_types_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_animal_types
    ADD CONSTRAINT clinic_animal_types_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4400 (class 2606 OID 16814)
-- Name: clinic_locations clinic_locations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_locations
    ADD CONSTRAINT clinic_locations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4403 (class 2606 OID 16891)
-- Name: clinic_medical_services clinic_medical_services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4404 (class 2606 OID 16896)
-- Name: clinic_medical_services clinic_medical_services_medical_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_medical_services
    ADD CONSTRAINT clinic_medical_services_medical_service_id_fkey FOREIGN KEY (medical_service_id) REFERENCES public.medical_services(medical_service_id) ON DELETE CASCADE;


--
-- TOC entry 4407 (class 2606 OID 16963)
-- Name: clinic_phone_numbers clinic_phone_numbers_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_phone_numbers
    ADD CONSTRAINT clinic_phone_numbers_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4399 (class 2606 OID 16782)
-- Name: clinic_social_media clinic_social_media_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_social_media
    ADD CONSTRAINT clinic_social_media_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id) ON DELETE CASCADE;


--
-- TOC entry 4387 (class 2606 OID 16596)
-- Name: clinic_albums clinicalbum_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinic_albums
    ADD CONSTRAINT clinicalbum_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4392 (class 2606 OID 16666)
-- Name: reviews clinicreviews_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- TOC entry 4393 (class 2606 OID 16656)
-- Name: reviews clinicreviews_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(clinic_id);


--
-- TOC entry 4394 (class 2606 OID 16661)
-- Name: reviews clinicreviews_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4395 (class 2606 OID 16651)
-- Name: reviews clinicreviews_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT clinicreviews_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id);


--
-- TOC entry 4386 (class 2606 OID 16581)
-- Name: clinics clinics_clinic_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_clinic_operator_id_fkey FOREIGN KEY (clinic_operator_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4396 (class 2606 OID 16706)
-- Name: emergency_contacts emergencycontacts_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.emergency_contacts
    ADD CONSTRAINT emergencycontacts_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(pet_id);


--
-- TOC entry 4410 (class 2606 OID 17118)
-- Name: veterinarian_certifications fk_veterinarian_certifications; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT fk_veterinarian_certifications FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4408 (class 2606 OID 17098)
-- Name: veterinarian_education fk_veterinarian_education; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT fk_veterinarian_education FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4412 (class 2606 OID 17136)
-- Name: veterinarian_expertise fk_veterinarian_expertise; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT fk_veterinarian_expertise FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4397 (class 2606 OID 16725)
-- Name: password_reset_tokens password_reset_tokens_user_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(user_email);


--
-- TOC entry 4398 (class 2606 OID 16720)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4384 (class 2606 OID 16550)
-- Name: pet_owners petowners_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pet_owners
    ADD CONSTRAINT petowners_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.users(user_id);


--
-- TOC entry 4385 (class 2606 OID 16564)
-- Name: pets pets_pet_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pet_owner_id_fkey FOREIGN KEY (pet_owner_id) REFERENCES public.pet_owners(pet_owner_id);


--
-- TOC entry 4391 (class 2606 OID 16636)
-- Name: treatments treatments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- TOC entry 4414 (class 2606 OID 17181)
-- Name: veterinarian_albums veterinarian_album_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_albums
    ADD CONSTRAINT veterinarian_album_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id) ON DELETE CASCADE;


--
-- TOC entry 4411 (class 2606 OID 17113)
-- Name: veterinarian_certifications veterinarian_certifications_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_certifications
    ADD CONSTRAINT veterinarian_certifications_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4409 (class 2606 OID 17093)
-- Name: veterinarian_education veterinarian_education_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_education
    ADD CONSTRAINT veterinarian_education_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4413 (class 2606 OID 17131)
-- Name: veterinarian_expertise veterinarian_expertise_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarian_expertise
    ADD CONSTRAINT veterinarian_expertise_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.veterinarians(veterinarian_id);


--
-- TOC entry 4383 (class 2606 OID 16540)
-- Name: veterinarians veterinarians_veterinarian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: petlystAdmin
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_veterinarian_id_fkey FOREIGN KEY (veterinarian_id) REFERENCES public.users(user_id);


-- Completed on 2025-03-31 20:11:39

--
-- PostgreSQL database dump complete
--

