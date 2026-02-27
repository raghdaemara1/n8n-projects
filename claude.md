# Claude.md — AI Enterprise Workflow Intelligence System (EWIS)

## Project Overview

Build a full-stack **AI-Powered Enterprise Workflow Intelligence System** — a working demo application that showcases senior-level n8n pipeline design, Google ADK agent integration, and real enterprise automation patterns. This project is designed to demonstrate advanced AI engineering capabilities to FPT Software (a global AI-first IT services company).

The app simulates what an enterprise AI automation system looks like in production: multi-step n8n workflows, AI agents making decisions, real API integrations, and a clean UI dashboard to present it.

---

## Tech Stack

- **n8n** (self-hosted or n8n Cloud) — core workflow orchestration engine
- **Google ADK (Agent Development Kit)** — Python-based multi-tool AI agent backend
- **Gemini 1.5 Pro / GPT-4o** — LLM powering agent reasoning
- **FastAPI** — lightweight Python API server exposing ADK agent endpoints
- **PostgreSQL** — persistent storage for workflow data and logs
- **React + Tailwind CSS** — frontend dashboard UI
- **Docker Compose** — local development environment
- **Webhook.site or ngrok** — for local webhook testing

---

## Application Architecture

```
[React Dashboard UI]
        |
   [FastAPI Backend]
        |
   ┌────┴────┐
   │  n8n   │   ←── Webhook triggers, scheduled runs, event-based
   └────┬────┘
        │
   ┌────┴────────────────────────────┐
   │     Google ADK Agent Server     │
   │  (Python FastAPI + ADK runtime) │
   │  Tools: search, classify,       │
   │  summarize, score, recommend    │
   └─────────────────────────────────┘
        │
   [PostgreSQL DB]
```

---

## Project Structure

```
ewis/
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkflowCard.jsx
│   │   │   ├── AgentChat.jsx
│   │   │   ├── PipelineStatus.jsx
│   │   │   └── ResultsTable.jsx
│   │   └── index.css
│   └── package.json
├── backend/
│   ├── main.py              # FastAPI app
│   ├── agent/
│   │   ├── adk_agent.py     # Google ADK agent definition
│   │   ├── tools.py         # Custom tools for the agent
│   │   └── prompts.py       # System prompts
│   ├── db/
│   │   ├── models.py        # SQLAlchemy models
│   │   └── database.py      # DB connection
│   └── requirements.txt
├── n8n-workflows/
│   ├── workflow-1-intake-router.json
│   ├── workflow-2-document-analyzer.json
│   ├── workflow-3-ai-support-agent.json
│   └── workflow-4-report-generator.json
└── .env.example
```

---

## n8n Workflows — Full Specifications

### Workflow 1: Smart Intake Router

**Purpose:** Receives new project/task requests via webhook, uses AI to classify and enrich them, routes to the appropriate downstream workflow, creates a database record, and sends notifications.

**Trigger:** HTTP Webhook (POST /webhook/intake)

**Input Payload:**
```json
{
  "client_name": "string",
  "project_title": "string",
  "description": "string",
  "priority": "low|medium|high|critical",
  "requester_email": "string"
}
```

**Nodes (in order):**

1. **Webhook Node** — Receives POST request at `/webhook/intake`
2. **Set Node** — Normalize and clean incoming data fields
3. **OpenAI / Gemini Node (AI Classification)** — System prompt: "You are an enterprise project classifier. Given the project description, return a JSON object with: category (one of: digital_transformation, ai_automation, data_analytics, cloud_migration, iot, security, other), complexity_score (1-10), estimated_days (integer), recommended_team_size (integer), key_technologies (array of strings), summary (2 sentences max). Return only valid JSON."
4. **JSON Parse Node** — Parse AI response into structured object
5. **Switch Node** — Branch based on `category`:
   - `ai_automation` → HTTP Request to Workflow 3 (AI Support)
   - `data_analytics` → HTTP Request to Workflow 2 (Document Analyzer)
   - others → continue in main flow
