/* ======================================================
   Página Contato
   ====================================================== */

import SEO from '@/components/SEO';

export default function ContactPage() {
    return (
        <>
            <SEO
                title="Contato"
                description="Canais oficiais para suporte e colaboração no Prompt App."
                url="https://prompt-app-dan.netlify.app/contato"
            />
            <header className="app-header">
                <h2 className="app-header__title">Contato</h2>
            </header>

            <div className="app-content info-page">
                <h1 className="info-page__title">Fale com o time do Prompt App</h1>
                <p className="info-page__meta">
                    Atendimento via canais oficiais do projeto.
                </p>

                <section className="info-page__section">
                    <p>
                        Para suporte técnico, sugestões ou colaboração, utilize os canais públicos do projeto. Eles
                        garantem histórico de conversas e transparência para toda a comunidade.
                    </p>
                </section>

                <section className="info-page__section">
                    <h2>Canais disponíveis</h2>
                    <ul className="info-page__list">
                        <li>
                            Repositório e issues:{' '}
                            <a href="https://github.com/danilonovaisv/PROMPT-APP">
                                github.com/danilonovaisv/PROMPT-APP
                            </a>
                        </li>
                        <li>
                            Perfil do autor:{' '}
                            <a href="https://github.com/danilonovaisv">github.com/danilonovaisv</a>
                        </li>
                    </ul>
                </section>
            </div>
        </>
    );
}
