# EWIS Demo Guide — End-to-End Walkthrough

**Project:** AI Enterprise Workflow Intelligence System
**Demo Duration:** ~10–15 minutes
**Audience:** FPT Software Technical Interview Panel
**Goal:** Demonstrate production-grade n8n pipeline design, Google ADK agent integration, and full-stack AI engineering capability

---

## Pre-Demo Setup Checklist

Before starting the demo, confirm these are all running:

- [ ] `docker-compose up -d` executed, all 4 containers healthy
- [ ] n8n running at `http://localhost:5678` — all 4 workflows imported and active
- [ ] FastAPI backend running at `http://localhost:8000` — `/docs` shows all endpoints
- [ ] React frontend running at `http://localhost:3000` — dashboard loads without errors
- [ ] PostgreSQL has 3 seed records pre-loaded (run `python backend/seed.py`)
- [ ] `.env` file populated with real API keys (OpenAI or Gemini, SMTP)
- [ ] Test intake webhook: `curl -X POST localhost:5678/webhook/intake` returns 200
- [ ] Browser tabs open: React Dashboard, n8n editor, FastAPI /docs

---

## Demo Script

---

### Act 1: System Overview (2 minutes)

**What to say:**

> "This is EWIS — the Enterprise Workflow Intelligence System. It's a full-stack AI automation platform that mirrors the kind of internal tooling an IT services company like FPT would build to manage client project intake, document intelligence, and AI-powered support. Let me walk you through the architecture before we run through the live demo."

**What to show:**

Open the React Dashboard Overview screen. Walk through the 4 summary cards:
- Total Projects: 3 (seed data)
- Active Workflows: 4
- Agent Queries: 0 (fresh session)
- Reports Generated: 0

Point to the workflow status feed — explain that this is live-updated via polling the FastAPI backend.

Briefly open the n8n editor and show all 4 workflows are active (green status). Name each one and its purpose in one sentence each.

---

### Act 2: Smart Intake Router — Live Run (3 minutes)

**What to say:**

> "Let's start with the intake pipeline. This is the core of the system — imagine a client engagement team receives a new project request. Instead of manually triaging it, it hits our webhook, gets AI-classified, routed, stored, and notified — all automatically in under 5 seconds."

**What to do:**

1. Navigate to the **Live Intake Form** screen in the dashboard
2. Fill in the form:
   - Client Name: `Accenture Global`
   - Project Title: `AI-Powered Customer Service Automation`
   - Description: `We need to replace our legacy customer support system with an AI-driven solution that can handle 80% of Tier 1 tickets automatically, integrate with Salesforce, and support 12 languages.`
   - Priority: `High`
   - Email: your email
3. Click Submit
4. Watch the real-time response panel:
   - Show the AI classification result:
     ```
     Category: ai_automation
     Complexity Score: 8/10
     Estimated Days: 90
     Recommended Team Size: 5
     Key Technologies: ["n8n", "OpenAI GPT-4", "Salesforce API", "Multi-lingual NLP", "Vector Database"]
     Summary: AI-powered customer service automation with Salesforce integration...
     ```
   - Show that the workflow routed it to the AI pipeline branch
5. Switch to n8n — open Workflow 1 and show the execution log. Walk through each node: Webhook → Set → AI Classification → Switch → DB Save → Email notification
6. Check PostgreSQL via FastAPI `/api/projects` — show the new record is stored

**Key talking points:**
- "Notice the AI prompt is structured to return strict JSON — that's intentional. In production, you always need deterministic output from LLMs in automation pipelines."
- "The Switch node branches on the category field — this is how you build conditional routing without writing code."
- "Every execution is logged. In production you'd pipe this to Datadog or CloudWatch."

---

### Act 3: Document Intelligence Analyzer (3 minutes)

**What to say:**

> "A lot of what FPT does involves analyzing client-provided technical documents — RFPs, architecture specs, legacy system documentation. This pipeline automatically extracts structured intelligence from any document in seconds."

**What to do:**

1. Navigate to the **Document Analyzer** screen
2. Drag and drop a sample PDF (prepare a 2-page technical spec or use any PDF)
3. Watch the pipeline run — point to the loading state
4. When complete, show the structured output:
   - Key Entities extracted
   - Main Topics identified
   - Action Items detected
   - Risks highlighted
   - Executive Summary in markdown
5. Switch to n8n — show Workflow 2 execution. Highlight:
   - The **Split in Batches** node — "This handles documents of any length by chunking them"
   - The **Merge** node — "This recombines analysis from all chunks"
   - The two AI calls: extraction then synthesis

**Key talking points:**
- "This is a two-pass AI design pattern — first extract raw data per chunk, then synthesize across the full document. Much more accurate than one big prompt."
- "Batch processing with proper merge patterns is critical for production n8n. Without it, large documents either fail or produce garbage."

---

### Act 4: AI Agent (Google ADK) — Live Conversation (3 minutes)

**What to say:**

> "Now for the most technically advanced part — the AI agent layer. This is a Google ADK agent running in Python, exposed via FastAPI, and orchestrated through n8n. The agent has access to five custom tools and maintains conversation context."

**What to do:**