6. **HTTP Request Node** — POST to FastAPI `/api/projects` to save record in PostgreSQL
7. **IF Node** — Check if `priority` is `critical` or `high`
   - True → Send Slack notification (Slack node) + Email (Gmail/SMTP node)
   - False → Send email only
8. **Gmail/SMTP Node** — Send confirmation email to `requester_email` with AI-generated project summary
9. **Set Node** — Build final response payload
10. **Respond to Webhook Node** — Return structured JSON response

**Error Handling:**
- Add Try/Catch wrapper around the AI node
- On error: log to PostgreSQL via HTTP Request to `/api/errors` and send alert email

---

### Workflow 2: Document Intelligence Analyzer

**Purpose:** Accepts uploaded documents (PDF, DOCX, or plain text), extracts text, runs multi-step AI analysis, stores structured insights, and returns a formatted intelligence report.

**Trigger:** HTTP Webhook (POST /webhook/analyze-document) with multipart/form-data OR base64 string

**Nodes (in order):**

1. **Webhook Node** — Receives document data
2. **Code Node (JavaScript)** — Extract text from base64 if needed; prepare text for AI
3. **Split In Batches Node** — Split long documents into 2000-token chunks for AI processing
4. **OpenAI / Gemini Node (Extraction)** — For each chunk: "Extract the following from this document chunk: key entities (people, orgs, dates), main topics, action items, risks, and technology mentions. Return as JSON."
5. **Merge Node** — Recombine all chunk analysis results
6. **Code Node** — Aggregate and deduplicate extracted entities across chunks
7. **OpenAI / Gemini Node (Summary)** — "Given this aggregated analysis data, write a structured executive summary with: 1) Overview, 2) Key Findings, 3) Risks, 4) Recommended Actions, 5) Technology Stack Detected. Use markdown formatting."
8. **HTTP Request Node** — POST insights to `/api/documents` in PostgreSQL
9. **Set Node** — Build final response with report + metadata
10. **Respond to Webhook Node** — Return full analysis report as JSON

**Error Handling:**
- Validate file size (< 10MB) at step 2, return 400 error if too large
- If AI node fails, return partial results with error flag

---

### Workflow 3: AI Support Agent Relay

**Purpose:** Acts as the n8n interface to the Google ADK Agent backend. Accepts natural language queries, passes them to the ADK agent, receives structured responses, logs the conversation, and returns results.

**Trigger:** HTTP Webhook (POST /webhook/agent-query)

**Input:**
```json
{
  "session_id": "string",
  "user_message": "string",
  "context": { "project_id": "optional", "domain": "optional" }
}
```

**Nodes (in order):**

1. **Webhook Node** — Receives user query
2. **HTTP Request Node** — GET `/api/sessions/{session_id}/history` from FastAPI (retrieve conversation history)
3. **Code Node** — Build context-enriched prompt with history
4. **HTTP Request Node** — POST to FastAPI `/api/agent/invoke` (calls Google ADK Agent)
   - Body: `{ "message": "...", "history": [...], "tools_enabled": ["search", "classify", "recommend"] }`
5. **Wait Node (Polling)** — Poll `/api/agent/status/{task_id}` every 2s (max 30s) until agent completes
6. **IF Node** — Check agent response status
   - Success → Parse and format response
   - Error → Return fallback message
7. **HTTP Request Node** — POST conversation turn to `/api/sessions/{session_id}/history`
8. **Set Node** — Build formatted response with agent answer + tool calls used + sources
9. **Respond to Webhook Node** — Return final response

---

### Workflow 4: Automated Weekly Intelligence Report

**Purpose:** Runs every Monday at 8:00 AM, aggregates all projects and document analyses from the past week, generates an AI-written executive intelligence report, and emails it to a configured distribution list.

**Trigger:** Cron Node — `0 8 * * 1` (Every Monday at 8 AM)

**Nodes (in order):**

