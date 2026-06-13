import { useNavigate } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import SEO from '@/components/SEO';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <>
            <SEO
                title="Página não encontrada"
                description="A página que você procura não existe ou foi movida."
            />
            <div className="app-content">
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <SearchX size={48} color="var(--color-text-muted)" />
                    </div>
                    <h1 className="empty-state__title">Página não encontrada</h1>
                    <p className="empty-state__description">
                        A página que você procura não existe ou foi movida.
                    </p>
                    <button className="btn btn--primary" onClick={() => navigate('/')}>
                        <Home size={16} />
                        Voltar ao Início
                    </button>
                </div>
            </div>
        </>
    );
}
