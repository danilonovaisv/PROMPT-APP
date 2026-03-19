SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 8lP0rcZGmx3mZrjRxSUlHjfON0v2xVRhVyzu6xgmDwgEqg20pxOHu1WIGhRokLj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '915d79e0-a3c9-41a2-870d-50a0f92e8ff2', '{"action":"user_signedup","actor_id":"9c0f74ed-6618-4f1a-b467-8035e4b9347a","actor_username":"test@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-03-16 22:18:04.293553+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b53192ae-cd24-4229-bcb2-72c323deb155', '{"action":"login","actor_id":"9c0f74ed-6618-4f1a-b467-8035e4b9347a","actor_username":"test@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-16 22:18:04.335112+00', ''),
	('00000000-0000-0000-0000-000000000000', '03d2d189-a792-4d8d-b09e-ec7c4498d5db', '{"action":"user_repeated_signup","actor_id":"9c0f74ed-6618-4f1a-b467-8035e4b9347a","actor_username":"test@example.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-03-16 22:18:12.444737+00', ''),
	('00000000-0000-0000-0000-000000000000', '83bfc80f-b841-4d0c-b5fc-ad33e2f40581', '{"action":"user_signedup","actor_id":"5ad2523b-68c6-4770-99eb-292b49b8e155","actor_username":"agent@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-03-16 22:18:21.681472+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd128c7c2-bdb9-4dd7-a14c-9e02ea80e6e1', '{"action":"login","actor_id":"5ad2523b-68c6-4770-99eb-292b49b8e155","actor_username":"agent@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-16 22:18:21.700723+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d5b9a5a-17ac-4783-b792-6b00f3757a48', '{"action":"user_signedup","actor_id":"10d21777-7ed6-4e45-ab1f-a577b855069a","actor_username":"agent2@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-03-16 22:18:30.358834+00', ''),
	('00000000-0000-0000-0000-000000000000', '8b2db1e5-16d0-4d90-8998-5a5e3359987c', '{"action":"login","actor_id":"10d21777-7ed6-4e45-ab1f-a577b855069a","actor_username":"agent2@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-16 22:18:30.36882+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c8a2d647-e5a6-4a01-adf0-a2d5b5003398', '{"action":"user_signedup","actor_id":"2aa3ce85-ce21-49c6-8bc5-2279ebff1c62","actor_username":"agent3@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-03-16 22:18:40.228201+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e267e9e-7f24-4be6-849d-dfc07438eecc', '{"action":"login","actor_id":"2aa3ce85-ce21-49c6-8bc5-2279ebff1c62","actor_username":"agent3@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-16 22:18:40.250299+00', ''),
	('00000000-0000-0000-0000-000000000000', '8aec3c8f-9661-445d-85a3-f6ba970160c0', '{"action":"user_signedup","actor_id":"9a1c1786-4c33-47b2-b9fd-c2b46be9907e","actor_username":"codex-login-test-20260317@example.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-03-17 03:21:47.172445+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb846d93-ff00-46d8-b8a4-70195d0fd325', '{"action":"login","actor_id":"9a1c1786-4c33-47b2-b9fd-c2b46be9907e","actor_username":"codex-login-test-20260317@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-17 03:21:47.185599+00', ''),
	('00000000-0000-0000-0000-000000000000', '63fbf169-edfa-4c55-bc29-d2a623014d2b', '{"action":"logout","actor_id":"9a1c1786-4c33-47b2-b9fd-c2b46be9907e","actor_username":"codex-login-test-20260317@example.com","actor_via_sso":false,"log_type":"account"}', '2026-03-17 03:21:54.888712+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef598373-560b-4fce-8247-634004789297', '{"action":"login","actor_id":"9a1c1786-4c33-47b2-b9fd-c2b46be9907e","actor_username":"codex-login-test-20260317@example.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-03-17 03:22:09.095816+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '10d21777-7ed6-4e45-ab1f-a577b855069a', 'authenticated', 'authenticated', 'agent2@example.com', '$2a$10$FPOlWfFGoMALj42IxD29hevOOTLEhMxbvXcviXtyXsf2S17NPvWFe', '2026-03-16 22:18:30.359885+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-16 22:18:30.372213+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "10d21777-7ed6-4e45-ab1f-a577b855069a", "email": "agent2@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-16 22:18:30.34859+00', '2026-03-16 22:18:30.380051+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9c0f74ed-6618-4f1a-b467-8035e4b9347a', 'authenticated', 'authenticated', 'test@example.com', '$2a$10$GYr6Tf015T5bg/iAR6i3V.7XyUcXu9N6jvSKdfVBnoYJMU.ylzeNu', '2026-03-16 22:18:04.298358+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-16 22:18:04.342815+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "9c0f74ed-6618-4f1a-b467-8035e4b9347a", "email": "test@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-16 22:18:04.218841+00', '2026-03-16 22:18:04.375711+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2aa3ce85-ce21-49c6-8bc5-2279ebff1c62', 'authenticated', 'authenticated', 'agent3@example.com', '$2a$10$ck1uu6PX80vvqHFLJ3yuFe0XJyRCXNoOAegsdnjFkjeAajCAXimHC', '2026-03-16 22:18:40.229358+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-16 22:18:40.252476+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "2aa3ce85-ce21-49c6-8bc5-2279ebff1c62", "email": "agent3@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-16 22:18:40.200827+00', '2026-03-16 22:18:40.260316+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '5ad2523b-68c6-4770-99eb-292b49b8e155', 'authenticated', 'authenticated', 'agent@example.com', '$2a$10$lhGaI4UprNUT.o4TTLFn7Oan.kyYQh5Cr7Eup0w.Pf8kFntvivAyG', '2026-03-16 22:18:21.68221+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-16 22:18:21.701683+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "5ad2523b-68c6-4770-99eb-292b49b8e155", "email": "agent@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-16 22:18:21.673223+00', '2026-03-16 22:18:21.708786+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'authenticated', 'authenticated', 'codex-login-test-20260317@example.com', '$2a$10$r8RxxBKkFMAOdEM37JBiDe509ExYWM0lISQkhnSaxfthOuFPFFdbu', '2026-03-17 03:21:47.173877+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-17 03:22:09.096833+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "9a1c1786-4c33-47b2-b9fd-c2b46be9907e", "email": "codex-login-test-20260317@example.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-17 03:21:47.162425+00', '2026-03-17 03:22:09.100637+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('9c0f74ed-6618-4f1a-b467-8035e4b9347a', '9c0f74ed-6618-4f1a-b467-8035e4b9347a', '{"sub": "9c0f74ed-6618-4f1a-b467-8035e4b9347a", "email": "test@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-16 22:18:04.282079+00', '2026-03-16 22:18:04.282154+00', '2026-03-16 22:18:04.282154+00', '1122f2d1-e37e-4f4d-b234-3f773198c3b8'),
	('5ad2523b-68c6-4770-99eb-292b49b8e155', '5ad2523b-68c6-4770-99eb-292b49b8e155', '{"sub": "5ad2523b-68c6-4770-99eb-292b49b8e155", "email": "agent@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-16 22:18:21.679129+00', '2026-03-16 22:18:21.679187+00', '2026-03-16 22:18:21.679187+00', 'b571c61b-8977-45bb-abd8-21e4ec672690'),
	('10d21777-7ed6-4e45-ab1f-a577b855069a', '10d21777-7ed6-4e45-ab1f-a577b855069a', '{"sub": "10d21777-7ed6-4e45-ab1f-a577b855069a", "email": "agent2@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-16 22:18:30.353105+00', '2026-03-16 22:18:30.353128+00', '2026-03-16 22:18:30.353128+00', '39c05fad-bdcf-4b19-bdab-bdcb2a87b8da'),
	('2aa3ce85-ce21-49c6-8bc5-2279ebff1c62', '2aa3ce85-ce21-49c6-8bc5-2279ebff1c62', '{"sub": "2aa3ce85-ce21-49c6-8bc5-2279ebff1c62", "email": "agent3@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-16 22:18:40.216209+00', '2026-03-16 22:18:40.216911+00', '2026-03-16 22:18:40.216911+00', '3229b6bd-ea80-4578-9c5f-98e8c10a8cad'),
	('9a1c1786-4c33-47b2-b9fd-c2b46be9907e', '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', '{"sub": "9a1c1786-4c33-47b2-b9fd-c2b46be9907e", "email": "codex-login-test-20260317@example.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-17 03:21:47.170922+00', '2026-03-17 03:21:47.170944+00', '2026-03-17 03:21:47.170944+00', 'aa465eba-4012-484b-bf95-4f2872800236');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('d7053b44-28c0-4947-8a4c-bdfb9b29dccc', '9c0f74ed-6618-4f1a-b467-8035e4b9347a', '2026-03-16 22:18:04.342951+00', '2026-03-16 22:18:04.342951+00', NULL, 'aal1', NULL, NULL, 'curl/8.7.1', '172.67.135.174', NULL, NULL, NULL, NULL, NULL),
	('81f45117-6808-44a1-b610-907d009455f1', '5ad2523b-68c6-4770-99eb-292b49b8e155', '2026-03-16 22:18:21.701846+00', '2026-03-16 22:18:21.701846+00', NULL, 'aal1', NULL, NULL, 'curl/8.7.1', '172.67.135.174', NULL, NULL, NULL, NULL, NULL),
	('5afc7e66-c84e-420d-a1a7-6234df2f23ce', '10d21777-7ed6-4e45-ab1f-a577b855069a', '2026-03-16 22:18:30.37286+00', '2026-03-16 22:18:30.37286+00', NULL, 'aal1', NULL, NULL, 'curl/8.7.1', '172.67.135.174', NULL, NULL, NULL, NULL, NULL),
	('e234d38f-8650-484e-979e-e876d761302a', '2aa3ce85-ce21-49c6-8bc5-2279ebff1c62', '2026-03-16 22:18:40.252767+00', '2026-03-16 22:18:40.252767+00', NULL, 'aal1', NULL, NULL, 'curl/8.7.1', '172.67.135.174', NULL, NULL, NULL, NULL, NULL),
	('64a4b4a8-c484-480e-a41e-8d8d7df5c6eb', '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', '2026-03-17 03:22:09.096888+00', '2026-03-17 03:22:09.096888+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '172.67.135.174', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('d7053b44-28c0-4947-8a4c-bdfb9b29dccc', '2026-03-16 22:18:04.376702+00', '2026-03-16 22:18:04.376702+00', 'password', '983c0363-e43a-4217-93be-1bf71202e508'),
	('81f45117-6808-44a1-b610-907d009455f1', '2026-03-16 22:18:21.709416+00', '2026-03-16 22:18:21.709416+00', 'password', '36e3ef8f-80b7-4fd3-a918-2280bb3d17d5'),
	('5afc7e66-c84e-420d-a1a7-6234df2f23ce', '2026-03-16 22:18:30.380654+00', '2026-03-16 22:18:30.380654+00', 'password', 'a6f46dcb-c48b-40d1-a63a-a472f2a170d9'),
	('e234d38f-8650-484e-979e-e876d761302a', '2026-03-16 22:18:40.260713+00', '2026-03-16 22:18:40.260713+00', 'password', '661b3375-fa5e-489d-89ae-65537bf63b5d'),
	('64a4b4a8-c484-480e-a41e-8d8d7df5c6eb', '2026-03-17 03:22:09.101109+00', '2026-03-17 03:22:09.101109+00', 'password', '2c25b511-049f-45cb-8bd1-a19c246fc9ea');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'ing7wd2k4pdm', '9c0f74ed-6618-4f1a-b467-8035e4b9347a', false, '2026-03-16 22:18:04.353012+00', '2026-03-16 22:18:04.353012+00', NULL, 'd7053b44-28c0-4947-8a4c-bdfb9b29dccc'),
	('00000000-0000-0000-0000-000000000000', 2, 'mwavvr6okkob', '5ad2523b-68c6-4770-99eb-292b49b8e155', false, '2026-03-16 22:18:21.706316+00', '2026-03-16 22:18:21.706316+00', NULL, '81f45117-6808-44a1-b610-907d009455f1'),
	('00000000-0000-0000-0000-000000000000', 3, 'mt4eefdjqw2k', '10d21777-7ed6-4e45-ab1f-a577b855069a', false, '2026-03-16 22:18:30.378632+00', '2026-03-16 22:18:30.378632+00', NULL, '5afc7e66-c84e-420d-a1a7-6234df2f23ce'),
	('00000000-0000-0000-0000-000000000000', 4, 'wxrfiusmxn5m', '2aa3ce85-ce21-49c6-8bc5-2279ebff1c62', false, '2026-03-16 22:18:40.258892+00', '2026-03-16 22:18:40.258892+00', NULL, 'e234d38f-8650-484e-979e-e876d761302a'),
	('00000000-0000-0000-0000-000000000000', 6, 'fpbutoq6e6nr', '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', false, '2026-03-17 03:22:09.099342+00', '2026-03-17 03:22:09.099342+00', NULL, '64a4b4a8-c484-480e-a41e-8d8d7df5c6eb');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "user_id", "name", "icon", "color", "created_at", "updated_at") VALUES
	(1, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Copywriting', '✍️', '#ff6b35', '2026-03-17 03:21:47.341987+00', '2026-03-17 03:21:47.341987+00'),
	(2, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Código', '💻', '#0048ff', '2026-03-17 03:21:47.368667+00', '2026-03-17 03:21:47.368667+00'),
	(3, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Análise de Dados', '📊', '#00d68f', '2026-03-17 03:21:47.38669+00', '2026-03-17 03:21:47.38669+00'),
	(4, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Educação', '🎓', '#7b2ff7', '2026-03-17 03:21:47.402502+00', '2026-03-17 03:21:47.402502+00'),
	(5, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Criativo', '🎨', '#ff4466', '2026-03-17 03:21:47.418272+00', '2026-03-17 03:21:47.418272+00'),
	(6, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Negócios', '💼', '#ffaa00', '2026-03-17 03:21:47.435356+00', '2026-03-17 03:21:47.435356+00');


--
-- Data for Name: context_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prompts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."templates" ("id", "user_id", "kind", "name", "version", "payload", "created_at", "updated_at") VALUES
	(1, NULL, 'prompt_with_menus', 'Template Prompt (com menus)', '2.1', '{"task": "Gerar, em formato JSON, 3 descrições detalhadas de cenas publicitárias realistas (scene_1, scene_2, scene_3) usando uma peça publicitária enviada como arquivo (AD_ARTWORK), aplicada em cenas de cotidiano, sem alterar o conteúdo da arte original.", "input_data": {"context": "Este prompt é usado em um app interno de criação de mockups publicitários. O usuário envia uma peça publicitária finalizada (imagem), escolhe um tipo de peça no menu TIPOS DE PEÇAS, escolhe um tipo de cena no menu TIPOS DE CENA e define um nível de direção de arte no menu Nível de Direção de Arte. O modelo combina essas escolhas com a descrição livre do usuário e gera 3 prompts de cena independentes do cotidiano, onde a arte é apenas aplicada como textura (tela, pôster, outdoor, embalagem, PDV etc.), sem nunca alterar o conteúdo da arte original.", "ad_image_ref": "{{ad_image_ref}}", "menus_selecionados": {"cenas": {"opcao": "{{cenas.opcao}}", "sub_opcoes": ["{{cenas.sub_opcao}}"]}, "pecas": {"opcao": "{{pecas.opcao}}", "sub_opcoes": ["{{pecas.sub_opcao}}"]}, "arte-direction": {"opcao": "{{arte_direction.opcao}}", "sub_opcoes": ["{{arte_direction.sub_opcao}}"]}}, "user_scene_description": "{{user_scene_description}}"}, "constraints": ["Nunca alterar o conteúdo da imagem enviada (AD_ARTWORK): não modificar textos, logos, cores, tipografia ou layout.", "Sempre tratar a imagem enviada como peça publicitária finalizada, apenas aplicada como textura/impressão em um suporte real (tela, pôster, OOH, embalagem, PDV, papelaria etc.).", "Gerar sempre 3 cenas distintas (scene_1, scene_2, scene_3) com ângulos diferentes (wide, eye-level, close/low angle) e composições independentes.", "As cenas devem ser realistas (lifestyle / ambientes reais) e com estética de mockup publicitário profissional.", "A peça publicitária deve ser o elemento principal da composição: legível, em destaque e sem obstruções."], "system_role": "You are the SCENE PROMPT GENERATOR for an \"Advertising Scene App\".\n\nHIGH-LEVEL PURPOSE\n------------------\nGenerate three highly detailed prompts for an image generation model.\n\nEach prompt must depict a photorealistic everyday scene where a finished advertising artwork (uploaded image file) is applied as-is in the real world (screens, print, OOH, packaging, PDV, etc.).\n\nCRITICAL CONCEPT\n----------------\nYou DO NOT edit, redesign, improve, extend, translate, or modify the uploaded image (AD_ARTWORK).\n\nYou ONLY:\n1) Create three NEW and INDEPENDENT everyday scenes.\n2) Apply AD_ARTWORK as a finished ad on the correct support for the selected piece type.\n3) Keep AD_ARTWORK fully legible and unchanged.", "output_schema": {"formato": "json", "estrutura": "{\n  \"ad_type\": \"string\",\n  \"ad_type_label\": \"string\",\n  \"scene_type\": \"string\",\n  \"scene_type_label\": \"string\",\n  \"art_direction\": \"string\",\n  \"art_direction_label\": \"string\",\n  \"user_scene_description\": \"string\",\n  \"ad_image_ref\": \"string\",\n  \"scenes\": [\n    {\n      \"id\": \"scene_1\",\n      \"camera_angle\": \"wide\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    },\n    {\n      \"id\": \"scene_2\",\n      \"camera_angle\": \"eye_level\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    },\n    {\n      \"id\": \"scene_3\",\n      \"camera_angle\": \"close_or_low_angle\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    }\n  ]\n}"}, "negative_prompt": ["Não redesenhar, melhorar, reescrever ou traduzir a arte original.", "Não inventar textos, logos, CTAs ou elementos novos dentro da peça publicitária.", "Não distorcer a peça a ponto de ficar ilegível.", "Não gerar cenários surreais, abstratos ou caricatos: foco em realismo.", "Não criar fundos vazios ou mockups genéricos sem ambientação: sempre incluir contexto, objetos e iluminação realistas.", "Não gerar menos de 3 cenas e não misturar cenas em uma única imagem."], "few_shot_examples": []}', '2026-03-16 17:42:49.773533+00', '2026-03-16 17:42:49.773533+00'),
	(2, NULL, 'prompt_only', 'Template Prompt (mínimo)', '1.0', '{"task": "", "input_data": {"context": "", "menus_selecionados": {}}, "constraints": [], "system_role": "", "output_schema": {"formato": "texto", "estrutura": ""}, "negative_prompt": [], "few_shot_examples": []}', '2026-03-16 17:42:49.773533+00', '2026-03-16 17:42:49.773533+00'),
	(3, NULL, 'menus_only', 'Template Menus', '2.1', '{"menus": [{"menu_id": "pecas", "options": [{"label": "Impresso", "value": "impresso", "sub_options": [{"label": "Cartaz", "value": "cartaz"}, {"label": "Pôster", "value": "poster"}, {"label": "Flyer", "value": "flyer"}, {"label": "Panfleto", "value": "panfleto"}, {"label": "Folder", "value": "folder"}, {"label": "Catálogo", "value": "catalogo"}, {"label": "Revista", "value": "revista"}, {"label": "Jornal (Anúncio)", "value": "jornal_anuncio"}, {"label": "Banner Impresso", "value": "banner_impresso"}, {"label": "Faixa", "value": "faixa"}, {"label": "Backdrop", "value": "backdrop"}, {"label": "Adesivo", "value": "adesivo"}, {"label": "Etiqueta", "value": "etiqueta"}, {"label": "Rótulo", "value": "rotulo"}, {"label": "Embalagem", "value": "embalagem"}, {"label": "Sacola", "value": "sacola"}, {"label": "Lamina/Tag de Produto", "value": "tag_produto"}, {"label": "Cardápio (Impresso)", "value": "cardapio_impresso"}, {"label": "Convite", "value": "convite"}, {"label": "Ingresso", "value": "ingresso"}]}, {"label": "Papelaria", "value": "papelaria", "sub_options": [{"label": "Cartão de Visita", "value": "cartao_visita"}, {"label": "Papel Timbrado", "value": "papel_timbrado"}, {"label": "Envelope", "value": "envelope"}, {"label": "Pasta Institucional", "value": "pasta_institucional"}, {"label": "Bloco de Notas", "value": "bloco_notas"}, {"label": "Crachá", "value": "cracha"}, {"label": "Assinatura de E-mail", "value": "assinatura_email"}, {"label": "Cartão de Agradecimento", "value": "cartao_agradecimento"}, {"label": "Certificado", "value": "certificado"}, {"label": "Papel de Parede (Impressão)", "value": "papel_parede"}, {"label": "Adesivo de Vitrine", "value": "adesivo_vitrine"}]}, {"label": "Web / Digital", "value": "web", "sub_options": [{"label": "Banner para Site", "value": "banner_site"}, {"label": "Banner Animado", "value": "banner_animado"}, {"label": "Pop-up", "value": "popup"}, {"label": "Landing Page", "value": "landing_page"}, {"label": "Email Marketing", "value": "email_marketing"}, {"label": "Newsletter", "value": "newsletter"}, {"label": "E-book", "value": "ebook"}, {"label": "Whitepaper", "value": "whitepaper"}, {"label": "Infográfico", "value": "infografico"}, {"label": "App Screen (Mockup)", "value": "app_screen"}, {"label": "Push Notification (Mockup)", "value": "push_notification"}, {"label": "App Store / Play Store Banner", "value": "store_banner"}, {"label": "Marketplace Thumbnail", "value": "marketplace_thumbnail"}, {"label": "Header de Website", "value": "header_website"}]}, {"label": "Social Media", "value": "social_media", "sub_options": [{"label": "Post Estático", "value": "post_estatico"}, {"label": "Post Carrossel", "value": "post_carrossel"}, {"label": "Story", "value": "story"}, {"label": "Reels (Capa/Thumbnail)", "value": "reels_capa"}, {"label": "Anúncio Patrocinado", "value": "anuncio_patrocinado"}, {"label": "Criativo para Ads", "value": "criativo_ads"}, {"label": "Thumbnail", "value": "thumbnail"}, {"label": "Sticker", "value": "sticker"}, {"label": "YouTube Community Post", "value": "youtube_community_post"}, {"label": "TikTok Cover", "value": "tiktok_cover"}, {"label": "LinkedIn Sponsored Post", "value": "linkedin_sponsored_post"}]}, {"label": "Mídia Externa (OOH/DOOH)", "value": "ooh", "sub_options": [{"label": "Outdoor", "value": "outdoor"}, {"label": "Painel Publicitário", "value": "painel_publicitario"}, {"label": "Painel LED (DOOH)", "value": "painel_led"}, {"label": "Abrigo de Ônibus (MUPI)", "value": "mupi"}, {"label": "Relógio de Rua", "value": "relogio_rua"}, {"label": "Empena", "value": "empena"}, {"label": "Trem/Metrô (Adesivagem)", "value": "adesivagem_metro"}, {"label": "Totem Digital", "value": "totem_digital"}]}, {"label": "PDV / Varejo", "value": "pdv", "sub_options": [{"label": "Display de PDV", "value": "display_pdv"}, {"label": "Totem", "value": "totem"}, {"label": "Wobbler", "value": "wobbler"}, {"label": "Stopper", "value": "stopper"}, {"label": "Ilha de Produto", "value": "ilha_produto"}, {"label": "Ponta de Gôndola", "value": "ponta_gondola"}, {"label": "Testeira de Gôndola", "value": "testeira_gondola"}, {"label": "Faixa de Gôndola", "value": "faixa_gondola"}, {"label": "Display de Balcão", "value": "display_balcao"}, {"label": "Geladeira/Freezer (Envelopamento)", "value": "envelopamento_geladeira"}]}, {"label": "Eventos / Experiências", "value": "eventos", "sub_options": [{"label": "Credencial/Lanyard", "value": "lanyard_credencial"}, {"label": "Backdrop de Palco", "value": "backdrop_palco"}, {"label": "Totem de Evento", "value": "totem_evento"}, {"label": "Sinalização Direcional", "value": "sinalizacao_direcional"}, {"label": "Stand (Painel/Comunicação)", "value": "stand_painel"}]}, {"label": "Brindes / Merch", "value": "merch", "sub_options": [{"label": "Camiseta", "value": "camiseta"}, {"label": "Boné", "value": "bone"}, {"label": "Caneca", "value": "caneca"}, {"label": "Squeeze", "value": "squeeze"}, {"label": "Ecobag", "value": "ecobag"}, {"label": "Caderno", "value": "caderno"}]}], "menu_name": "TIPOS DE PEÇAS", "description": "Quais formatos de peças para criação da cena?"}, {"menu_id": "cenas", "options": [{"label": "Dispositivos Digitais", "value": "dispositivos_digitais", "sub_options": [{"label": "Celular sobre mesa de trabalho", "value": "celular_mesa_trabalho"}, {"label": "Celular sobre mesa de café", "value": "celular_mesa_cafe"}, {"label": "Mão segurando celular em pé", "value": "mao_segurando_celular_em_pe"}, {"label": "Mão segurando celular sentado", "value": "mao_segurando_celular_sentado"}, {"label": "Notebook em mesa de escritório", "value": "notebook_mesa_escritorio"}, {"label": "Desktop em estação de trabalho", "value": "desktop_estacao_trabalho"}, {"label": "Tablet em ambiente criativo", "value": "tablet_ambiente_criativo"}, {"label": "Setup com múltiplas telas", "value": "setup_multiplas_telas"}, {"label": "Celular sobre bancada de cozinha", "value": "celular_bancada_cozinha"}, {"label": "Celular no painel do carro", "value": "celular_painel_carro"}, {"label": "Smartwatch exibindo notificação", "value": "smartwatch_notificacao"}, {"label": "Celular sobre mala em aeroporto", "value": "celular_mala_aeroporto"}, {"label": "Celular na mesa de cabeceira à noite", "value": "celular_cabeceira_noite"}, {"label": "Tela de TV na sala (app/streaming)", "value": "tv_sala_app_streaming"}, {"label": "Totem digital em ambiente público", "value": "totem_digital_publico"}]}, {"label": "Social Media no Cotidiano", "value": "social_cotidiano", "sub_options": [{"label": "Pessoa rolando feed no sofá", "value": "pessoa_rolando_feed_sofa"}, {"label": "Grupo de amigos vendo tela do celular", "value": "grupo_amigos_vendo_celular"}, {"label": "Pessoa em café olhando post", "value": "pessoa_cafe_post"}, {"label": "Pessoa no transporte público olhando post", "value": "pessoa_transporte_publico_post"}, {"label": "Pessoa deitada interagindo com stories", "value": "pessoa_deitada_stories"}, {"label": "Pessoa usando celular na fila", "value": "pessoa_fila_celular"}, {"label": "Pessoa reagindo a post", "value": "pessoa_reagindo_post"}, {"label": "Creator gravando com celular (sem editar a arte)", "value": "creator_gravando_celular"}]}, {"label": "Mesa de Escritório / Papelaria", "value": "mesa_escritorio_papelaria", "sub_options": [{"label": "Mesa minimalista com papelaria", "value": "mesa_minimalista_papelaria"}, {"label": "Cartões de visita sobre madeira", "value": "cartoes_visita_madeira"}, {"label": "Kit papelaria corporativa completo", "value": "kit_papelaria_corporativa"}, {"label": "Mesa com notebook, bloco e caneta", "value": "mesa_notebook_bloco_caneta"}, {"label": "Mesa de criação com materiais gráficos", "value": "mesa_criacao_materiais_graficos"}, {"label": "Moodboard com peça aplicada", "value": "moodboard_peca_aplicada"}, {"label": "Envelope personalizado aberto", "value": "envelope_personalizado_aberto"}, {"label": "Flat lay com materiais gráficos", "value": "flat_lay_materiais_graficos"}, {"label": "Pasta institucional em reunião", "value": "pasta_institucional_reuniao"}, {"label": "Assinatura de e-mail em tela (desktop)", "value": "assinatura_email_desktop"}]}, {"label": "Mídia Externa / Outdoor", "value": "midia_externa", "sub_options": [{"label": "Outdoor em avenida movimentada de dia", "value": "outdoor_avenida_dia"}, {"label": "Outdoor em avenida movimentada à noite", "value": "outdoor_avenida_noite"}, {"label": "Painel em ponto de ônibus", "value": "painel_ponto_onibus"}, {"label": "Mídia em estação de metrô", "value": "midia_estacao_metro"}, {"label": "Painel em shopping center", "value": "painel_shopping_center"}, {"label": "Empena lateral de prédio", "value": "empena_predio"}, {"label": "Painel digital em aeroporto", "value": "painel_digital_aeroporto"}, {"label": "Mídia em elevador corporativo", "value": "midia_elevador_corporativo"}, {"label": "Adesivagem em ônibus urbano", "value": "adesivagem_onibus_urbano"}, {"label": "Painel LED em festival", "value": "painel_led_festival"}, {"label": "MUPI em calçada (abrigo de ônibus)", "value": "mupi_calcada"}, {"label": "Relógio de rua com anúncio", "value": "relogio_rua_anuncio"}]}, {"label": "Loja / Varejo / PDV", "value": "loja_varejo_pdv", "sub_options": [{"label": "Prateleira de mercado com embalagem", "value": "prateleira_mercado_embalagem"}, {"label": "Balcão de loja com display", "value": "balcao_loja_display"}, {"label": "Ilha de produto em supermercado", "value": "ilha_produto_supermercado"}, {"label": "Loja de rua com vitrine", "value": "loja_rua_vitrine"}, {"label": "Sacola personalizada em uso", "value": "sacola_personalizada_uso"}, {"label": "Totem digital interativo", "value": "totem_digital_interativo"}, {"label": "Caixa de checkout com branding", "value": "checkout_branding"}, {"label": "Provador com comunicação visual", "value": "provador_comunicacao_visual"}, {"label": "Tela de autoatendimento com campanha", "value": "tela_autoatendimento_campanha"}, {"label": "Ponta de gôndola com campanha", "value": "ponta_gondola_campanha"}, {"label": "Display de balcão em cafeteria", "value": "display_balcao_cafeteria"}]}, {"label": "Eventos / Experiências", "value": "eventos_experiencias", "sub_options": [{"label": "Credencial em lanyard no peito", "value": "credencial_lanyard_peito"}, {"label": "Backdrop de palco em evento", "value": "backdrop_palco_evento"}, {"label": "Sinalização direcional em evento", "value": "sinalizacao_evento"}, {"label": "Stand com painel e fluxo de pessoas", "value": "stand_painel_fluxo"}, {"label": "Totem de evento em corredor", "value": "totem_evento_corredor"}]}, {"label": "Casa / Lifestyle", "value": "casa_lifestyle", "sub_options": [{"label": "Geladeira com ímã/adesivo de campanha (sem alterar a arte)", "value": "geladeira_adesivo_campanha"}, {"label": "Mesa de jantar com folheto", "value": "mesa_jantar_folheto"}, {"label": "Sala com pôster na parede", "value": "sala_poster_parede"}, {"label": "Home office com banner em tela", "value": "home_office_banner_tela"}]}], "menu_name": "TIPOS DE CENA", "description": "Qual tipo de cena/ambientação você quer gerar para aplicar a peça publicitária?"}, {"menu_id": "arte-direction", "options": [{"label": "Minimalista", "value": "minimalista", "sub_options": [{"label": "Fundo neutro", "value": "fundo_neutro"}, {"label": "Poucos elementos", "value": "poucos_elementos"}, {"label": "Espaço negativo dominante", "value": "espaco_negativo_dominante"}, {"label": "Paleta reduzida", "value": "paleta_reduzida"}, {"label": "Luz suave e difusa", "value": "luz_suave_difusa"}, {"label": "Sombras suaves", "value": "sombras_suaves"}]}, {"label": "Premium / Sofisticado", "value": "premium", "sub_options": [{"label": "Materiais nobres", "value": "materiais_nobres"}, {"label": "Iluminação dramática", "value": "iluminacao_dramatica"}, {"label": "Sombras marcadas", "value": "sombras_marcadas"}, {"label": "Ambiente elegante", "value": "ambiente_elegante"}, {"label": "Composição refinada", "value": "composicao_refinada"}, {"label": "Reflexos controlados", "value": "reflexos_controlados"}]}, {"label": "Urbano / Contemporâneo", "value": "urbano", "sub_options": [{"label": "Texturas de concreto e metal", "value": "texturas_concreto_metal"}, {"label": "Ambiente de cidade", "value": "ambiente_cidade"}, {"label": "Luz natural contrastada", "value": "luz_natural_contrastada"}, {"label": "Elementos reais do cotidiano", "value": "elementos_reais_cotidiano"}, {"label": "Estética moderna", "value": "estetica_moderna"}, {"label": "Noite neon (realista)", "value": "noite_neon_realista"}]}, {"label": "Orgânico / Natural", "value": "organico", "sub_options": [{"label": "Madeira, tecido, plantas", "value": "madeira_tecido_plantas"}, {"label": "Luz natural quente", "value": "luz_natural_quente"}, {"label": "Ambiente acolhedor", "value": "ambiente_acolhedor"}, {"label": "Texturas naturais", "value": "texturas_naturais"}, {"label": "Clima leve e humano", "value": "clima_leve_humano"}, {"label": "Grão fotográfico sutil", "value": "grao_fotografico_sutil"}]}, {"label": "Tech / Futurista", "value": "tech", "sub_options": [{"label": "Iluminação LED", "value": "iluminacao_led"}, {"label": "Reflexos digitais", "value": "reflexos_digitais"}, {"label": "Ambiente high-tech", "value": "ambiente_hightech"}, {"label": "Cores frias", "value": "cores_frias"}, {"label": "Estética clean tecnológica", "value": "estetica_clean_tecnologica"}, {"label": "Microdetalhes e nitidez", "value": "microdetalhes_nitidez"}]}, {"label": "Criativo / Experimental", "value": "criativo", "sub_options": [{"label": "Composição não convencional", "value": "composicao_nao_convencional"}, {"label": "Perspectiva ousada", "value": "perspectiva_ousada"}, {"label": "Mistura de materiais", "value": "mistura_materiais"}, {"label": "Iluminação artística", "value": "iluminacao_artistica"}, {"label": "Cenografia conceitual (ainda realista)", "value": "cenografia_conceitual_realista"}]}, {"label": "Editorial / Cinematográfico", "value": "editorial", "sub_options": [{"label": "Narrativa visual", "value": "narrativa_visual"}, {"label": "Profundidade de campo", "value": "profundidade_campo"}, {"label": "Luz direcional", "value": "luz_direcional"}, {"label": "Atmosfera dramática", "value": "atmosfera_dramatica"}, {"label": "Composição de storytelling", "value": "composicao_storytelling"}, {"label": "Lens flare sutil", "value": "lens_flare_sutil"}]}], "menu_name": "Nível de Direção de Arte", "description": "Qual tipo de design/estética você quer para a cena do mockup?"}], "version": "2.1"}', '2026-03-16 17:42:49.773533+00', '2026-03-16 17:42:49.773533+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 6, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."categories_id_seq"', 6, true);


--
-- Name: context_menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."context_menus_id_seq"', 1, false);


--
-- Name: prompts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."prompts_id_seq"', 1, false);


--
-- Name: templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."templates_id_seq"', 3, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 8lP0rcZGmx3mZrjRxSUlHjfON0v2xVRhVyzu6xgmDwgEqg20pxOHu1WIGhRokLj

RESET ALL;
