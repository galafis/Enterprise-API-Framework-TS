# Enterprise API Framework TS

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![License-MIT](https://img.shields.io/badge/License--MIT-yellow?style=for-the-badge)

</div>


Production-ready TypeScript REST API framework with middleware pipeline, dynamic routing, request validation, rate limiting, and plugin architecture.

[English](#english) | [Portugues](#portugues)

---

## English

### Overview

A modular API framework built in TypeScript that provides enterprise-grade features such as parameterized routing, composable middleware chains, request validation with schema rules, rate limiting, CORS handling, authentication middleware, and a plugin system for extensibility.

### Architecture

```mermaid
graph TB
    subgraph Request Pipeline
        A[Incoming Request] --> B[Rate Limiter]
        B --> C[Global Middleware]
        C --> D[Route Matching]
        D --> E[Route Middleware]
        E --> F[Request Validator]
        F --> G[Route Handler]
    end

    subgraph Framework Core
        H[ApiFramework]
        I[Router]
        J[Logger]
    end

    subgraph Built-in Middleware
        K[CORS Middleware]
        L[Auth Middleware]
        M[Rate Limiter]
    end

    subgraph Extensions
        N[Plugin System]
        O[Custom Middleware]
    end

    G --> P[HTTP Response]
    H --> I
    H --> J
    H --> M
    N --> H
    O --> C

    style Request Pipeline fill:#e1f5fe
    style Framework Core fill:#f3e5f5
    style Built-in Middleware fill:#e8f5e9
    style Extensions fill:#fff3e0
```

### Features

- Dynamic route matching with URL parameters (e.g., /users/:id)
- Composable middleware pipeline with global and per-route middleware
- Request validation with schema-based rules (type, length, pattern, range)
- Configurable rate limiting per client
- CORS middleware factory
- JWT-style authentication middleware
- Plugin architecture for framework extensions
- Structured logging with timestamps and levels
- Full TypeScript type safety

### Quick Start

```bash
git clone https://github.com/galafis/Enterprise-API-Framework-TS.git
cd Enterprise-API-Framework-TS
npm install
npm run dev
```

### Project Structure

```
Enterprise-API-Framework-TS/
├── main.ts            # Framework core with all components
├── tests/
│   └── main.test.ts   # Test suite
├── tsconfig.json
├── package.json
└── README.md
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Type-safe framework implementation |
| Node.js | Runtime environment |

### License

MIT License - see [LICENSE](LICENSE) for details.

### Author

**Gabriel Demetrios Lafis**
- GitHub: [@galafis](https://github.com/galafis)
- LinkedIn: [Gabriel Demetrios Lafis](https://linkedin.com/in/gabriel-demetrios-lafis)

---

## Portugues

### Visao Geral

Um framework de API modular construido em TypeScript que fornece recursos de nivel empresarial como roteamento parametrizado, cadeias de middleware composiveis, validacao de requisicoes com regras de esquema, limitacao de taxa, tratamento de CORS, middleware de autenticacao e um sistema de plugins para extensibilidade.

### Arquitetura

```mermaid
graph TB
    subgraph Pipeline de Requisicao
        A[Requisicao Recebida] --> B[Limitador de Taxa]
        B --> C[Middleware Global]
        C --> D[Correspondencia de Rota]
        D --> E[Middleware de Rota]
        E --> F[Validador de Requisicao]
        F --> G[Handler de Rota]
    end

    subgraph Nucleo do Framework
        H[ApiFramework]
        I[Router]
        J[Logger]
    end

    subgraph Middleware Integrado
        K[Middleware CORS]
        L[Middleware Auth]
        M[Limitador de Taxa]
    end

    subgraph Extensoes
        N[Sistema de Plugins]
        O[Middleware Customizado]
    end

    G --> P[Resposta HTTP]
    H --> I
    H --> J
    H --> M
    N --> H
    O --> C

    style Pipeline de Requisicao fill:#e1f5fe
    style Nucleo do Framework fill:#f3e5f5
    style Middleware Integrado fill:#e8f5e9
    style Extensoes fill:#fff3e0
```

### Funcionalidades

- Correspondencia dinamica de rotas com parametros de URL
- Pipeline de middleware composivel com middleware global e por rota
- Validacao de requisicoes com regras baseadas em esquema
- Limitacao de taxa configuravel por cliente
- Fabrica de middleware CORS
- Middleware de autenticacao estilo JWT
- Arquitetura de plugins para extensoes do framework
- Logging estruturado com timestamps e niveis
- Seguranca de tipos completa com TypeScript

### Inicio Rapido

```bash
git clone https://github.com/galafis/Enterprise-API-Framework-TS.git
cd Enterprise-API-Framework-TS
npm install
npm run dev
```

### Estrutura do Projeto

```
Enterprise-API-Framework-TS/
├── main.ts            # Nucleo do framework com todos os componentes
├── tests/
│   └── main.test.ts   # Suite de testes
├── tsconfig.json
├── package.json
└── README.md
```

### Licenca

Licenca MIT - veja [LICENSE](LICENSE) para detalhes.

### Autor

**Gabriel Demetrios Lafis**
- GitHub: [@galafis](https://github.com/galafis)
- LinkedIn: [Gabriel Demetrios Lafis](https://linkedin.com/in/gabriel-demetrios-lafis)
