interface RouteMetadata {
  title: string;
  description: string;
}

const STATIC_ROUTE_METADATA: Record<string, RouteMetadata> = {
  '/': {
    title: 'Início',
    description: 'Organize seus templates de prompt com menus independentes e exportação estruturada.',
  },
  '/sobre': {
    title: 'Sobre',
    description: 'Conheça a proposta do Prompt App e a abordagem local-first para engenharia de prompts.',
  },
  '/contato': {
    title: 'Contato',
    description: 'Entre em contato para dúvidas, melhorias e oportunidades ligadas ao ecossistema Prompt App.',
  },
  '/privacidade': {
    title: 'Privacidade',
    description: 'Entenda como o Prompt App trata dados locais, sincronização opcional e armazenamento em nuvem.',
  },
  '/categorias': {
    title: 'Gerenciar Categorias',
    description: 'Crie, edite e organize categorias para agrupar templates de prompt.',
  },
  '/menus': {
    title: 'Menus do Template',
    description: 'Gerencie menus de contexto reutilizáveis para os templates de prompt.',
  },
};

export function getRouteMetadata(pathname: string): RouteMetadata | null {
  if (STATIC_ROUTE_METADATA[pathname]) {
    return STATIC_ROUTE_METADATA[pathname];
  }

  if (pathname.startsWith('/categoria/')) {
    return {
      title: 'Categoria',
      description: 'Explore templates de prompt filtrados por categoria.',
    };
  }

  if (pathname.startsWith('/editor/')) {
    return {
      title: 'Editor de Template',
      description: 'Edite templates com preview, playground e memória fixa sincronizável.',
    };
  }

  return null;
}
