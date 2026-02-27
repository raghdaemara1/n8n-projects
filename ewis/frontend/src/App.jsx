import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import IntakeForm from './components/IntakeForm'
import DocumentAnalyzer from './components/DocumentAnalyzer'
import AgentChat from './components/AgentChat'
import ReportsArchive from './components/ReportsArchive'

const NAV_ITEMS = [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/intake', icon: '⤵', label: 'Intake Form' },
    { to: '/documents', icon: '◈', label: 'Document Analyzer' },
    { to: '/agent', icon: '◎', label: 'Agent Chat' },
    { to: '/reports', icon: '▦', label: 'Reports Archive' },
]

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">⬡</div>
                <div>
                    <div className="sidebar-logo-text">EWIS</div>
                    <span className="sidebar-logo-sub">Enterprise AI Platform</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-section-label">Navigation</span>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        id={`nav-${item.to.slice(1)}`}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span className="nav-link-icon">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}

                <span className="sidebar-section-label" style={{ marginTop: '1rem' }}>System</span>
                <a
                    href="http://localhost:5678"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    id="nav-n8n"
                >
                    <span className="nav-link-icon">⟳</span>
                    n8n Workflows
                </a>
                <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    id="nav-api-docs"
                >
                    <span className="nav-link-icon">⟪</span>
                    API Docs
                </a>
            </nav>

            <div className="sidebar-footer">
                <div className="ewis-badge">
                    <div className="status-dot" />
                    <span>All systems operational</span>
                </div>
            </div>
        </aside>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/intake" element={<IntakeForm />} />
                        <Route path="/documents" element={<DocumentAnalyzer />} />
                        <Route path="/agent" element={<AgentChat />} />
                        <Route path="/reports" element={<ReportsArchive />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}
