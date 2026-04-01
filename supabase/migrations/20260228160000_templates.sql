-- Templates + RLS + Realtime setup

create table if not exists public.templates (
  id bigserial primary key,
  user_id uuid null references auth.users(id),
  kind text not null,
  name text not null,
  version text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;

-- Templates policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_select'
  ) THEN
    CREATE POLICY "templates_select" ON public.templates
      FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_insert'
  ) THEN
    CREATE POLICY "templates_insert" ON public.templates
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_update'
  ) THEN
    CREATE POLICY "templates_update" ON public.templates
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'templates' AND policyname = 'templates_delete'
  ) THEN
    CREATE POLICY "templates_delete" ON public.templates
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Ensure CRUD policies for core tables (if missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'categories') THEN
    EXECUTE 'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_select') THEN
      EXECUTE 'CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_insert') THEN
      EXECUTE 'CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_update') THEN
      EXECUTE 'CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'categories_delete') THEN
      EXECUTE 'CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'prompts') THEN
    EXECUTE 'ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'prompts_select') THEN
      EXECUTE 'CREATE POLICY "prompts_select" ON public.prompts FOR SELECT USING (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'prompts_insert') THEN
      EXECUTE 'CREATE POLICY "prompts_insert" ON public.prompts FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'prompts_update') THEN
      EXECUTE 'CREATE POLICY "prompts_update" ON public.prompts FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'prompts_delete') THEN
      EXECUTE 'CREATE POLICY "prompts_delete" ON public.prompts FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'context_menus') THEN
    EXECUTE 'ALTER TABLE public.context_menus ENABLE ROW LEVEL SECURITY';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'context_menus' AND policyname = 'context_menus_select') THEN
      EXECUTE 'CREATE POLICY "context_menus_select" ON public.context_menus FOR SELECT USING (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'context_menus' AND policyname = 'context_menus_insert') THEN
      EXECUTE 'CREATE POLICY "context_menus_insert" ON public.context_menus FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'context_menus' AND policyname = 'context_menus_update') THEN
      EXECUTE 'CREATE POLICY "context_menus_update" ON public.context_menus FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'context_menus' AND policyname = 'context_menus_delete') THEN
      EXECUTE 'CREATE POLICY "context_menus_delete" ON public.context_menus FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;

-- Realtime setup (replica identity + publication)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'categories') THEN
    EXECUTE 'ALTER TABLE public.categories REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'categories'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.categories';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'prompts') THEN
    EXECUTE 'ALTER TABLE public.prompts REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'prompts'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.prompts';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'context_menus') THEN
    EXECUTE 'ALTER TABLE public.context_menus REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'context_menus'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.context_menus';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'templates') THEN
    EXECUTE 'ALTER TABLE public.templates REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime' AND c.relname = 'templates'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.templates';
    END IF;
  END IF;
END $$;

-- Seed templates (public, user_id NULL)
DELETE FROM public.templates WHERE user_id IS NULL AND kind IN ('prompt_with_menus', 'prompt_only', 'menus_only');

