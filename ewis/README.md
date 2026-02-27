# EWIS — AI Enterprise Workflow Intelligence System

> **Full-stack AI automation platform** showcasing production-grade n8n pipeline design, Google ADK agent integration, and enterprise automation patterns.

```
[React Dashboard UI] → [FastAPI Backend] → [n8n Workflows] → [ADK Agent + Gemini] → [PostgreSQL]
```

---

## Architecture

```
                    ┌──────────────────────────┐
                    │     React Dashboard       │  localhost:3000
                    └─────────┬────────────────┘
                              │ REST + Webhook calls
                    ┌─────────▼────────────────┐
                    │     FastAPI Backend       │  localhost:8000
                    └──┬──────────┬─────────────┘
                       │          │
        ┌──────────────▼──┐   ┌───▼──────────────────┐
        │   n8n Workflows  │   │  Google ADK Agent     │
        │  localhost:5678  │   │  Gemini 1.5 Pro       │
        │                  │   │  5 custom tools       │
        │ WF1: Intake      │──▶│  - classify_project   │
        │ WF2: Documents   │   │  - estimate_effort    │
        │ WF3: Agent Relay │   │  - recommend_stack    │
        │ WF4: Reports     │   │  - search_kb          │
        └────────┬─────────┘   │  - analyze_risk       │
                 │             └──────────────────────┘
        ┌────────▼──────────┐
        │    PostgreSQL     │  localhost:5432
        └───────────────────┘
```

---

## Prerequisites

- **Docker Desktop** (v4.x+) — [download](https://www.docker.com/products/docker-desktop/)
- **Node.js 20+** — only needed for local development outside Docker
- **Python 3.11+** — only needed for local development outside Docker
- A **Gemini API key** — [get one free](https://aistudio.google.com/app/apikey) (or an OpenAI key)

---

## Quick Start (5 Steps)

### Step 1 — Clone & Configure

```bash
cd ewis
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY (minimum required)
```

### Step 2 — Start the Stack

```bash
docker-compose up -d
```

Wait for all containers to be healthy (~60 seconds):
```bash
docker-compose ps
# All 4 services should show "healthy"
```

### Step 3 — Seed Demo Data

```bash
docker exec ewis-backend python seed.py
# ✅ Seed data loaded: 3 projects, 2 documents, 1 report
```

### Step 4 — Import n8n Workflows

1. Open **http://localhost:5678** (login: `admin` / `changeme`)
2. Go to **Settings → Import** (or use the `+` button → Import)
3. Import all 4 JSON files from `n8n-workflows/`:
   - `workflow-1-intake-router.json`
   - `workflow-2-document-analyzer.json`
   - `workflow-3-ai-support-agent.json`
   - `workflow-4-report-generator.json`
4. Activate all 4 workflows (toggle to green)

### Step 5 — Open the Dashboard

```
http://localhost:3000
```

The dashboard loads with 3 seed projects, 1 pre-generated report, and all 4 workflow status indicators.

---

## How to Configure the Google ADK Agent

The ADK agent is configured in `backend/agent/adk_agent.py` and uses `GOOGLE_API_KEY` from your `.env` file.

**Switching models:**
```bash
# In .env, add:
GEMINI_MODEL=gemini-2.0-flash    # lower latency
# or
GEMINI_MODEL=gemini-1.5-pro      # default, higher quality
```

**Tools available:**
| Tool | Description |
|---|---|
| `classify_project` | Category, complexity, tech stack |
| `estimate_effort` | Timeline, cost range, risk level |
| `recommend_tech_stack` | Architecture + technology choices |
| `search_knowledge_base` | Similar past project patterns |
| `analyze_risk` | Delivery, technical, and integration risk scores |

**Without an API key:** The agent returns realistic mock responses for demo purposes — all 5 screens work fully with mock data.

---

## Demo Walkthrough

### Act 1 — Dashboard Overview (2 min)
Open `http://localhost:3000/dashboard`. Show the 4 KPI cards and workflow status feed.

### Act 2 — Live Intake Form (3 min)
Go to **Intake Form**. Click "Demo Data" to pre-fill, then submit. Watch the AI classification result panel populate in real-time.

### Act 3 — Document Analyzer (3 min)
Go to **Document Analyzer**. Click "Sample" then "Analyze Document". Watch the two-pass AI extraction produce structured entities, topics, risks, and an executive summary.

### Act 4 — Agent Chat (3 min)
Go to **Agent Chat**. Click any sample query. Watch the agent use multiple tools and display tool-call indicators (🔧). Ask a follow-up to show session continuity.

### Act 5 — Reports Archive (2 min)
Go to **Reports Archive**. Click the seeded report to view the full rendered weekly briefing. Toggle between Markdown and HTML views.

---

## API Reference

### Projects
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects` | Create a project record |
| GET | `/api/projects` | List projects (`?since=7days`) |
| GET | `/api/projects/{id}` | Get single project |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents` | Store document analysis |
| GET | `/api/documents` | List documents |

### Agent
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/invoke` | Invoke ADK agent, returns `task_id` |
| GET | `/api/agent/status/{id}` | Poll agent task status |
| GET | `/api/agent/result/{id}` | Get completed agent result |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sessions/{id}/history` | Get conversation history |
| POST | `/api/sessions/{id}/history` | Append conversation turn |

### Reports & System
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reports` | Archive a generated report |
| GET | `/api/reports` | List all reports |
| POST | `/api/errors` | Log workflow errors |
| GET | `/api/stats` | Dashboard stats |

Full interactive docs: **http://localhost:8000/docs**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Gemini API key |
| `OPENAI_API_KEY` | Optional | OpenAI alternative |
| `POSTGRES_DB` | ✅ | Database name (default: `ewis`) |
| `POSTGRES_USER` | ✅ | DB username |
| `POSTGRES_PASSWORD` | ✅ | DB password |
| `N8N_BASIC_AUTH_USER` | ✅ | n8n admin username |
| `N8N_BASIC_AUTH_PASSWORD` | ✅ | n8n admin password |
| `SMTP_HOST` | Optional | SMTP server for email nodes |
| `SMTP_USER` | Optional | SMTP username |
| `SMTP_PASS` | Optional | SMTP password (app password) |
| `SLACK_WEBHOOK_URL` | Optional | Slack incoming webhook for WF4 |
| `REPORT_EMAIL_LIST` | Optional | Comma-separated report recipients |
| `GEMINI_MODEL` | Optional | Override model (default: gemini-1.5-pro) |

---

## Production Scaling Notes

- **n8n queue mode**: Add `N8N_EXECUTIONS_MODE=queue` + Redis for multiple workers
- **FastAPI**: Deploy on Kubernetes with HPA; add PgBouncer for connection pooling
- **ADK agent**: Replace `InMemorySessionService` with Redis for multi-user concurrency
- **Monitoring**: Connect n8n error workflow to Datadog/CloudWatch

---

*Built for FPT Software Senior AI Engineer interview — demonstrating production-grade n8n pipeline design, Google ADK multi-tool agent integration, and full-stack AI engineering.*
