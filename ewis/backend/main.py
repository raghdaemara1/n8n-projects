"""
EWIS FastAPI Backend — All API Endpoints
"""
import os
import json
import uuid
import asyncio
import base64
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any

import markdown
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session

from db.database import get_db, init_db
from db.models import Project, Document, AgentSession, Report, WorkflowError
from agent.adk_agent import agent

# ─── App Init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EWIS — Enterprise Workflow Intelligence System",
    description="AI-powered enterprise automation backend with Google ADK agent",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    client_name: str
    project_title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    requester_email: Optional[str] = None
    category: Optional[str] = None
    complexity_score: Optional[int] = None
    estimated_days: Optional[int] = None
    recommended_team_size: Optional[int] = None
    key_technologies: Optional[List[str]] = None
    ai_summary: Optional[str] = None


class DocumentCreate(BaseModel):
    filename: Optional[str] = None
    extracted_entities: Optional[Dict] = None
    main_topics: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    risks: Optional[List[str]] = None
    tech_mentions: Optional[List[str]] = None
    executive_summary: Optional[str] = None


class AgentInvokeRequest(BaseModel):
    session_id: str
    message: str
    history: Optional[List[Dict]] = []
    tools_enabled: Optional[List[str]] = None


class SessionHistoryCreate(BaseModel):
    role: str  # 'user' or 'agent'
    message: str
    tool_calls: Optional[List[Dict]] = None


class ReportCreate(BaseModel):
    report_markdown: Optional[str] = None
    report_html: Optional[str] = None
    week_start: Optional[date] = None
    project_count: Optional[int] = 0
    doc_count: Optional[int] = 0


class ErrorCreate(BaseModel):
    workflow_name: Optional[str] = None
    error_message: Optional[str] = None
    payload: Optional[Dict] = None


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "ewis-backend", "timestamp": datetime.utcnow().isoformat()}


# ─── Projects ─────────────────────────────────────────────────────────────────

@app.post("/api/projects", tags=["projects"])
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        client_name=data.client_name,
        project_title=data.project_title,
        description=data.description,
        priority=data.priority,
        requester_email=data.requester_email,
        category=data.category,
        complexity_score=data.complexity_score,
        estimated_days=data.estimated_days,
        recommended_team_size=data.recommended_team_size,
        key_technologies=data.key_technologies,
        ai_summary=data.ai_summary,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": str(project.id), "created_at": project.created_at.isoformat()}


@app.get("/api/projects", tags=["projects"])
def list_projects(since: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Project)
    if since == "7days":
        cutoff = datetime.utcnow() - timedelta(days=7)
        q = q.filter(Project.created_at >= cutoff)
    projects = q.order_by(Project.created_at.desc()).all()
    return [
        {
            "id": str(p.id),
            "client_name": p.client_name,
            "project_title": p.project_title,
            "description": p.description,
            "priority": p.priority,
            "category": p.category,
            "complexity_score": p.complexity_score,
            "estimated_days": p.estimated_days,
            "recommended_team_size": p.recommended_team_size,
            "key_technologies": p.key_technologies,
            "ai_summary": p.ai_summary,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@app.get("/api/projects/{project_id}", tags=["projects"])
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == uuid.UUID(project_id)).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": str(project.id),
        "client_name": project.client_name,
        "project_title": project.project_title,
        "description": project.description,
        "priority": project.priority,
        "category": project.category,
        "complexity_score": project.complexity_score,
        "estimated_days": project.estimated_days,
        "recommended_team_size": project.recommended_team_size,
        "key_technologies": project.key_technologies,
        "ai_summary": project.ai_summary,
        "created_at": project.created_at.isoformat() if project.created_at else None,
    }


# ─── Documents ────────────────────────────────────────────────────────────────

