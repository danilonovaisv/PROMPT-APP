/* ======================================================
   Página Contato
   ====================================================== */

import SEO from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ContactPage() {
    return (
        <>
            <SEO
                title="Contato"
                description="Canais oficiais para suporte e colaboração no Prompt App."
                url="https://prompt-app-dan.netlify.app/contato"
            />
            <header className="app-header">
                <h1 className="app-header__title">Contato</h1>
            </header>

            <div className="app-content info-page">
                {/* A11y Audit Fix #09: Breadcrumbs */}
                <Breadcrumb
                    items={[
                        { label: 'Início', href: '/' },
                        { label: 'Contato' },
                    ]}
                />

                <h2 className="info-page__title">Fale com o time do Prompt App</h2>
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
                            Perfil do autor:{' '}
                            <a href="https://github.com/danilonovaisv" target="_blank" rel="noopener noreferrer">github.com/danilonovaisv</a>
                        </li>
                    </ul>
                </section>
            </div>
        </>
    );
}
