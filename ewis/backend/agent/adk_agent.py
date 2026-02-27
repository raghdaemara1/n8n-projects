"""
EWIS Google ADK Agent — enterprise_intelligence_agent
"""
import os
import uuid
import json
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime

import google.generativeai as genai

from agent.tools import (
    classify_project,
    estimate_effort,
    recommend_tech_stack,
    search_knowledge_base,
    analyze_risk,
)
from agent.prompts import SYSTEM_INSTRUCTION

# ─── Configure Gemini ─────────────────────────────────────────────────────────
_api_key = os.getenv("GOOGLE_API_KEY", "")
if _api_key:
    genai.configure(api_key=_api_key)

# ─── In-Memory Session Store ──────────────────────────────────────────────────
_sessions: Dict[str, List[Dict]] = {}

# ─── Task Store (for async polling) ──────────────────────────────────────────
_tasks: Dict[str, Dict] = {}


class EWISAgent:
    """
    Enterprise Intelligence Agent powered by Gemini + custom tools.
    Supports multi-turn conversation, tool use, and async task execution.
    """

    TOOLS = [
        classify_project,
        estimate_effort,
        recommend_tech_stack,
        search_knowledge_base,
        analyze_risk,
    ]

    def __init__(self):
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
        self._build_model()

    def _build_model(self):
        if not _api_key:
            self._model = None
            return

        # Build Gemini model with function calling
        self._model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=SYSTEM_INSTRUCTION,
            tools=self.TOOLS,
        )

    def get_or_create_session(self, session_id: str) -> List:
        if session_id not in _sessions:
            _sessions[session_id] = []
        return _sessions[session_id]

    async def invoke_async(
        self,
        session_id: str,
        user_message: str,
        tools_enabled: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Invoke the agent asynchronously. Returns a task_id for polling.
        """
        task_id = str(uuid.uuid4())
        _tasks[task_id] = {"status": "running", "result": None, "error": None, "started_at": datetime.utcnow().isoformat()}

        # Run in background
        asyncio.create_task(self._run_agent(task_id, session_id, user_message, tools_enabled))

        return {"task_id": task_id, "status": "running"}

    async def _run_agent(self, task_id: str, session_id: str, user_message: str, tools_enabled: Optional[List[str]]):
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None, self._invoke_sync, session_id, user_message, tools_enabled
            )
            _tasks[task_id]["status"] = "completed"
            _tasks[task_id]["result"] = result
        except Exception as e:
            _tasks[task_id]["status"] = "failed"
            _tasks[task_id]["error"] = str(e)

    def _invoke_sync(self, session_id: str, user_message: str, tools_enabled: Optional[List[str]]) -> Dict:
        history = self.get_or_create_session(session_id)

        if not self._model:
            # Mock agent response
            return self._mock_response(user_message, history)

        # Build chat
        chat = self._model.start_chat(history=history)

        # Agentic loop
        tool_calls_made = []
        response = chat.send_message(user_message)

        # Process function calls
        while response.candidates[0].content.parts:
            parts = response.candidates[0].content.parts
            has_func_call = any(hasattr(p, "function_call") and p.function_call.name for p in parts)

            if not has_func_call:
                break

            function_responses = []
            for part in parts:
                if hasattr(part, "function_call") and part.function_call.name:
                    fc = part.function_call
                    fn_name = fc.name
                    fn_args = dict(fc.args)

                    # Execute the tool
                    tool_fn = next((t for t in self.TOOLS if t.__name__ == fn_name), None)
                    if tool_fn:
                        tool_result = tool_fn(**fn_args)
                        tool_calls_made.append({"tool": fn_name, "args": fn_args, "result": tool_result})
                        function_responses.append(
                            genai.protos.Part(
                                function_response=genai.protos.FunctionResponse(
                                    name=fn_name,
                                    response={"result": json.dumps(tool_result)},
                                )
                            )
                        )

            if function_responses:
                response = chat.send_message(function_responses)
            else:
                break

        # Extract final text
        final_text = ""
        for part in response.candidates[0].content.parts:
            if hasattr(part, "text"):
                final_text += part.text

        # Update session history
        _sessions[session_id] = [
            {"role": m["role"], "parts": m["parts"]} for m in chat.history
        ]

        return {
            "answer": final_text,
            "tool_calls": tool_calls_made,
            "session_id": session_id,
            "model": self.model_name,
        }

    def _mock_response(self, user_message: str, history: list) -> Dict:
        """Provides realistic mock responses when no API key is set."""
        msg_lower = user_message.lower()
        tool_calls = []

        if "cloud migration" in msg_lower or "sap" in msg_lower or "azure" in msg_lower:
            tool_calls = [
                {"tool": "classify_project", "args": {"description": user_message}, "result": {"category": "cloud_migration", "complexity_score": 8}},
                {"tool": "estimate_effort", "args": {"category": "cloud_migration", "complexity": 8, "team_size": 6}, "result": {"timeline_weeks": 28, "cost_range": "$400k-$750k", "risk_level": "high"}},
                {"tool": "recommend_tech_stack", "args": {"requirements": user_message, "constraints": "enterprise, on-premise to cloud"}, "result": {"primary_technologies": ["SAP S/4HANA", "Azure", "n8n", "Azure DevOps"]}},
            ]
            answer = """**Cloud Migration Assessment — SAP on Azure**

**Classification:** Cloud Migration | Complexity: 8/10

**Effort Estimate:**
- Timeline: 24–28 weeks
- Team Size: 6–8 (2 SAP consultants, 2 cloud engineers, 1 architect, 1 PM)
- Cost Range: $400k–$750k

**Recommended Architecture:**
- SAP S/4HANA on Azure (HANA Large Instances or Azure VMs)
- Azure Data Factory for data migration pipelines
- n8n for post-migration workflow automation
- Azure DevOps for CI/CD

**Top Risks:**
- Data migration complexity (legacy ERP data quality)
- Business continuity during cutover
- User adoption and change management

🔧 *Tools used: classify_project, estimate_effort, recommend_tech_stack*"""

        elif "risk" in msg_lower:
            tool_calls = [{"tool": "analyze_risk", "args": {"project_description": user_message, "timeline_weeks": 24}, "result": {"delivery_risk": 7, "technical_risk": 6, "integration_risk": 8}}]
            answer = """**Risk Analysis Report**

| Risk Dimension | Score | Level |
|---|---|---|
| Delivery Risk | 7/10 | High |
| Technical Risk | 6/10 | Medium-High |
| Integration Risk | 8/10 | High |

**Top 3 Mitigation Strategies:**
1. Conduct a 2-week discovery spike to validate all integration touchpoints before committing to timeline
2. Implement blue-green deployment strategy to ensure zero-downtime cutover
3. Establish weekly executive checkpoints with clear go/no-go criteria at each milestone

🔧 *Tools used: analyze_risk*"""
        else:
            tool_calls = [{"tool": "classify_project", "args": {"description": user_message}, "result": {"category": "ai_automation", "complexity_score": 7}}]
            answer = f"""**EWIS Agent Response**

I've analysed your query: *"{user_message[:80]}..."*

Based on my assessment:
- **Category:** AI Automation
- **Complexity:** 7/10 (High)
- **Recommended Approach:** Phased delivery starting with a 4-week proof-of-concept

For a detailed estimate, I'd recommend providing more specifics on:
- Current technology stack
- Number of end users
- Integration requirements
- Compliance/regulatory constraints

🔧 *Tools used: classify_project*"""

        return {
            "answer": answer,
            "tool_calls": tool_calls,
            "session_id": "mock-session",
            "model": "gemini-1.5-pro (mock)",
        }

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        return _tasks.get(task_id)

    def get_task_result(self, task_id: str) -> Optional[Dict]:
        task = _tasks.get(task_id)
        if task and task["status"] == "completed":
            return task["result"]
        return None


# Singleton instance
agent = EWISAgent()