@app.post("/api/documents", tags=["documents"])
def create_document(data: DocumentCreate, db: Session = Depends(get_db)):
    doc = Document(
        filename=data.filename,
        extracted_entities=data.extracted_entities,
        main_topics=data.main_topics,
        action_items=data.action_items,
        risks=data.risks,
        tech_mentions=data.tech_mentions,
        executive_summary=data.executive_summary,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": str(doc.id), "created_at": doc.created_at.isoformat()}


@app.get("/api/documents", tags=["documents"])
def list_documents(since: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Document)
    if since == "7days":
        cutoff = datetime.utcnow() - timedelta(days=7)
        q = q.filter(Document.created_at >= cutoff)
    docs = q.order_by(Document.created_at.desc()).all()
    return [
        {
            "id": str(d.id),
            "filename": d.filename,
            "main_topics": d.main_topics,
            "executive_summary": d.executive_summary,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


# ─── Agent ────────────────────────────────────────────────────────────────────

@app.post("/api/agent/invoke", tags=["agent"])
async def invoke_agent(req: AgentInvokeRequest):
    """Invoke the ADK agent. Returns a task_id for polling."""
    result = await agent.invoke_async(
        session_id=req.session_id,
        user_message=req.message,
        tools_enabled=req.tools_enabled,
    )
    return result


@app.get("/api/agent/status/{task_id}", tags=["agent"])
def agent_task_status(task_id: str):
    task = agent.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, "status": task["status"], "started_at": task.get("started_at")}


@app.get("/api/agent/result/{task_id}", tags=["agent"])
def agent_task_result(task_id: str):
    task = agent.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["status"] == "running":
        return {"status": "running", "message": "Agent is still processing"}
    if task["status"] == "failed":
        return {"status": "failed", "error": task.get("error")}
    return {"status": "completed", "result": task.get("result")}


# ─── Sessions (conversation history) ─────────────────────────────────────────

@app.get("/api/sessions/{session_id}/history", tags=["sessions"])
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(AgentSession)
        .filter(AgentSession.session_id == session_id)
        .order_by(AgentSession.created_at)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "message": m.message,
            "tool_calls": m.tool_calls,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@app.post("/api/sessions/{session_id}/history", tags=["sessions"])
def append_session_history(session_id: str, data: SessionHistoryCreate, db: Session = Depends(get_db)):
    entry = AgentSession(
        session_id=session_id,
        role=data.role,
        message=data.message,
        tool_calls=data.tool_calls,
    )
    db.add(entry)
    db.commit()
    return {"id": str(entry.id), "status": "saved"}


# ─── Reports ──────────────────────────────────────────────────────────────────

@app.post("/api/reports", tags=["reports"])
def create_report(data: ReportCreate, db: Session = Depends(get_db)):
    html = data.report_html
    if not html and data.report_markdown:
        html = markdown.markdown(data.report_markdown, extensions=["tables", "fenced_code"])
        html = f"""
        <html><head><style>
        body {{ font-family: Inter, sans-serif; max-width: 900px; margin: 2rem auto; padding: 1rem; color: #1a1a2e; }}
        h1,h2,h3 {{ color: #6c63ff; }} table {{ border-collapse: collapse; width: 100%; }}
        th,td {{ border: 1px solid #ddd; padding: 8px; }} th {{ background: #6c63ff; color: white; }}
        </style></head><body>{html}</body></html>"""

    report = Report(
        report_markdown=data.report_markdown,
        report_html=html,
        week_start=data.week_start or date.today(),
        project_count=data.project_count,
        doc_count=data.doc_count,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": str(report.id), "created_at": report.created_at.isoformat()}


@app.get("/api/reports", tags=["reports"])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        {
            "id": str(r.id),
            "week_start": r.week_start.isoformat() if r.week_start else None,
            "project_count": r.project_count,
            "doc_count": r.doc_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "report_markdown": r.report_markdown,
            "report_html": r.report_html,
        }
        for r in reports
    ]


# ─── Error Logging ────────────────────────────────────────────────────────────

@app.post("/api/errors", tags=["system"])
def log_error(data: ErrorCreate, db: Session = Depends(get_db)):
    err = WorkflowError(
        workflow_name=data.workflow_name,
        error_message=data.error_message,
        payload=data.payload,
    )
    db.add(err)
    db.commit()
    return {"id": str(err.id), "logged": True}


# ─── Stats (for Dashboard) ────────────────────────────────────────────────────

@app.get("/api/stats", tags=["system"])
def get_stats(db: Session = Depends(get_db)):
    cutoff_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff_week = datetime.utcnow() - timedelta(days=7)

    total_projects_week = db.query(Project).filter(Project.created_at >= cutoff_week).count()
    agent_queries_today = db.query(AgentSession).filter(
        AgentSession.created_at >= cutoff_day,
        AgentSession.role == "user"
    ).count()
    reports_generated = db.query(Report).count()

    # Category breakdown
    from sqlalchemy import func
    category_data = db.query(Project.category, func.count(Project.id)).group_by(Project.category).all()

    return {
        "total_projects_week": total_projects_week,
        "active_workflows": 4,
        "agent_queries_today": agent_queries_today,
        "reports_generated": reports_generated,
        "category_breakdown": [{"category": c or "other", "count": n} for c, n in category_data],
        "recent_workflows": [
            {"name": "Smart Intake Router", "status": "active", "last_run": "2 min ago", "duration": "3.2s"},
            {"name": "Document Analyzer", "status": "active", "last_run": "15 min ago", "duration": "8.1s"},
            {"name": "AI Agent Relay", "status": "active", "last_run": "1 hr ago", "duration": "12.4s"},
            {"name": "Weekly Report Generator", "status": "active", "last_run": "Monday 08:00", "duration": "45.8s"},
        ],
    }
