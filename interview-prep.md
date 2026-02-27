# Interview Prep — Senior AI Engineer (n8n) at FPT Software

---

## My Honest Recommendation: Should You Build It Yourself?

**Short answer: Build parts of it yourself. Use Antigravity/AI for the scaffolding.**

Here's the reality of a Senior AI Engineer interview at a company like FPT:

They will almost certainly ask you to **explain your demo in depth** — every node, every design decision, every trade-off. If you didn't build it, you won't be able to answer. Technical interviewers at this level are very good at spotting when someone is presenting work they don't understand.

**What I recommend:**

1. Use Antigravity to generate the initial boilerplate (FastAPI, React shell, Docker Compose)
2. Import the n8n workflow JSONs as a starting point
3. **Personally build and modify at least one full workflow yourself** — ideally the Intake Router or Agent Relay
4. Run the whole system locally and break things on purpose so you understand the failure modes
5. Be able to explain every node in every workflow, every API design decision, and every AI prompt

If you only present the demo without building any of it, and they ask "walk me through how the Switch node routing works" or "why did you use a polling pattern instead of a callback?" — you'll get stuck. That will be a red flag.

The good news: once Antigravity generates it, spending 2-3 evenings running through the workflows, modifying them, and breaking/fixing them will give you the depth you need.

---

## Round 1: Technical Screening (30–45 min)

These questions are typical in an initial technical screen for a Senior AI/n8n role.

---

### n8n Core Knowledge

**Q1: What is the difference between a Webhook node and an HTTP Request node in n8n?**

> Webhook node is a trigger — it creates an endpoint that listens for incoming requests and starts the workflow when called. HTTP Request node is an action — it makes outbound requests to external APIs mid-workflow. They're fundamentally opposite directions of HTTP.

**Q2: How do you handle errors in n8n workflows?**

> n8n has two main mechanisms: Error Workflow (a separate workflow that runs when the main one fails, configured globally or per-workflow) and Try/Catch nodes at the individual node level. For production, I always configure an Error Workflow that logs the failed execution payload to a database and sends an alert. I also add IF nodes after critical external calls to check response status codes before proceeding.

**Q3: How do you pass data between nodes in n8n?**

> n8n uses a JSON item array as the data bus between nodes. Each node receives the output items from the previous node and outputs its own items. You reference data using expression syntax: `{{ $json.fieldName }}` or `{{ $node["NodeName"].json.field }}` for data from non-adjacent nodes. The Set node is used to restructure, rename, or clean up data between steps.

**Q4: What is the difference between Execute Once and Process All Items modes in n8n?**

> In normal mode, a node processes each input item individually, running once per item. Execute Once means the node runs a single time regardless of how many items are in the input — useful for operations like sending a single summary email or making one API call that doesn't depend on individual item data.

**Q5: How do you handle pagination in n8n when an API returns paginated results?**

> Using a Loop pattern: make the initial API call, check if there's a next_page token or cursor in the response, use an IF node to check, and if true, feed back into the HTTP Request node with the updated page parameter using a Set node. Alternatively, some HTTP Request nodes have built-in pagination support via the "Pagination" setting. I always cap loops with a max_iterations counter to prevent infinite loops.

**Q6: How do you manage credentials securely in n8n?**

> Credentials are stored encrypted in n8n's internal database (AES-256). They're referenced by name in nodes, never hardcoded. For team environments, n8n Cloud or self-hosted with proper environment variable management (never commit credentials to git). For highly sensitive credentials, I'd use n8n's external secrets feature with HashiCorp Vault or AWS Secrets Manager.

**Q7: How would you test an n8n workflow before deploying to production?**

> Several approaches: 1) Use the built-in test mode to run with sample data; 2) Create a separate staging workflow that uses test credentials and sandbox API environments; 3) Use the "Pin Data" feature to freeze test payloads for consistent testing; 4) Build a test harness that fires webhook calls with known payloads and validates outputs; 5) For scheduled workflows, use the manual trigger to test without waiting for the schedule.

---

### AI Integration in n8n

**Q8: How do you integrate an OpenAI or Gemini model into an n8n workflow?**

