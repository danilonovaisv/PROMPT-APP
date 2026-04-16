SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict sD0s9lSvbfYJCKhonMJnrEezSE97qbHN3t8Ipj6mn3R1fDPZupgxKy9kKJCAaFn

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
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categories" ("id", "user_id", "name", "icon", "color", "created_at") VALUES
	(1, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Copywriting', '✍️', '#ff6b35', '2026-03-17 03:21:47.341987+00'),
	(2, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Código', '💻', '#0048ff', '2026-03-17 03:21:47.368667+00'),
	(3, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Análise de Dados', '📊', '#00d68f', '2026-03-17 03:21:47.38669+00'),
	(4, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Educação', '🎓', '#7b2ff7', '2026-03-17 03:21:47.402502+00'),
	(5, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Criativo', '🎨', '#ff4466', '2026-03-17 03:21:47.418272+00'),
	(6, '9a1c1786-4c33-47b2-b9fd-c2b46be9907e', 'Negócios', '💼', '#ffaa00', '2026-03-17 03:21:47.435356+00');


--
-- Data for Name: context_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prompts; Type: TABLE DATA; Schema: public; Owner: postgres
--



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
-- Name: categories_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."categories_id_seq1"', 1, false);


--
-- Name: context_menus_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."context_menus_id_seq1"', 1, false);


--
-- Name: prompts_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."prompts_id_seq1"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict sD0s9lSvbfYJCKhonMJnrEezSE97qbHN3t8Ipj6mn3R1fDPZupgxKy9kKJCAaFn

RESET ALL;
