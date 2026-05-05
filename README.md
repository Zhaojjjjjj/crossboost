# CrossBoost

AI-Powered Cross-Border E-Commerce Content Marketing Platform.

Generate product videos, write multilingual listings, publish to 4+ platforms, and track performance — all powered by AI Agents.

## Features

- **Product Management** — Manage your product catalog with SKU, images, and selling points
- **AI Content Studio** — Generate product videos, marketing images, and listing copy using AI
- **Multi-Platform Publishing** — One-click publish to TikTok Shop, Instagram, Pinterest, YouTube
- **Analytics Dashboard** — Track content performance and ROI across all platforms
- **AI Agent** — Natural language interface for content creation and analysis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Zustand |
| Backend | NestJS, Nx Monorepo, BullMQ |
| AI | OpenAI, Anthropic Claude, Google Gemini, Grok, Volcengine |
| Database | MongoDB (Mongoose), Redis |
| Storage | S3-compatible (RustFS/AWS S3) |
| Protocol | MCP (Model Context Protocol) |
| Deploy | Docker Compose, Nginx |

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url> crossboost
cd crossboost

# Copy environment config
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker compose up -d

# Access the application
open http://localhost:8080
```

### Development

```bash
# Install dependencies
cd backend && pnpm install

# Start backend services
pnpm ai:serve     # AI service on port 3010
pnpm server:serve # Server on port 3002

# Start frontend
cd ../web && npm install && npm run dev
```

## Project Structure

```
crossboost/
├── backend/                    # Nx Monorepo
│   ├── apps/
│   │   ├── crossboost-ai/      # AI services (port 3010)
│   │   └── crossboost-server/  # Business logic (port 3002)
│   └── libs/                   # Shared libraries
├── web/                        # Next.js frontend
├── nginx/                      # Nginx config
├── scripts/                    # Init scripts
└── docker-compose.yml          # Full stack orchestration
```

## AI Agent Skills

- `generate-product-video` — Create product videos from images and selling points
- `generate-product-images` — Generate marketing visuals and lifestyle shots
- `write-listing-copy` — Write multilingual, SEO-optimized product descriptions
- `adapt-content` — Resize and reformat content for different platforms
- `analyze-performance` — Analyze content ROI and engagement metrics

## License

MIT
