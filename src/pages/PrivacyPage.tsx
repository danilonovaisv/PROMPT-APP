/* ======================================================
   Página Privacidade
   ====================================================== */

import SEO from '@/components/SEO';

export default function PrivacyPage() {
    return (
        <>
            <SEO
                title="Privacidade"
                description="Política de privacidade do Prompt App com foco em dados locais e sincronização opcional."
                url="https://prompt-app-dan.netlify.app/privacidade"
            />
            <header className="app-header">
                <h1 className="app-header__title">Privacidade</h1>
            </header>

            <div className="app-content info-page">
                <h2 className="info-page__title">Política de Privacidade</h2>
                <p className="info-page__meta">
                    Vigente a partir de 22 de fevereiro de 2026.
                </p>

                <section className="info-page__section">
                    <p>
                        O Prompt App é uma aplicação local-first. Seus dados são armazenados no navegador usando
                        IndexedDB, o que significa que permanecem no seu dispositivo até que você decida apagá-los.
                    </p>
                </section>

                <section className="info-page__section">
                    <h2>Sincronização na nuvem (opcional)</h2>
                    <p>
                        Quando você habilita a sincronização, os dados são enviados para uma instância do Supabase
                        associada ao projeto. Esse processo depende de autenticação via email e serve apenas para
                        backup e recuperação dos seus prompts.
                    </p>
                </section>

                <section className="info-page__section">
                    <h2>Coleta e uso de dados</h2>
                    <ul className="info-page__list">
                        <li>Armazenamos prompts, categorias e menus apenas para o funcionamento do app.</li>
                        <li>Não vendemos dados nem compartilhamos informações com terceiros fora da sincronização.</li>
                        <li>Você pode remover seus dados locais limpando o armazenamento do navegador.</li>
                    </ul>
                </section>

                <section className="info-page__section">
                    <h2>Contato</h2>
                    <p>
                        Dúvidas sobre privacidade podem ser registradas no repositório do projeto:
                        {' '}
                        <a href="https://github.com/danilonovaisv/PROMPT-APP" target="_blank" rel="noopener noreferrer">
                            github.com/danilonovaisv/PROMPT-APP
                        </a>
                    </p>
                </section>
            </div>
        </>
    );
}
