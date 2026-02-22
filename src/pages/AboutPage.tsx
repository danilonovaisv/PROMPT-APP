/* ======================================================
   Página Sobre
   ====================================================== */

import SEO from '@/components/SEO';

export default function AboutPage() {
    return (
        <>
            <SEO
                title="Sobre"
                description="Conheça o Prompt App e a proposta de organização profissional de prompts para LLMs."
                url="https://prompt-app-dan.netlify.app/sobre"
            />
            <header className="app-header">
                <h2 className="app-header__title">Sobre</h2>
            </header>

            <div className="app-content info-page">
                <h1 className="info-page__title">Sobre o Prompt App</h1>
                <p className="info-page__meta">
                    Por Danilo Novais • Publicado em 22 de fevereiro de 2026 • Atualizado em 22 de fevereiro de 2026
                </p>

                <section className="info-page__section">
                    <p>
                        O Prompt App é uma ferramenta local-first focada em engenharia de prompts. Ele organiza
                        conhecimento em estruturas reutilizáveis para que equipes consigam criar, revisar e aplicar
                        instruções de forma consistente, com contexto claro e resultados previsíveis em LLMs.
                    </p>
                </section>

                <section className="info-page__section">
                    <h2>O que você encontra aqui</h2>
                    <ul className="info-page__list">
                        <li>Biblioteca de prompts com categorias personalizadas.</li>
                        <li>Menus de contexto para padronizar tom, público e objetivos.</li>
                        <li>Exportação em JSON para automações e agentes.</li>
                        <li>Backup local e sincronização opcional na nuvem.</li>
                    </ul>
                </section>

                <section className="info-page__section">
                    <h2>Autor</h2>
                    <p>
                        Criado por Danilo Novais, o projeto prioriza acessibilidade, performance e clareza editorial
                        para uso diário em ambientes profissionais.
                    </p>
                </section>
            </div>
        </>
    );
}
