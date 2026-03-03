# ClawCommand 🦞

**OpenClaw Mission Control Dashboard**

ClawCommand is a comprehensive, TRON-inspired mission control dashboard for managing OpenClaw AI agents. Built with React 19, TypeScript 5.9, and Tailwind CSS 4.0.

![ClawCommand Dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80)

## Features

### Core Modules
- **Factory Floor** - Visual agent topology with drag-and-drop positioning
- **Agent Command** - Complete agent lifecycle management
- **Agent Chat** - Real-time chat interface with agents
- **Agent Swarm** - Multi-agent orchestration and coordination
- **Voice Hub** - Whisper STT, TTS, and ElevenLabs voice synthesis
- **QMD Analytics** - Quality Management Database for agent evaluation

### Management Tools
- **Workflow Builder** - Visual node-based workflow editor
- **Model Routing** - Intelligent request routing across models
- **Budget Control** - Per-agent budget management and alerts
- **Skills Forge** - Agent skill development and management
- **Task Command** - Task assignment and tracking
- **Session Center** - Session management and history

### System Features
- **Analytics Dashboard** - Real-time metrics and insights
- **Cron Scheduler** - Automated job scheduling
- **Channel Hub** - Multi-channel integration management
- **Tool Config** - External tool configuration
- **System Monitor** - Logs and performance monitoring
- **Environment Detection** - Session-aware runtime snapshot with secret redaction

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/clawcommand.git
cd clawcommand

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required for live P0 integrations (Agents, Models, Memory, Chat, Factory Floor, Swarm)
VITE_OPENCLAW_API_BASE=http://localhost:3001
VITE_OPENCLAW_API_TOKEN=optional_bearer_token

# Optional runtime action and ledger endpoints
VITE_RUNTIME_ACTION_ENDPOINT=http://localhost:3001/api/runtime/actions
VITE_RUNTIME_LEDGER_ENDPOINT=http://localhost:3001/api/runtime/ledger

# Optional existing integrations
VITE_OPENCLAW_GATEWAY_URL=http://localhost:8080
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ANALYTICS_ID=your_analytics_id
```

## Verification Commands (P0 Live Integration)

Run these exactly from `app/`:

```bash
npm install
npm test
npm run build
npm run dev
```

Optional API smoke checks (if runtime is available):

```bash
curl -H "Authorization: Bearer $VITE_OPENCLAW_API_TOKEN" "$VITE_OPENCLAW_API_BASE/api/agents"
curl -H "Authorization: Bearer $VITE_OPENCLAW_API_TOKEN" "$VITE_OPENCLAW_API_BASE/api/models"
curl -H "Authorization: Bearer $VITE_OPENCLAW_API_TOKEN" "$VITE_OPENCLAW_API_BASE/api/runtime/status"
```

## Environment + Session Detection

- Config file: `src/config/environment-profile.ts`
- Detector: `src/lib/environment-session.ts`
- UI: Settings → Environment tab
- Validation: `npm run validate:environment`
- Detailed docs: `../docs/environment-session-detection.md`

## Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
npm run deploy
```

## Project Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, Header
│   ├── ui/            # shadcn/ui components
│   └── factory-floor/ # Factory floor components
├── pages/             # Main page components
├── stores/            # Zustand state management
├── types/             # TypeScript type definitions
├── data/              # Mock data and constants
├── hooks/             # Custom React hooks
└── lib/               # Utility functions
```

## Voice Integration

ClawCommand includes comprehensive voice capabilities:

### Whisper STT
- Browser-based audio recording
- OpenAI Whisper API integration
- Multi-language support
- Configurable temperature and prompts

### Text-to-Speech
- Web Speech API integration
- Multiple voice options
- Speed and pitch control
- Generation history

### ElevenLabs
- Premium AI voice synthesis
- 29+ languages support
- Voice cloning capabilities
- Emotion and style control

## QMD (Quality Management Database)

Monitor and analyze agent conversation quality:

- **Session Scoring** - 5-metric evaluation system
- **Agent Profiles** - Performance tracking per agent
- **Trend Analysis** - 7-day quality trends
- **Flag Detection** - Automatic issue identification

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://docs.clawhub.ai](https://docs.clawhub.ai)
- Issues: [GitHub Issues](https://github.com/yourusername/clawcommand/issues)
- Discord: [Join our community](https://discord.gg/clawcommand)

---

Built with ❤️ by the OpenClaw Team
