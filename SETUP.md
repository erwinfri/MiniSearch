# MiniSearch: Privacy-First AI-Powered Web Search That Runs in Your Browser

**A minimalist, self-hosted search engine with integrated AI assistance—no tracking, no ads, complete privacy.**

## What is MiniSearch?

MiniSearch is an innovative web search application that combines the power of [SearXNG](https://docs.searxng.org/) metasearch with AI-powered response generation, all while maintaining strict privacy standards. Originally created by [felladrin](https://github.com/felladrin/MiniSearch), this fork has been adapted as an example application for IBM Guardium presales demonstrations.

What makes MiniSearch unique is its hybrid approach to AI inference: models can run entirely in your browser (using WebGPU/WebAssembly), connect to remote APIs (OpenAI-compatible endpoints), or leverage community resources (AI Horde)—giving you complete control over your data and processing preferences.

## Key Features

**Privacy-Focused Architecture**
- Zero tracking, no advertisements, no data collection
- Local storage using IndexedDB (via Dexie.js)
- All search history and preferences stay on your device
- SearXNG metasearch aggregates results without exposing your queries

**Flexible AI Processing**
- **Browser-based inference**: Run models locally using WebLLM or Wllama
- **Remote API support**: Connect to OpenAI-compatible endpoints
- **AI Horde integration**: Use community-powered inference
- **Internal API mode**: Server-side inference without exposing API keys to users

**Modern Tech Stack**
- React 19 + TypeScript for type-safe development
- Mantine UI components for consistent, accessible design
- Vite for lightning-fast builds and HMR
- PubSub state management pattern (via `create-pubsub`)
- Docker containerization for easy deployment

**Developer-Friendly**
- Comprehensive linting with Biome, TypeScript, and dependency checks
- Pre-commit hooks via Husky and lint-staged
- Feature-based component architecture
- Extensive test coverage with Vitest

## Architecture Overview

MiniSearch follows a clean separation of concerns:

### Client (`/client`)
- **Components**: Feature-based organization (`Search`, `AiResponse`, `Analytics`)
- **Modules**: Core business logic including PubSub stores, search services, and AI inference engines
- **Hooks**: Reusable React hooks for state management and side effects

### Server (`/server`)
- **Search Pipeline**: Validation, caching, compression, and result reranking
- **API Endpoints**: Search, status, and internal AI inference
- **Security**: Access key validation, rate limiting, CORS handling

### Shared (`/shared`)
- Common utilities and type definitions used across client and server

## Getting Started with Podman Compose

### Prerequisites

- [Podman](https://podman.io/getting-started/installation) installed on your system
- Podman Compose (usually included with Podman Desktop or installable via package manager)

### Production Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/felladrin/MiniSearch.git
   cd MiniSearch
   ```

2. **Configure environment variables** (optional)
   ```bash
   cp .env.example .env
   # Edit .env to customize settings
   ```

   Key configuration options:
   - `ACCESS_KEYS`: Comma-separated list for password protection
   - `WEBLLM_DEFAULT_F16_MODEL_ID`: Default WebLLM model (F16 shaders)
   - `WLLAMA_DEFAULT_MODEL_ID`: Default Wllama model
   - `INTERNAL_OPENAI_COMPATIBLE_API_BASE_URL`: Internal API endpoint
   - `DEFAULT_INFERENCE_TYPE`: Default AI processing location (`browser`, `openai`, `horde`, or `internal`)

3. **Build and run with Podman Compose**
   ```bash
   podman compose -f docker-compose.production.yml up --build
   ```

   This command:
   - Builds the Docker image from the [`Dockerfile`](Dockerfile:1)
   - Compiles llama.cpp for local inference capabilities
   - Sets up SearXNG metasearch engine
   - Builds the React application
   - Starts the production server on port 7860

4. **Access MiniSearch**
   
   Open your browser and navigate to:
   ```
   http://localhost:7860
   ```

### Container Details

The production container includes:

- **Node.js LTS**: Runtime environment
- **llama.cpp**: Compiled from source for efficient local inference
- **SearXNG**: Python-based metasearch engine with custom configuration
- **MiniSearch Application**: Built React frontend and Vite preview server

The [`docker-compose.production.yml`](docker-compose.production.yml:1) file configures:
- Host binding (default: `0.0.0.0`)
- Port mapping (default: `7860:7860`)
- SSL support via `BASIC_SSL` environment variable
- All environment variables from `.env` file

### Development Mode

For active development with hot module replacement:

```bash
podman compose up
```

This uses the standard [`docker-compose.yml`](docker-compose.yml:1) configuration optimized for development workflows.

## Advanced Configuration

### Password Protection

Restrict access by setting `ACCESS_KEYS` in your `.env` file:

```env
ACCESS_KEYS="SecurePassword123,AnotherKey456"
```

Users will need to enter one of these keys to access the application.

### Internal API Setup

Serve AI responses using your own API key without exposing it to users:

```env
INTERNAL_OPENAI_COMPATIBLE_API_BASE_URL="https://api.openai.com/v1"
INTERNAL_OPENAI_COMPATIBLE_API_KEY="sk-your-api-key"
INTERNAL_OPENAI_COMPATIBLE_API_MODEL="gpt-4"
INTERNAL_OPENAI_COMPATIBLE_API_NAME="Internal GPT-4"
```

After restarting, users can select this option from the "AI Processing Location" dropdown.

### Browser Integration

Set MiniSearch as your default search engine using the pattern:
```
http://localhost:7860/?q=%s
```

Replace `%s` with your search query in your browser's search engine settings.

## Technology Highlights

**AI Inference Options**:
- [`@mlc-ai/web-llm`](package.json:36): WebGPU-accelerated inference
- [`@wllama/wllama`](package.json:38): WebAssembly-based inference
- [`ai`](package.json:39) + [`@ai-sdk/openai-compatible`](package.json:27): Remote API integration

**Search & Processing**:
- [`searxng`](package.json:64): Privacy-respecting metasearch
- [`keyword-extractor`](package.json:51): Query analysis
- [`@leeoniya/ufuzzy`](package.json:29): Fuzzy search capabilities

**State Management**:
- [`create-pubsub`](package.json:41): Lightweight PubSub pattern
- [`dexie`](package.json:43): IndexedDB wrapper for local storage

**UI Framework**:
- [`@mantine/core`](package.json:32): Component library
- [`@mantine/hooks`](package.json:34): Utility hooks
- [`react-markdown`](package.json:61): Markdown rendering with [`remark-gfm`](package.json:63)

## Contributing

MiniSearch welcomes contributions! The project follows strict code quality standards:

```bash
npm run lint      # Check code quality
npm run format    # Auto-format with Biome
npm run test      # Run test suite
```

All commits are automatically formatted via Husky pre-commit hooks.

## License

Apache-2.0 License - See [`license.txt`](license.txt:1) for details.

## Links

- **Live Demo**: https://felladrin-minisearch.hf.space
- **Original Repository**: https://github.com/felladrin/MiniSearch
- **SearXNG Documentation**: https://docs.searxng.org/

---

MiniSearch represents a new paradigm in web search: privacy-first, AI-enhanced, and completely under your control. Whether you're running it locally for personal use or deploying it for a team, MiniSearch puts you back in charge of your search experience.