INSERT INTO public.templates (user_id, kind, name, version, payload)
VALUES
  (
    NULL,
    'prompt_with_menus',
    'Template Prompt (com menus)',
    '2.1',
    $$
    {
      "system_role": "You are the SCENE PROMPT GENERATOR for an \"Advertising Scene App\".\n\nHIGH-LEVEL PURPOSE\n------------------\nGenerate three highly detailed prompts for an image generation model.\n\nEach prompt must depict a photorealistic everyday scene where a finished advertising artwork (uploaded image file) is applied as-is in the real world (screens, print, OOH, packaging, PDV, etc.).\n\nCRITICAL CONCEPT\n----------------\nYou DO NOT edit, redesign, improve, extend, translate, or modify the uploaded image (AD_ARTWORK).\n\nYou ONLY:\n1) Create three NEW and INDEPENDENT everyday scenes.\n2) Apply AD_ARTWORK as a finished ad on the correct support for the selected piece type.\n3) Keep AD_ARTWORK fully legible and unchanged.",
      "task": "Gerar, em formato JSON, 3 descrições detalhadas de cenas publicitárias realistas (scene_1, scene_2, scene_3) usando uma peça publicitária enviada como arquivo (AD_ARTWORK), aplicada em cenas de cotidiano, sem alterar o conteúdo da arte original.",
      "input_data": {
        "context": "Este prompt é usado em um app interno de criação de mockups publicitários. O usuário envia uma peça publicitária finalizada (imagem), escolhe um tipo de peça no menu TIPOS DE PEÇAS, escolhe um tipo de cena no menu TIPOS DE CENA e define um nível de direção de arte no menu Nível de Direção de Arte. O modelo combina essas escolhas com a descrição livre do usuário e gera 3 prompts de cena independentes do cotidiano, onde a arte é apenas aplicada como textura (tela, pôster, outdoor, embalagem, PDV etc.), sem nunca alterar o conteúdo da arte original.",
        "menus_selecionados": {
          "pecas": { "opcao": "{{pecas.opcao}}", "sub_opcoes": ["{{pecas.sub_opcao}}"] },
          "cenas": { "opcao": "{{cenas.opcao}}", "sub_opcoes": ["{{cenas.sub_opcao}}"] },
          "arte-direction": { "opcao": "{{arte_direction.opcao}}", "sub_opcoes": ["{{arte_direction.sub_opcao}}"] }
        },
        "user_scene_description": "{{user_scene_description}}",
        "ad_image_ref": "{{ad_image_ref}}"
      },
      "constraints": [
        "Nunca alterar o conteúdo da imagem enviada (AD_ARTWORK): não modificar textos, logos, cores, tipografia ou layout.",
        "Sempre tratar a imagem enviada como peça publicitária finalizada, apenas aplicada como textura/impressão em um suporte real (tela, pôster, OOH, embalagem, PDV, papelaria etc.).",
        "Gerar sempre 3 cenas distintas (scene_1, scene_2, scene_3) com ângulos diferentes (wide, eye-level, close/low angle) e composições independentes.",
        "As cenas devem ser realistas (lifestyle / ambientes reais) e com estética de mockup publicitário profissional.",
        "A peça publicitária deve ser o elemento principal da composição: legível, em destaque e sem obstruções."
      ],
      "negative_prompt": [
        "Não redesenhar, melhorar, reescrever ou traduzir a arte original.",
        "Não inventar textos, logos, CTAs ou elementos novos dentro da peça publicitária.",
        "Não distorcer a peça a ponto de ficar ilegível.",
        "Não gerar cenários surreais, abstratos ou caricatos: foco em realismo.",
        "Não criar fundos vazios ou mockups genéricos sem ambientação: sempre incluir contexto, objetos e iluminação realistas.",
        "Não gerar menos de 3 cenas e não misturar cenas em uma única imagem."
      ],
      "output_schema": {
        "formato": "json",
        "estrutura": "{\n  \"ad_type\": \"string\",\n  \"ad_type_label\": \"string\",\n  \"scene_type\": \"string\",\n  \"scene_type_label\": \"string\",\n  \"art_direction\": \"string\",\n  \"art_direction_label\": \"string\",\n  \"user_scene_description\": \"string\",\n  \"ad_image_ref\": \"string\",\n  \"scenes\": [\n    {\n      \"id\": \"scene_1\",\n      \"camera_angle\": \"wide\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    },\n    {\n      \"id\": \"scene_2\",\n      \"camera_angle\": \"eye_level\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    },\n    {\n      \"id\": \"scene_3\",\n      \"camera_angle\": \"close_or_low_angle\",\n      \"shot_label\": \"string\",\n      \"short_label\": \"string\",\n      \"description\": \"string\"\n    }\n  ]\n}"
      },
      "few_shot_examples": []
    }
    $$::jsonb
  ),
  (
    NULL,
    'prompt_only',
    'Template Prompt (mínimo)',
    '1.0',
    $$
    {
      "system_role": "",
      "task": "",
      "input_data": {
        "context": "",
        "menus_selecionados": {}
      },
      "constraints": [],
      "negative_prompt": [],
      "output_schema": {"formato": "texto", "estrutura": ""},
      "few_shot_examples": []
    }
    $$::jsonb
  ),
  (
    NULL,
    'menus_only',
    'Template Menus',
    '2.1',
    $$
    {
      "version": "2.1",
      "menus": [
        {
          "menu_id": "pecas",
          "menu_name": "TIPOS DE PEÇAS",
          "description": "Quais formatos de peças para criação da cena?",
          "options": [
            {
              "label": "Impresso",
              "value": "impresso",
              "sub_options": [
                {"label": "Cartaz", "value": "cartaz"},
                {"label": "Pôster", "value": "poster"},
                {"label": "Flyer", "value": "flyer"},
                {"label": "Panfleto", "value": "panfleto"},
                {"label": "Folder", "value": "folder"},
                {"label": "Catálogo", "value": "catalogo"},
                {"label": "Revista", "value": "revista"},
                {"label": "Jornal (Anúncio)", "value": "jornal_anuncio"},
                {"label": "Banner Impresso", "value": "banner_impresso"},
                {"label": "Faixa", "value": "faixa"},
                {"label": "Backdrop", "value": "backdrop"},
                {"label": "Adesivo", "value": "adesivo"},
                {"label": "Etiqueta", "value": "etiqueta"},
                {"label": "Rótulo", "value": "rotulo"},
                {"label": "Embalagem", "value": "embalagem"},
                {"label": "Sacola", "value": "sacola"},
                {"label": "Lamina/Tag de Produto", "value": "tag_produto"},
                {"label": "Cardápio (Impresso)", "value": "cardapio_impresso"},
                {"label": "Convite", "value": "convite"},
                {"label": "Ingresso", "value": "ingresso"}
              ]
            },
            {
              "label": "Papelaria",
              "value": "papelaria",
              "sub_options": [
                {"label": "Cartão de Visita", "value": "cartao_visita"},
                {"label": "Papel Timbrado", "value": "papel_timbrado"},
                {"label": "Envelope", "value": "envelope"},
                {"label": "Pasta Institucional", "value": "pasta_institucional"},
                {"label": "Bloco de Notas", "value": "bloco_notas"},
                {"label": "Crachá", "value": "cracha"},
                {"label": "Assinatura de E-mail", "value": "assinatura_email"},
                {"label": "Cartão de Agradecimento", "value": "cartao_agradecimento"},
                {"label": "Certificado", "value": "certificado"},
                {"label": "Papel de Parede (Impressão)", "value": "papel_parede"},
                {"label": "Adesivo de Vitrine", "value": "adesivo_vitrine"}
              ]
            },
            {
              "label": "Web / Digital",
              "value": "web",
              "sub_options": [
                {"label": "Banner para Site", "value": "banner_site"},
                {"label": "Banner Animado", "value": "banner_animado"},
                {"label": "Pop-up", "value": "popup"},
                {"label": "Landing Page", "value": "landing_page"},
                {"label": "Email Marketing", "value": "email_marketing"},
                {"label": "Newsletter", "value": "newsletter"},
                {"label": "E-book", "value": "ebook"},
                {"label": "Whitepaper", "value": "whitepaper"},
                {"label": "Infográfico", "value": "infografico"},
                {"label": "App Screen (Mockup)", "value": "app_screen"},
                {"label": "Push Notification (Mockup)", "value": "push_notification"},
                {"label": "App Store / Play Store Banner", "value": "store_banner"},
                {"label": "Marketplace Thumbnail", "value": "marketplace_thumbnail"},
                {"label": "Header de Website", "value": "header_website"}
              ]
            },
            {
              "label": "Social Media",
              "value": "social_media",
              "sub_options": [
                {"label": "Post Estático", "value": "post_estatico"},
                {"label": "Post Carrossel", "value": "post_carrossel"},
                {"label": "Story", "value": "story"},
                {"label": "Reels (Capa/Thumbnail)", "value": "reels_capa"},
                {"label": "Anúncio Patrocinado", "value": "anuncio_patrocinado"},
                {"label": "Criativo para Ads", "value": "criativo_ads"},
                {"label": "Thumbnail", "value": "thumbnail"},
                {"label": "Sticker", "value": "sticker"},
                {"label": "YouTube Community Post", "value": "youtube_community_post"},
                {"label": "TikTok Cover", "value": "tiktok_cover"},
                {"label": "LinkedIn Sponsored Post", "value": "linkedin_sponsored_post"}
              ]
            },
            {
              "label": "Mídia Externa (OOH/DOOH)",
              "value": "ooh",
              "sub_options": [
                {"label": "Outdoor", "value": "outdoor"},
                {"label": "Painel Publicitário", "value": "painel_publicitario"},
                {"label": "Painel LED (DOOH)", "value": "painel_led"},
                {"label": "Abrigo de Ônibus (MUPI)", "value": "mupi"},
                {"label": "Relógio de Rua", "value": "relogio_rua"},
                {"label": "Empena", "value": "empena"},
                {"label": "Trem/Metrô (Adesivagem)", "value": "adesivagem_metro"},
                {"label": "Totem Digital", "value": "totem_digital"}
              ]
            },
            {
              "label": "PDV / Varejo",
              "value": "pdv",
              "sub_options": [
                {"label": "Display de PDV", "value": "display_pdv"},
                {"label": "Totem", "value": "totem"},
                {"label": "Wobbler", "value": "wobbler"},
                {"label": "Stopper", "value": "stopper"},
                {"label": "Ilha de Produto", "value": "ilha_produto"},
                {"label": "Ponta de Gôndola", "value": "ponta_gondola"},
                {"label": "Testeira de Gôndola", "value": "testeira_gondola"},
                {"label": "Faixa de Gôndola", "value": "faixa_gondola"},
                {"label": "Display de Balcão", "value": "display_balcao"},
                {"label": "Geladeira/Freezer (Envelopamento)", "value": "envelopamento_geladeira"}
              ]
            },
            {
              "label": "Eventos / Experiências",
              "value": "eventos",
              "sub_options": [
                {"label": "Credencial/Lanyard", "value": "lanyard_credencial"},
                {"label": "Backdrop de Palco", "value": "backdrop_palco"},
                {"label": "Totem de Evento", "value": "totem_evento"},
                {"label": "Sinalização Direcional", "value": "sinalizacao_direcional"},
                {"label": "Stand (Painel/Comunicação)", "value": "stand_painel"}
              ]
            },
            {
              "label": "Brindes / Merch",
              "value": "merch",
              "sub_options": [
                {"label": "Camiseta", "value": "camiseta"},
                {"label": "Boné", "value": "bone"},
                {"label": "Caneca", "value": "caneca"},
                {"label": "Squeeze", "value": "squeeze"},
                {"label": "Ecobag", "value": "ecobag"},
                {"label": "Caderno", "value": "caderno"}
              ]
            }
          ]
        },
        {
          "menu_id": "cenas",
          "menu_name": "TIPOS DE CENA",
          "description": "Qual tipo de cena/ambientação você quer gerar para aplicar a peça publicitária?",
          "options": [
            {
              "label": "Dispositivos Digitais",
              "value": "dispositivos_digitais",
              "sub_options": [
                {"label": "Celular sobre mesa de trabalho", "value": "celular_mesa_trabalho"},
                {"label": "Celular sobre mesa de café", "value": "celular_mesa_cafe"},
                {"label": "Mão segurando celular em pé", "value": "mao_segurando_celular_em_pe"},
                {"label": "Mão segurando celular sentado", "value": "mao_segurando_celular_sentado"},
                {"label": "Notebook em mesa de escritório", "value": "notebook_mesa_escritorio"},
                {"label": "Desktop em estação de trabalho", "value": "desktop_estacao_trabalho"},
                {"label": "Tablet em ambiente criativo", "value": "tablet_ambiente_criativo"},
                {"label": "Setup com múltiplas telas", "value": "setup_multiplas_telas"},
                {"label": "Celular sobre bancada de cozinha", "value": "celular_bancada_cozinha"},
                {"label": "Celular no painel do carro", "value": "celular_painel_carro"},
                {"label": "Smartwatch exibindo notificação", "value": "smartwatch_notificacao"},
                {"label": "Celular sobre mala em aeroporto", "value": "celular_mala_aeroporto"},
                {"label": "Celular na mesa de cabeceira à noite", "value": "celular_cabeceira_noite"},
                {"label": "Tela de TV na sala (app/streaming)", "value": "tv_sala_app_streaming"},
                {"label": "Totem digital em ambiente público", "value": "totem_digital_publico"}
              ]
            },
            {
              "label": "Social Media no Cotidiano",
              "value": "social_cotidiano",
              "sub_options": [
                {"label": "Pessoa rolando feed no sofá", "value": "pessoa_rolando_feed_sofa"},
                {"label": "Grupo de amigos vendo tela do celular", "value": "grupo_amigos_vendo_celular"},
                {"label": "Pessoa em café olhando post", "value": "pessoa_cafe_post"},
                {"label": "Pessoa no transporte público olhando post", "value": "pessoa_transporte_publico_post"},
                {"label": "Pessoa deitada interagindo com stories", "value": "pessoa_deitada_stories"},
                {"label": "Pessoa usando celular na fila", "value": "pessoa_fila_celular"},
                {"label": "Pessoa reagindo a post", "value": "pessoa_reagindo_post"},
                {"label": "Creator gravando com celular (sem editar a arte)", "value": "creator_gravando_celular"}
              ]
            },
            {
              "label": "Mesa de Escritório / Papelaria",
              "value": "mesa_escritorio_papelaria",
              "sub_options": [
                {"label": "Mesa minimalista com papelaria", "value": "mesa_minimalista_papelaria"},
                {"label": "Cartões de visita sobre madeira", "value": "cartoes_visita_madeira"},
                {"label": "Kit papelaria corporativa completo", "value": "kit_papelaria_corporativa"},
                {"label": "Mesa com notebook, bloco e caneta", "value": "mesa_notebook_bloco_caneta"},
                {"label": "Mesa de criação com materiais gráficos", "value": "mesa_criacao_materiais_graficos"},
                {"label": "Moodboard com peça aplicada", "value": "moodboard_peca_aplicada"},
                {"label": "Envelope personalizado aberto", "value": "envelope_personalizado_aberto"},
                {"label": "Flat lay com materiais gráficos", "value": "flat_lay_materiais_graficos"},
                {"label": "Pasta institucional em reunião", "value": "pasta_institucional_reuniao"},
                {"label": "Assinatura de e-mail em tela (desktop)", "value": "assinatura_email_desktop"}
              ]
            },
            {
              "label": "Mídia Externa / Outdoor",
              "value": "midia_externa",
              "sub_options": [
                {"label": "Outdoor em avenida movimentada de dia", "value": "outdoor_avenida_dia"},
                {"label": "Outdoor em avenida movimentada à noite", "value": "outdoor_avenida_noite"},
                {"label": "Painel em ponto de ônibus", "value": "painel_ponto_onibus"},
                {"label": "Mídia em estação de metrô", "value": "midia_estacao_metro"},
                {"label": "Painel em shopping center", "value": "painel_shopping_center"},
                {"label": "Empena lateral de prédio", "value": "empena_predio"},
                {"label": "Painel digital em aeroporto", "value": "painel_digital_aeroporto"},
                {"label": "Mídia em elevador corporativo", "value": "midia_elevador_corporativo"},
                {"label": "Adesivagem em ônibus urbano", "value": "adesivagem_onibus_urbano"},
                {"label": "Painel LED em festival", "value": "painel_led_festival"},
                {"label": "MUPI em calçada (abrigo de ônibus)", "value": "mupi_calcada"},
                {"label": "Relógio de rua com anúncio", "value": "relogio_rua_anuncio"}
              ]
            },
            {
              "label": "Loja / Varejo / PDV",
              "value": "loja_varejo_pdv",
              "sub_options": [
                {"label": "Prateleira de mercado com embalagem", "value": "prateleira_mercado_embalagem"},
                {"label": "Balcão de loja com display", "value": "balcao_loja_display"},
                {"label": "Ilha de produto em supermercado", "value": "ilha_produto_supermercado"},
                {"label": "Loja de rua com vitrine", "value": "loja_rua_vitrine"},
                {"label": "Sacola personalizada em uso", "value": "sacola_personalizada_uso"},
                {"label": "Totem digital interativo", "value": "totem_digital_interativo"},
                {"label": "Caixa de checkout com branding", "value": "checkout_branding"},
                {"label": "Provador com comunicação visual", "value": "provador_comunicacao_visual"},
                {"label": "Tela de autoatendimento com campanha", "value": "tela_autoatendimento_campanha"},
                {"label": "Ponta de gôndola com campanha", "value": "ponta_gondola_campanha"},
                {"label": "Display de balcão em cafeteria", "value": "display_balcao_cafeteria"}
              ]
            },
            {
              "label": "Eventos / Experiências",
              "value": "eventos_experiencias",
              "sub_options": [
                {"label": "Credencial em lanyard no peito", "value": "credencial_lanyard_peito"},
                {"label": "Backdrop de palco em evento", "value": "backdrop_palco_evento"},
                {"label": "Sinalização direcional em evento", "value": "sinalizacao_evento"},
                {"label": "Stand com painel e fluxo de pessoas", "value": "stand_painel_fluxo"},
                {"label": "Totem de evento em corredor", "value": "totem_evento_corredor"}
              ]
            },
            {
              "label": "Casa / Lifestyle",
              "value": "casa_lifestyle",
              "sub_options": [
                {"label": "Geladeira com ímã/adesivo de campanha (sem alterar a arte)", "value": "geladeira_adesivo_campanha"},
                {"label": "Mesa de jantar com folheto", "value": "mesa_jantar_folheto"},
                {"label": "Sala com pôster na parede", "value": "sala_poster_parede"},
                {"label": "Home office com banner em tela", "value": "home_office_banner_tela"}
              ]
            }
          ]
        },
        {
          "menu_id": "arte-direction",
          "menu_name": "Nível de Direção de Arte",
          "description": "Qual tipo de design/estética você quer para a cena do mockup?",
          "options": [
            {
              "label": "Minimalista",
              "value": "minimalista",
              "sub_options": [
                {"label": "Fundo neutro", "value": "fundo_neutro"},
                {"label": "Poucos elementos", "value": "poucos_elementos"},
                {"label": "Espaço negativo dominante", "value": "espaco_negativo_dominante"},
                {"label": "Paleta reduzida", "value": "paleta_reduzida"},
                {"label": "Luz suave e difusa", "value": "luz_suave_difusa"},
                {"label": "Sombras suaves", "value": "sombras_suaves"}
              ]
            },
            {
              "label": "Premium / Sofisticado",
              "value": "premium",
              "sub_options": [
                {"label": "Materiais nobres", "value": "materiais_nobres"},
                {"label": "Iluminação dramática", "value": "iluminacao_dramatica"},
                {"label": "Sombras marcadas", "value": "sombras_marcadas"},
                {"label": "Ambiente elegante", "value": "ambiente_elegante"},
                {"label": "Composição refinada", "value": "composicao_refinada"},
                {"label": "Reflexos controlados", "value": "reflexos_controlados"}
              ]
            },
            {
              "label": "Urbano / Contemporâneo",
              "value": "urbano",
              "sub_options": [
                {"label": "Texturas de concreto e metal", "value": "texturas_concreto_metal"},
                {"label": "Ambiente de cidade", "value": "ambiente_cidade"},
                {"label": "Luz natural contrastada", "value": "luz_natural_contrastada"},
                {"label": "Elementos reais do cotidiano", "value": "elementos_reais_cotidiano"},
                {"label": "Estética moderna", "value": "estetica_moderna"},
                {"label": "Noite neon (realista)", "value": "noite_neon_realista"}
              ]
            },
            {
              "label": "Orgânico / Natural",
              "value": "organico",
              "sub_options": [
                {"label": "Madeira, tecido, plantas", "value": "madeira_tecido_plantas"},
                {"label": "Luz natural quente", "value": "luz_natural_quente"},
                {"label": "Ambiente acolhedor", "value": "ambiente_acolhedor"},
                {"label": "Texturas naturais", "value": "texturas_naturais"},
                {"label": "Clima leve e humano", "value": "clima_leve_humano"},
                {"label": "Grão fotográfico sutil", "value": "grao_fotografico_sutil"}
              ]
            },
            {
              "label": "Tech / Futurista",
              "value": "tech",
              "sub_options": [
                {"label": "Iluminação LED", "value": "iluminacao_led"},
                {"label": "Reflexos digitais", "value": "reflexos_digitais"},
                {"label": "Ambiente high-tech", "value": "ambiente_hightech"},
                {"label": "Cores frias", "value": "cores_frias"},
                {"label": "Estética clean tecnológica", "value": "estetica_clean_tecnologica"},
                {"label": "Microdetalhes e nitidez", "value": "microdetalhes_nitidez"}
              ]
            },
            {
              "label": "Criativo / Experimental",
              "value": "criativo",
              "sub_options": [
                {"label": "Composição não convencional", "value": "composicao_nao_convencional"},
                {"label": "Perspectiva ousada", "value": "perspectiva_ousada"},
                {"label": "Mistura de materiais", "value": "mistura_materiais"},
                {"label": "Iluminação artística", "value": "iluminacao_artistica"},
                {"label": "Cenografia conceitual (ainda realista)", "value": "cenografia_conceitual_realista"}
              ]
            },
            {
              "label": "Editorial / Cinematográfico",
              "value": "editorial",
              "sub_options": [
                {"label": "Narrativa visual", "value": "narrativa_visual"},
                {"label": "Profundidade de campo", "value": "profundidade_campo"},
                {"label": "Luz direcional", "value": "luz_direcional"},
                {"label": "Atmosfera dramática", "value": "atmosfera_dramatica"},
                {"label": "Composição de storytelling", "value": "composicao_storytelling"},
                {"label": "Lens flare sutil", "value": "lens_flare_sutil"}
              ]
            }
          ]
        }
      ]
    }
    $$::jsonb
  );