> Two approaches: 1) Use n8n's built-in AI nodes (OpenAI node, LangChain AI Agent node) which handle auth and basic prompting; 2) Use HTTP Request nodes to call the APIs directly, which gives more control over advanced parameters. For production, I prefer the HTTP Request approach because it works with any LLM API, is easier to version, and lets you implement custom retry logic. I always structure prompts to return strict JSON when the output will be used programmatically.

**Q9: What's the difference between n8n's "AI Agent" node and a regular LLM call?**

> A regular LLM node is one-shot: you send a prompt, get a response, workflow continues. The AI Agent node implements a reasoning loop — the model can call tools, observe results, reason about them, and call more tools until it decides it has an answer. It's essentially LangChain's ReAct pattern baked into n8n. For simple classification or summarization, use the basic LLM node. For tasks requiring multi-step reasoning or external data lookup, use the Agent node.

**Q10: How do you handle context/conversation memory in n8n AI workflows?**

> n8n's AI nodes support several memory backends: In-Memory Buffer (resets each run — not good for multi-session), PostgreSQL Chat History, Redis, and others. For production multi-user scenarios, I use a database-backed memory with a session_id key so each user's conversation is isolated. For very long conversations, I implement sliding window memory with a token budget to avoid exceeding context limits.

---

### System Design

**Q11: How would you design an n8n system to process 10,000 webhook events per day?**

> Several things: 1) Enable queue mode in n8n with multiple worker processes; 2) Use a message queue (Redis or a dedicated queue) as a buffer instead of direct webhook-to-processing; 3) Ensure all expensive operations (DB writes, API calls) are non-blocking where possible; 4) Implement rate limiting on API integrations to avoid getting throttled; 5) Set up horizontal scaling for the n8n workers behind a load balancer; 6) Monitor queue depth and add workers if it grows.

**Q12: A workflow runs every minute and sometimes takes 90 seconds. What happens and how do you handle it?**

> In n8n's default mode, new executions queue up. If you're using the queue mode with a single worker, the backlog grows. Solutions: 1) Increase parallelism if tasks are independent; 2) Add a lock mechanism (e.g., check a Redis key at the start of the workflow, skip if locked) to prevent overlapping runs; 3) Optimize the slow operations that cause 90-second runs; 4) Switch to event-driven triggering instead of polling if possible.

---

## Round 2: Deep Technical Interview (60–90 min)

These are architecture and design questions for senior-level validation.

---

### Architecture

**Q13: Design an n8n-based system for processing customer support tickets with AI triage.**

> Ideal answer structure:
> 1. **Intake** — Webhook or email trigger (using IMAP node) to receive tickets
> 2. **Classification** — AI node classifies: severity, category, department, language, sentiment
> 3. **Routing** — Switch node routes based on classification (billing → billing queue, tech → tech queue, etc.)
> 4. **Enrichment** — HTTP Request to CRM to pull customer history before routing
> 5. **Auto-resolution** — IF complexity_score < 3 → AI generates response → auto-send reply → close ticket
> 6. **Human handoff** — IF complexity_score >= 3 → create ticket in Jira/Zendesk with AI-generated context brief
> 7. **Escalation** — If ticket SLA is breached (checked by separate cron workflow), auto-escalate
> 8. **Reporting** — Daily summary workflow aggregates stats and emails management

**Q14: How would you implement a multi-tenant n8n setup for multiple enterprise clients?**

> Options: 1) n8n's built-in project/team separation for logical isolation; 2) Separate n8n instances per client for full isolation (more ops overhead but better security boundary); 3) Use workflow tags and separate credential sets per client in a shared instance with careful access control. For FPT's model (managing automations for multiple Fortune 500 clients), I'd recommend separate n8n projects per client within a shared managed instance, with client-specific credential namespacing and execution log isolation.

---

### Google ADK Specific

**Q15: What is Google ADK and how does it differ from LangChain?**

> Google ADK (Agent Development Kit) is Google's Python framework for building production AI agents that run on Gemini. Key differences from LangChain: 1) ADK is opinionated and Google-first — native Gemini integration, designed for Google Cloud deployment; 2) ADK has first-class multi-agent support — you can define hierarchies of agents (orchestrator + sub-agents) natively; 3) ADK has a built-in evaluation framework; 4) LangChain is model-agnostic and has a vastly larger ecosystem; 5) ADK is newer and more production-focused, less experimental than LangChain's abstractions. For Google-stack enterprises, ADK is the better choice.