1. Navigate to the **Agent Chat** screen
2. Type: `"I need to estimate the effort for a cloud migration project for a 500-person manufacturing company, moving from on-premise ERP to SAP on Azure. What would you recommend?"`
3. Watch the response — point out:
   - The tool call indicators (e.g., "🔧 Used: classify_project, estimate_effort, recommend_tech_stack")
   - The structured response: timeline, team size, risk level, tech stack
4. Ask a follow-up: `"What are the top 3 risks for this project?"` — show conversation continuity (session_id maintained)
5. Switch to n8n — show Workflow 3 execution: the relay nodes, the polling pattern for async agent calls
6. Show FastAPI `/docs` — demonstrate the `/api/agent/invoke` endpoint live in Swagger

**Key talking points:**
- "Google ADK is Google's official framework for building production multi-agent systems. I chose it because FPT has a strategic partnership with Google/NVIDIA and this shows alignment with their stack."
- "The agent-via-n8n pattern is powerful: n8n handles the orchestration, auth, logging, and retry logic while the ADK handles the AI reasoning. Clean separation of concerns."
- "The polling pattern in Workflow 3 is a real production pattern for async AI calls — you never want to hold a webhook open for 30 seconds waiting for an LLM."

---

### Act 5: Weekly Report Generator (2 minutes)

**What to say:**

> "Finally, the scheduled intelligence report. This runs every Monday morning and generates an executive-level AI-written briefing. Rather than waiting for the Monday trigger, I'll run it manually."

**What to do:**

1. In n8n, open Workflow 4
2. Click "Execute workflow" to run it manually
3. Switch to the **Reports Archive** screen in the dashboard — within 10–15 seconds, a new report appears
4. Click the report — show the full rendered HTML report with sections: Executive Summary, Project Volume, Key Themes, Risk Alerts, Recommended Actions
5. Point out the Slack notification node in n8n — explain it would post a summary to #ai-reports

**Key talking points:**
- "Scheduled reporting is underrated in automation demos. For enterprise clients, automated management reporting is often one of the highest-value deliverables."
- "The HTML email generation from markdown is handled in a Code node — you always want nicely formatted emails in enterprise contexts, not raw text."

---

### Closing (1 minute)

**What to say:**

> "So to summarize: four production-grade n8n pipelines, a Google ADK multi-tool agent, a full-stack React dashboard, and a FastAPI backend with PostgreSQL — all running locally in Docker. The patterns I've used here — chunked AI processing, async polling, conditional routing, structured AI output, conversation memory — are the same patterns I'd bring to any client automation engagement at FPT. Happy to go deeper on any of these."

---

## Anticipated Technical Questions During Demo

**Q: Why use n8n instead of building custom code?**
> "n8n gives you rapid iteration, visual workflow debugging, built-in retry logic, and non-engineer maintainability. For client engagements, the client team often needs to modify workflows post-delivery — n8n enables that without a developer."

**Q: How does the ADK agent differ from a simple LLM API call?**
> "An ADK agent has structured tool use, persistent session state, and multi-turn reasoning. It can call multiple tools in sequence, reason about the results, and decide what to do next. A plain API call is one-shot — the agent is a reasoning loop."

**Q: How would this scale to production?**
> "n8n supports queue-based execution mode with multiple workers. The FastAPI backend would move to Kubernetes with horizontal scaling. PostgreSQL would get connection pooling via PgBouncer. The ADK agent would need a proper session store like Redis for high concurrency."

**Q: What if the AI returns invalid JSON?**
> "The AI nodes have retry logic with a more constrained follow-up prompt if JSON parsing fails. In production I'd also use structured output APIs (OpenAI's `response_format: json_schema` or Gemini's equivalent) to guarantee schema compliance."

**Q: Why Google ADK over LangChain or LlamaIndex?**
> "ADK is Google's production framework, designed for multi-agent coordination and enterprise deployment. It integrates natively with Gemini and Google's infrastructure. For a company with FPT's NVIDIA/Google partnerships, ADK alignment makes sense strategically."

---

## Technical Architecture Diagram (for whiteboard/slide)

```
                          ┌──────────────────────────┐
                          │     React Dashboard       │
                          │   (localhost:3000)        │
                          └─────────┬────────────────┘
                                    │ REST API calls
                          ┌─────────▼────────────────┐
                          │     FastAPI Backend       │
                          │   (localhost:8000)        │
                          └──┬──────────┬─────────────┘
                             │          │
              ┌──────────────▼──┐   ┌───▼──────────────────┐
              │   n8n Workflows  │   │  Google ADK Agent     │
              │  (localhost:5678)│   │  (Python + Gemini)   │
              │                  │   │  Tools:              │
              │ WF1: Intake      │   │  - classify_project  │
              │ WF2: Documents   │   │  - estimate_effort   │
              │ WF3: Agent Relay │──▶│  - recommend_stack   │
              │ WF4: Reports     │   │  - search_kb         │
              └────────┬─────────┘   │  - analyze_risk      │
                       │             └──────────────────────┘
              ┌────────▼──────────┐
              │    PostgreSQL     │
              │   (localhost:5432)│
              └───────────────────┘
```