1. **Cron Node** — Weekly trigger
2. **HTTP Request Node** — GET `/api/projects?since=7days` — fetch all new projects from past week
3. **HTTP Request Node** — GET `/api/documents?since=7days` — fetch all document analyses from past week
4. **Code Node** — Aggregate and format data into structured context for AI
5. **OpenAI / Gemini Node (Report Generation)** — System: "You are an enterprise intelligence analyst. Given the week's project intake and document analysis data, write a comprehensive Weekly Intelligence Report with: Executive Summary, Project Volume & Category Breakdown, Key Themes This Week, Risk Alerts, Top Recommended Actions, and KPI Summary Table. Use professional markdown formatting with headers and bullet points."
6. **Code Node** — Convert markdown report to HTML email template with company branding
7. **Gmail/SMTP Node** — Send HTML report to distribution list (configurable in env vars)
8. **HTTP Request Node** — POST report to `/api/reports` for archival
9. **Slack Node** — Post summary snippet to #ai-reports channel

---

## Google ADK Agent — Full Specification

### Agent Definition (`backend/agent/adk_agent.py`)

Build a Google ADK multi-tool agent using the `google-adk` Python package with the following configuration:

**Agent Name:** `enterprise_intelligence_agent`

**Model:** `gemini-1.5-pro` (or `gemini-2.0-flash` for lower latency)

**System Instruction:**
```
You are EWIS Agent, an enterprise intelligence assistant for a global IT services firm.
Your role is to help classify projects, analyze requirements, recommend solutions,
estimate effort, and answer technical questions about digital transformation,
AI automation, and software delivery.

Always respond in structured JSON when called programmatically. When in conversation mode,
be concise, professional, and technically precise. You have access to tools for
classification, knowledge lookup, and scoring.
```

**Tools to implement:**

1. **`classify_project(description: str) -> dict`**
   - Classifies a project description into category, complexity, tech stack
   - Returns structured classification JSON

2. **`estimate_effort(category: str, complexity: int, team_size: int) -> dict`**
   - Returns effort estimate: timeline_weeks, cost_range, risk_level

3. **`recommend_tech_stack(requirements: str, constraints: str) -> dict`**
   - Returns recommended technologies and architecture pattern

4. **`search_knowledge_base(query: str) -> list`**
   - Searches internal PostgreSQL knowledge base for similar past projects
   - Returns list of relevant project summaries

5. **`analyze_risk(project_description: str, timeline_weeks: int) -> dict`**
   - Assesses risks: delivery_risk, technical_risk, integration_risk
   - Returns risk scores (1-10) and mitigation suggestions

**ADK Runner Configuration:**
- Use `InMemorySessionService` for demo
- Expose via FastAPI endpoint `/api/agent/invoke`
- Support streaming responses via SSE (Server-Sent Events)
- Log all tool calls and responses to PostgreSQL

---

## FastAPI Backend — Key Endpoints

```python
# Projects
POST   /api/projects              # Create new project record
GET    /api/projects              # List projects (supports ?since=7days)
GET    /api/projects/{id}         # Get single project

# Documents
POST   /api/documents             # Store document analysis
GET    /api/documents             # List documents

# Agent
POST   /api/agent/invoke          # Invoke ADK agent, returns task_id
GET    /api/agent/status/{id}     # Poll agent task status
GET    /api/agent/result/{id}     # Get completed agent result

# Sessions (conversation history)
GET    /api/sessions/{id}/history # Get conversation history
POST   /api/sessions/{id}/history # Append conversation turn

# Reports
POST   /api/reports               # Archive generated report
GET    /api/reports               # List reports

# Errors
POST   /api/errors                # Log n8n workflow errors
```

---

## Frontend Dashboard — Key Screens

### Screen 1: Dashboard Overview
- Summary cards: Total Projects This Week, Active Workflows, Agent Queries Today, Reports Generated
- Real-time workflow status feed (last 10 runs, each showing: name, status, timestamp, duration)
- Bar chart: Project categories breakdown (using Recharts or Chart.js)

