---
description: Template system for common code setups
---

# /templates - Template System for Common Setups

The template system allows you to quickly bootstrap projects with common code patterns, configurations, and setups. Especially powerful for monorepo architectures.

## Template Categories

### 1. **Frontend Templates**
- React + TypeScript + VITE
- Next.js + TypeScript
- Vue 3 + TypeScript
- Svelte + TypeScript
- Angular + TypeScript

### 2. **Backend Templates**
- Node.js + Express + TypeScript
- Node.js + Fastify + TypeScript
- Python + FastAPI
- Python + Django
- Go + Gin
- Rust + Axum

### 3. **Full-Stack Templates**
- Next.js Full Stack
- Nuxt.js Full Stack
- SvelteKit Full Stack
- Remix Full Stack

### 4. **Mobile Templates**
- React Native + TypeScript
- Flutter
- Expo + TypeScript

### 5. **DevOps Templates**
- Docker + Docker Compose
- Kubernetes + Helm
- Terraform + AWS
- GitHub Actions CI/CD

### 6. **Database Templates**
- PostgreSQL + Prisma
- MongoDB + Mongoose
- Redis + Node.js
- SQLite + TypeORM

## Monorepo Templates

### 1. **Packages Monorepo**
```
monorepo/
├── packages/
│   ├── frontend/          # React app
│   ├── backend/           # Node.js API
│   ├── shared/            # Shared types/utils
│   └── docs/              # Documentation
├── apps/
│   └── web/               # Production app
├── tools/
│   └── scripts/           # Build scripts
└── docker-compose.yml
```

### 2. **Microservices Monorepo**
```
monorepo/
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── payment-service/
│   └── notification-service/
├── shared/
│   ├── events/
│   ├── types/
│   └── utils/
├── infrastructure/
│   ├── k8s/
│   └── terraform/
└── monitoring/
    ├── prometheus/
    └── grafana/
```

### 3. **Full-Stack Monorepo**
```
monorepo/
├── apps/
│   ├── web/               # Next.js frontend
│   ├── api/               # tRPC backend
│   └── mobile/            # React Native
├── packages/
│   ├── ui/                # Shared UI components
│   ├── db/                # Database schema
│   ├── auth/              # Auth library
│   └── config/            # Shared config
└── tools/
    └── scripts/
```

## Template Commands

### /templates list
Show all available templates

### /templates show [template-name]
Display template details and structure

### /templates create [template-name] [project-name]
Create new project from template

### /templates combine [template1,template2,...] [project-name]
Combine multiple templates (monorepo)

## Template Structure

Each template includes:
- `template.json` - Metadata and dependencies
- `files/` - Template files with placeholders
- `scripts/` - Setup scripts
- `README.md` - Template documentation

### Example: React + TypeScript Template

```json
{
  "name": "react-typescript",
  "version": "1.0.0",
  "description": "React app with TypeScript and VITE",
  "category": "frontend",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "VITE": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@VITEjs/plugin-react": "^4.0.0"
  },
  "scripts": {
    "dev": "VITE",
    "build": "VITE build",
    "test": "VITEst"
  }
}
```

## Placeholder System

Templates use placeholders for customization:

### Placeholders
- `{{PROJECT_NAME}}` - Project name
- `{{PACKAGE_NAME}}` - Package name
- `{{AUTHOR_NAME}}` - Author name
- `{{DESCRIPTION}}` - Project description
- `{{REPO_URL}}` - Repository URL

### Example Template File
```typescript
// src/App.tsx
import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to {{PROJECT_NAME}}</h1>
      <p>{{DESCRIPTION}}</p>
    </div>
  );
}

export default App;
```

## Combining Templates

### Monorepo Example
```bash
/templates combine react-typescript,nodejs-express,shared-types my-monorepo
```

Creates:
- `packages/web/` - React frontend
- `packages/api/` - Node.js backend
- `packages/shared/` - Shared types
- `package.json` - Workspace configuration
- `turbo.json` - Turborepo config

### Template Combinations

| Frontend | Backend | Shared | Result |
|----------|---------|--------|---------|
| React + TypeScript | Node.js + Express | Shared Types | Full-stack monorepo |
| Next.js | - | - | Next.js full-stack |
| Vue 3 | Python FastAPI | Pydantic | Python full-stack |
| SvelteKit | - | - | SvelteKit full-stack |

## Template Registry

### Adding Custom Templates
```bash
mkdir ~/.max/templates/my-template
# Add template files
max templates register my-template
```

### Template Sources
1. **Built-in** - Shipped with Max
2. **Community** - GitHub registry
3. **Local** - User's custom templates
4. **Team** - Organization templates

## Integration with Max

### /start-session
- Detects template used
- Loads template-specific persona
- Sets up template workflows

### /optimize
- Template-specific optimizations
- Bundle size considerations
- Performance patterns

### /queue
- Template setup tasks
- Common onboarding steps
- Best practices checklist

## Future Enhancements

### 1. **Interactive Template Builder**
- Web UI for combining templates
- Visual configuration
- Real-time preview

### 2. **Template Marketplace**
- Community contributions
- Ratings and reviews
- Version management

### 3. **AI Template Generation**
- Generate templates from examples
- Learn from existing codebases
- Custom template creation

## Philosophy

Templates accelerate development by:
- Providing proven patterns
- Reducing boilerplate
- Ensuring best practices
- Enabling consistency
- Supporting rapid prototyping

No more "how do I set up X?" - templates have you covered.

💰 FREE 💰 💰 FREE 💰 💰 FREE 💰
