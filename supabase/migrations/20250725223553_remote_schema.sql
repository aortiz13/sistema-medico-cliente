

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Inserta una nueva fila en la tabla 'profiles'
  -- Toma el rol de los metadatos de la invitación, o usa 'asistente' si no existe.
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'asistente')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."create_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_new_consultation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$-- DECLARACIÓN DE LA FUNCIÓN
BEGIN
  -- Realiza una solicitud HTTP POST a la Edge Function 'process-consultation'
  PERFORM net.http_post(
    -- URL de tu Edge Function
    url:='https://xhzcdwuryytnwpvpxtes.functions.supabase.co/process-consultation',
    
    -- Cabeceras de la solicitud
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.raw', true)
    ),
    
    -- Cuerpo de la solicitud
    -- CORRECCIÓN: Se vuelve a añadir 'consultation_type' para que la Edge Function lo reciba.
    body:=jsonb_build_object(
      'record', jsonb_build_object(
        'consultation_id', new.id,
        'audio_path', new.audio_storage_path,
        'consultation_type', new.consultation_type, -- <-- LÍNEA AÑADIDA
        'doctor_id', new.doctor_id
      )
    )
  );
  
  -- Devuelve el nuevo registro para completar la operación del trigger
  RETURN new;
END;$$;


ALTER FUNCTION "public"."process_new_consultation"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."consultations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid",
    "doctor_id" "uuid",
    "transcription" "text",
    "formatted_notes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "audio_storage_path" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "consultation_type" "text"
);


ALTER TABLE "public"."consultations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid",
    "document_id" "text",
    "date_of_birth" "date",
    "allergies" "text",
    "chronic_conditions" "text",
    "email" "text"
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'doctor'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_patients_document_id" ON "public"."patients" USING "btree" ("document_id");



CREATE OR REPLACE TRIGGER "on_consultation_created" AFTER INSERT ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "public"."process_new_consultation"();



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin doctors can see all patients." ON "public"."patients" FOR SELECT USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'doctor'::"text"));



CREATE POLICY "Assistants can insert their own patients." ON "public"."patients" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Assistants can see their own patients." ON "public"."patients" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Doctors can delete their own consultations" ON "public"."consultations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can insert their own consultations" ON "public"."consultations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can select their own consultations" ON "public"."consultations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can update their own consultations" ON "public"."consultations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "doctor_id")) WITH CHECK (("auth"."uid"() = "doctor_id"));



ALTER TABLE "public"."consultations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."consultations";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_new_consultation"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_new_consultation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_new_consultation"() TO "service_role";


















GRANT ALL ON TABLE "public"."consultations" TO "anon";
GRANT ALL ON TABLE "public"."consultations" TO "authenticated";
GRANT ALL ON TABLE "public"."consultations" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