**Q16: How do you define a tool in Google ADK?**

> Tools in ADK are Python functions decorated with type annotations — the framework uses the function signature and docstring to generate the tool schema for the model. Example:
> ```python
> def classify_project(description: str, industry: str) -> dict:
>     """Classifies a project description into category, complexity, and tech stack."""
>     # implementation
>     return {"category": "...", "complexity": 8, "tech_stack": [...]}
> ```
> You pass these functions to the agent's `tools` list. ADK automatically handles function calling, result parsing, and feeding results back to the model's reasoning loop.

---

## Round 3: Behavioral / Culture Fit (30–45 min)

FPT Software is a delivery-focused company. Their behavioral questions will probe speed, client management, and ability to work under pressure.

---

**Q17: Tell me about the most complex automation system you've built.**

> Prepare a STAR story. Ideal structure: large enterprise client, multi-system integration (3+ systems), AI component, a specific challenge you overcame (bad data quality, API rate limits, etc.), and measurable outcome (time saved, error rate reduced, etc.). Use the EWIS demo as a concrete example if you actually built it.

**Q18: Describe a time an automation workflow failed in production. How did you handle it?**

> Key elements: you caught it before the client did (or quickly after), you had logging in place to diagnose it, you had a rollback plan, you communicated proactively, and you implemented a fix that prevented recurrence. Shows operational maturity.

**Q19: How do you approach a new automation project where the requirements are vague?**

> Discovery phase: interview stakeholders to map the current manual process step-by-step, identify the pain points, define clear success criteria upfront, prototype the highest-risk component first (usually the AI piece or the messiest API), get early feedback before building the full pipeline. Avoid building a complex workflow based on assumptions.

**Q20: Why do you want to work at FPT Software specifically?**

> Honest answer using research: FPT's AI-first pivot (FleziPT, AgentVista), the scale of their enterprise client portfolio (Fortune 500 exposure), and their stated goal of deploying automation and AI at industrial scale. If you genuinely want to learn Google ADK, mention the NVIDIA/Google partnership. Tailor to your actual motivations.

---

## Practical/Take-Home Assessment (Most Likely Scenario)

Based on the role description, FPT will almost certainly give you a take-home or live coding task. Most common formats:

**Option A (Most likely): Build a specific n8n workflow**
- "Build a workflow that does X" — could be anything from email processing to API integration to AI triage
- Expected: clean workflow, error handling, documented design decisions, working demo
- Time: 2–4 hours for a take-home

**Option B: Design review**
- "Here is an existing workflow. What's wrong with it? How would you improve it?"
- They share a workflow with obvious issues: no error handling, hardcoded credentials, inefficient loops
- Expected: identify all issues, suggest architectural improvements

**Option C: Live build**
- Build a workflow in 30 minutes during the interview (Zoom + screen share)
- Expected: you move fast, talk through your decisions, and produce something working

**Preparation for all three:**
- Practice building 3–4 different workflow types cold (email processing, webhook→AI→database, scheduled report)
- Know your n8n keyboard shortcuts and the location of every common node
- Have a mental template for "production-grade workflow" (trigger → validate → process → error handle → notify → log)

---

## Your Strengths to Lead With

Given you're a Senior AI Engineer interviewing at an AI-first company:

1. **Lead with systems thinking** — not "I built a workflow" but "I designed a system that handles X at Y scale with Z reliability"
2. **Emphasize AI prompt engineering** — structured outputs, few-shot examples, error recovery — this separates seniors from juniors
3. **Show awareness of production concerns** — error handling, monitoring, credentials management, scalability
4. **Google ADK knowledge** — it's new, most n8n engineers don't know it, it signals you're ahead of the curve
5. **Client-delivery mindset** — FPT lives and dies by client delivery; frame everything in terms of value delivered to clients

---

## Red Flags to Avoid

- Saying "I've mostly done demos, not production workflows" — even if true, don't lead with it
- Not being able to explain an individual n8n node in detail
- Presenting the demo without being able to defend every design choice
- Saying "I'm not sure about the Google ADK, I just read about it" — either know it or don't mention it
- Focusing on the UI demo without understanding the underlying workflow logic
