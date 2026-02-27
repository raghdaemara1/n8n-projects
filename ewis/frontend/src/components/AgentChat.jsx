import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const N8N_AGENT_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_AGENT || 'http://localhost:5678/webhook/agent-query'

const SESSION_ID = `session-${Date.now()}`

const WELCOME_MSG = {
    id: 'welcome',
    role: 'agent',
    content: `**Welcome to EWIS Agent** — powered by Google ADK + Gemini 1.5 Pro

I'm your enterprise intelligence assistant. I can help you:
- 🔍 **Classify projects** and assess complexity
- 📊 **Estimate effort**, timeline, and cost ranges  
- 🏗️ **Recommend tech stacks** for your requirements
- ⚠️ **Analyze risks** across delivery, technical, and integration dimensions
- 🗂️ **Search knowledge base** for similar past project patterns

*Try asking:* "Estimate effort for a cloud migration project for a 500-person manufacturing company moving from on-premise ERP to SAP on Azure."`,
    tool_calls: [],
    timestamp: new Date().toISOString(),
}

const SAMPLE_QUERIES = [
    'Estimate effort for cloud migration from on-premise ERP to SAP on Azure for a 500-person manufacturing company',
    'What are the top 3 risks for an AI-powered customer service platform with Salesforce integration?',
    'Recommend a tech stack for a real-time IoT analytics platform processing 5,000 sensor events per second',
]

export default function AgentChat() {
    const [messages, setMessages] = useState([WELCOME_MSG])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sessionId] = useState(SESSION_ID)
    const messagesEnd = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text) => {
        const userMessage = text || input.trim()
        if (!userMessage || loading) return

        setInput('')
        const userMsg = { id: Date.now(), role: 'user', content: userMessage, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        try {
            // Try n8n webhook first, fall back to direct API
            let result = null
            try {
                const res = await fetch(N8N_AGENT_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, user_message: userMessage, context: {} }),
                    signal: AbortSignal.timeout(5000),
                })
                const data = await res.json()
                if (data?.answer || data?.response) {
                    result = { answer: data.answer || data.response, tool_calls: data.tool_calls || [] }
                }
            } catch { }

            if (!result) {
                // Direct agent API call
                const invokeRes = await fetch(`${API}/api/agent/invoke`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, message: userMessage }),
                })
                const { task_id } = await invokeRes.json()

                // Poll for result
                let attempts = 0
                while (attempts < 20) {
                    await new Promise(r => setTimeout(r, 1500))
                    const statusRes = await fetch(`${API}/api/agent/result/${task_id}`)
                    const statusData = await statusRes.json()
                    if (statusData.status === 'completed') {
                        result = statusData.result
                        break
                    }
                    if (statusData.status === 'failed') break
                    attempts++
                }
            }

            const agentMsg = {
                id: Date.now() + 1,
                role: 'agent',
                content: result?.answer || 'I encountered an issue processing your request. Please try again.',
                tool_calls: result?.tool_calls || [],
                timestamp: new Date().toISOString(),
            }
            setMessages(prev => [...prev, agentMsg])

            // Save to history
            try {
                await fetch(`${API}/api/sessions/${sessionId}/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'user', message: userMessage }),
                })
                await fetch(`${API}/api/sessions/${sessionId}/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: 'agent', message: result?.answer || '', tool_calls: result?.tool_calls }),
                })
            } catch { }

        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: '⚠️ Could not reach the agent. Ensure the FastAPI backend is running at `localhost:8000` with a valid `GOOGLE_API_KEY`.',
                tool_calls: [],
                timestamp: new Date().toISOString(),
            }])
        } finally {
            setLoading(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    const handleKeyDown = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    }

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1>◎ &nbsp;Agent Chat</h1>
                        <p>Google ADK multi-tool agent — Gemini 1.5 Pro with tool-use and conversation memory</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Session ID</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-light)', background: 'rgba(108,99,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {sessionId}
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>
                    {/* Chat Panel */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="chat-messages" id="chat-messages" style={{ minHeight: '480px', maxHeight: '520px' }}>
                            {messages.map(msg => (
                                <div key={msg.id} className={`chat-bubble ${msg.role}`} id={`msg-${msg.id}`}>
                                    <div className={`chat-avatar ${msg.role}`}>
                                        {msg.role === 'user' ? '👤' : '◎'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="chat-content">
                                            <div className="prose" style={{ fontSize: '0.875rem' }}>
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                        {msg.tool_calls?.length > 0 && (
                                            <div className="chat-tool-chips">
                                                {msg.tool_calls.map((tc, i) => (
                                                    <span key={i} className="chat-tool-chip">🔧 {tc.tool}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', paddingLeft: '0.25rem' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="chat-bubble agent">
                                    <div className="chat-avatar agent">◎</div>
                                    <div className="chat-content" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className="spinner" style={{ width: '16px', height: '16px' }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Agent is reasoning with tools...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEnd} />
                        </div>

                        <div className="chat-input-bar">
                            <textarea
                                ref={inputRef}
                                id="chat-input"
                                className="chat-input"
                                placeholder="Ask the agent about projects, effort estimation, tech stacks, or risks..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                rows={1}
                            />
                            <button
                                id="btn-send-chat"
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 1.25rem', flexShrink: 0 }}
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                            >
                                ↑
                            </button>
                        </div>
                    </div>

                    {/* Sidebar: Sample Queries & Agent Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: '0.875rem', fontSize: '0.85rem' }}>Sample Queries</div>
                            {SAMPLE_QUERIES.map((q, i) => (
                                <button
                                    key={i}
                                    id={`sample-query-${i}`}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.75rem', padding: '0.625rem 0.875rem', whiteSpace: 'normal', lineHeight: 1.5 }}
                                    onClick={() => sendMessage(q)}
                                    disabled={loading}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        <div className="card">
                            <div className="section-title" style={{ marginBottom: '0.875rem', fontSize: '0.85rem' }}>⚙ Agent Tools</div>
                            {[
                                { tool: 'classify_project', desc: 'Category, complexity, tech stack' },
                                { tool: 'estimate_effort', desc: 'Timeline, cost, risk level' },
                                { tool: 'recommend_tech_stack', desc: 'Architecture + tech choices' },
                                { tool: 'search_knowledge_base', desc: 'Similar past projects' },
                                { tool: 'analyze_risk', desc: 'Delivery + technical + integration risk' },
                            ].map(t => (
                                <div key={t.tool} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-2)', marginBottom: '0.15rem' }}>{t.tool}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className="card" style={{ background: 'rgba(108,99,255,0.06)', borderColor: 'rgba(108,99,255,0.2)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--accent-light)' }}>Architecture Pattern</strong><br />
                                n8n Workflow 3 relays queries → FastAPI → ADK agent loop → Gemini tool calls → response
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
