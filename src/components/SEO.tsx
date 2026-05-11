import { useEffect } from 'react';
import { getRouteMetadata } from '@/utils/routeMetadata';

interface SEOProps {
    title?: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
    url?: string;
    twitterCard?: string;
}

const DEFAULT_TITLE = 'Prompt App — Engenharia de Prompts';
const DEFAULT_DESC =
    'Prompt App permite criar, organizar e exportar prompts estruturados para LLMs com menus de contexto, categorias inteligentes e backup local-first.';
const DEFAULT_IMAGE = '/PROMPT-APP-LOGO.png';
const DEFAULT_TWITTER_CARD = 'summary_large_image';

export default function SEO({
    title,
    description = DEFAULT_DESC,
    name = 'Prompt App',
    type = 'website',
    image = DEFAULT_IMAGE,
    url,
    twitterCard = DEFAULT_TWITTER_CARD,
}: SEOProps) {
    const routeMetadata = typeof window !== 'undefined' ? getRouteMetadata(window.location.pathname) : null;
    const resolvedTitle = title ?? routeMetadata?.title;
    const resolvedDescription = description ?? routeMetadata?.description ?? DEFAULT_DESC;
    const siteTitle = resolvedTitle ? `${resolvedTitle} | ${name}` : DEFAULT_TITLE;

    const ensureMeta = (selector: string, attrs: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement('meta');
            document.head.appendChild(element);
        }
        Object.entries(attrs).forEach(([key, value]) => {
            element!.setAttribute(key, value);
        });
    };

    const ensureLink = (selector: string, attrs: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement('link');
            document.head.appendChild(element);
        }
        Object.entries(attrs).forEach(([key, value]) => {
            element!.setAttribute(key, value);
        });
    };

    useEffect(() => {
        const resolvedUrl = url || `${window.location.origin}${window.location.pathname}`;
        document.title = siteTitle;
        ensureMeta('meta[name="description"]', { name: 'description', content: resolvedDescription });
        ensureMeta('meta[property="og:type"]', { property: 'og:type', content: type });
        ensureMeta('meta[property="og:title"]', { property: 'og:title', content: siteTitle });
        ensureMeta('meta[property="og:description"]', {
            property: 'og:description',
            content: resolvedDescription,
        });
        ensureMeta('meta[property="og:image"]', { property: 'og:image', content: image });
        ensureMeta('meta[property="og:url"]', { property: 'og:url', content: resolvedUrl });
        ensureLink('link[rel="canonical"]', { rel: 'canonical', href: resolvedUrl });
        ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: twitterCard });
        ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: siteTitle });
        ensureMeta('meta[name="twitter:description"]', {
            name: 'twitter:description',
            content: resolvedDescription,
        });
        ensureMeta('meta[name="twitter:image"]', {
            name: 'twitter:image',
            content: image,
        });
    }, [image, resolvedDescription, siteTitle, twitterCard, type, url]);

    return null;
}
