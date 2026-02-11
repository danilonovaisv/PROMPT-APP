interface SEOProps {
    title?: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
    url?: string;
}

const DEFAULT_TITLE = 'Prompt App — Engenharia de Prompts';
const DEFAULT_DESC = 'Crie, organize e exporte prompts estruturados para LLMs com engenharia de contexto profissional.';
const DEFAULT_IMAGE = '/og-image.png';

export default function SEO({
    title,
    description = DEFAULT_DESC,
    name = 'Prompt App',
    type = 'website',
    image = DEFAULT_IMAGE,
    url,
}: SEOProps) {
    const siteTitle = title ? `${title} | ${name}` : DEFAULT_TITLE;

    return (
        <>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name='description' content={description} />

            {/* End standard metadata tags */}

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            {url && <meta property="og:url" content={url} />}
            {/* End Facebook tags */}

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content={type} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            {/* End Twitter tags */}
        </>
    );
}