### Screen 2: Live Intake Form
- Form with fields: Client Name, Project Title, Description, Priority (dropdown), Email
- Submit button POSTs to n8n Workflow 1 webhook
- Shows real-time response: AI classification results, routing decision, estimated timeline
- Displays the structured AI output in a clean card

### Screen 3: Document Analyzer
- Drag-and-drop file upload (accept: .pdf, .txt, .docx)
- Converts to base64, POSTs to n8n Workflow 2 webhook
- Displays structured analysis: key entities, topics, action items, risks, executive summary
- Markdown-rendered output

### Screen 4: Agent Chat Interface
- Clean chat UI (similar to ChatGPT)
- User types question → POST to n8n Workflow 3
- Displays agent response with tool call indicators (e.g., "🔧 Used: classify_project, estimate_effort")
- Shows session_id for conversation continuity

### Screen 5: Reports Archive
- Table of all generated weekly reports
- Click to view full HTML-rendered report
- Download as PDF button

---

## Database Schema (PostgreSQL)

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  description TEXT,
  priority TEXT,
  requester_email TEXT,
  category TEXT,
  complexity_score INTEGER,
  estimated_days INTEGER,
  recommended_team_size INTEGER,
  key_technologies JSONB,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  extracted_entities JSONB,
  main_topics JSONB,
  action_items JSONB,
  risks JSONB,
  tech_mentions JSONB,
  executive_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent sessions table
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' or 'agent'
  message TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_markdown TEXT,
  report_html TEXT,
  week_start DATE,
  project_count INTEGER,
  doc_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs table
CREATE TABLE workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT,
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Docker Compose Configuration

Create a `docker-compose.yml` that starts:
- `postgres` — PostgreSQL 15 on port 5432
- `n8n` — n8n latest on port 5678, connected to postgres, with all env vars set
- `backend` — FastAPI app on port 8000, auto-reload for dev
- `frontend` — React dev server on port 3000

Include a `.env.example` with all required variables:
```
POSTGRES_DB=ewis
POSTGRES_USER=ewis_user
POSTGRES_PASSWORD=changeme
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_gemini_key
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SLACK_WEBHOOK_URL=your_slack_webhook
REPORT_EMAIL_LIST=email1@example.com,email2@example.com
```

---

## n8n Workflow JSON Files

Generate all 4 workflow JSON files in the `n8n-workflows/` directory. Each JSON file must be a valid n8n workflow export that can be imported directly via n8n's `Settings → Import` feature. Include all node configurations, connections, credentials references (using placeholder credential IDs), error workflows, and metadata. The JSON should be ready to import with only credential IDs needing to be updated.

---

## README.md

Write a detailed README with:
1. Project overview and architecture diagram (ASCII)
2. Prerequisites (Node.js, Python 3.11+, Docker)
3. Quick start (5-step setup using Docker Compose)
4. How to import n8n workflows
5. How to configure Google ADK agent
6. How to run the demo (step-by-step walkthrough matching demo.md)
7. API reference for all FastAPI endpoints
8. Environment variables reference

---

## Quality Requirements

- All n8n workflows must have proper error handling (try/catch, fallback nodes)
- All API endpoints must have input validation (Pydantic models)
- Frontend must be responsive and work at 1280px+
- The intake form demo must complete end-to-end in under 10 seconds
- All AI prompts must be configurable via environment variables
- Include at least 3 seed/fixture records in PostgreSQL for demo purposes
- Agent must handle at least 5 sample queries without errors

---

## Deliverables Checklist

- [ ] `docker-compose.yml` — full local stack
- [ ] `backend/` — FastAPI app with ADK agent
- [ ] `frontend/` — React dashboard (all 5 screens)
- [ ] `n8n-workflows/workflow-1-intake-router.json`
- [ ] `n8n-workflows/workflow-2-document-analyzer.json`
- [ ] `n8n-workflows/workflow-3-ai-support-agent.json`
- [ ] `n8n-workflows/workflow-4-report-generator.json`
- [ ] `README.md` — full setup guide
- [ ] `.env.example` — all required variables
- [ ] Database seed script with sample data
