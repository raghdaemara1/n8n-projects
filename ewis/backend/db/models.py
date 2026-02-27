"""
EWIS Database Models — SQLAlchemy ORM
"""
from sqlalchemy import Column, String, Integer, Text, Date, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_name = Column(Text, nullable=False)
    project_title = Column(Text, nullable=False)
    description = Column(Text)
    priority = Column(String(20))
    requester_email = Column(Text)
    category = Column(Text)
    complexity_score = Column(Integer)
    estimated_days = Column(Integer)
    recommended_team_size = Column(Integer)
    key_technologies = Column(JSONB)
    ai_summary = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(Text)
    extracted_entities = Column(JSONB)
    main_topics = Column(JSONB)
    action_items = Column(JSONB)
    risks = Column(JSONB)
    tech_mentions = Column(JSONB)
    executive_summary = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(Text, nullable=False, index=True)
    role = Column(String(10), nullable=False)  # 'user' or 'agent'
    message = Column(Text, nullable=False)
    tool_calls = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_markdown = Column(Text)
    report_html = Column(Text)
    week_start = Column(Date)
    project_count = Column(Integer)
    doc_count = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class WorkflowError(Base):
    __tablename__ = "workflow_errors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_name = Column(Text)
    error_message = Column(Text)
    payload = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
