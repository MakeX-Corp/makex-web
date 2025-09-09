# MakeX

An open-source AI-powered app builder that lets you create full-stack applications through natural language conversations.

## Features

- 🤖 **AI-Powered Development**: Build apps using natural language with multiple AI models
- 🔧 **Full-Stack Support**: Frontend, backend, and database integration
- 📱 **Expo/React Native**: Mobile app development support
- 🌐 **Web Applications**: Modern React/Next.js web apps
- 🔄 **Real-time Collaboration**: Live preview and editing
- 🚀 **One-Click Deployment**: Deploy your apps instantly
- 📦 **Export & Sync**: GitHub integration and code export
- 💳 **Built-in Payments**: Paddle integration for monetization

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI/LLM**: OpenAI, Anthropic Claude
- **Code Execution**: E2B Sandboxes
- **Background Jobs**: Trigger.dev
- **Payments**: Paddle
- **Analytics**: PostHog
- **Error Monitoring**: Sentry
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **Docker Desktop** (for local Supabase)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/makex.git
cd makex
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys and configuration values.

### 3. Database Setup

#### Option A: Local Development with Supabase

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase (requires Docker)
supabase start

# Apply database migrations
supabase db reset
```

This will start Supabase locally and provide you with:

- **Database URL**: `http://127.0.0.1:54321`
- **Studio UI**: `http://127.0.0.1:54323`
- **Anon Key**: Check terminal output

#### Option B: Supabase Cloud

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Run the migrations in your Supabase dashboard

### 4. Required Services

You'll need to set up the following services:

#### E2B (Code Execution)

1. Sign up at [e2b.dev](https://e2b.dev)
2. Get your API key from the dashboard
3. Add to `E2B_API_KEY` in your `.env.local`

#### AI Models

- **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com)
- **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)

#### Trigger.dev (Background Jobs)

1. Sign up at [trigger.dev](https://trigger.dev)
2. Create a new project
3. Add API key to `TRIGGER_API_KEY`

### 5. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Configuration

### Database Schema

The application uses the following main tables:

- `user_apps` - User applications
- `chat_sessions` - Chat conversation sessions
- `chat_history` - Message history
- `user_sandboxes` - Code execution environments
- `app_listing_info` - Public app listings

### API Routes

- `/api/app` - App management (CRUD)
- `/api/chat` - AI chat functionality
- `/api/code/*` - Code file operations
- `/api/sandbox` - Sandbox management
- `/api/sessions` - Chat session management

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Docker

```bash
# Build the Docker image
docker build -t makex .

# Run the container
docker run -p 3000:3000 makex
```

## Development

### Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── (pages)/           # App pages
├── components/            # React components
│   ├── app/              # App-specific components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
├── utils/                # Helper functions
│   ├── client/           # Client-side utilities
│   └── server/           # Server-side utilities
├── trigger/              # Background job definitions
└── supabase/            # Database migrations
```

### Adding New Features

1. **API Routes**: Add new endpoints in `app/api/`
2. **Components**: Create reusable components in `components/`
3. **Database**: Add migrations in `supabase/migrations/`
4. **Background Jobs**: Define jobs in `trigger/`

### Running Tests

```bash
npm run test
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 **Email**: support@makex.app
- 💬 **Discord**: [Join our community](https://discord.gg/makex)
- 📖 **Documentation**: [docs.makex.app](https://docs.makex.app)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/makex/issues)

## Acknowledgments

- [Vercel](https://vercel.com) for hosting and deployment
- [Supabase](https://supabase.com) for database and authentication
- [E2B](https://e2b.dev) for secure code execution
- [OpenAI](https://openai.com) and [Anthropic](https://anthropic.com) for AI models

---

Built with ❤️ by the MakeX team
