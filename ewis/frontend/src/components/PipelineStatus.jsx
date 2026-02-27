import React from 'react'

export default function PipelineStatus({ workflows = [] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {workflows.map((wf, i) => (
                <div key={i} id={`pipeline-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wf.status === 'active' ? 'var(--accent-2)' : wf.status === 'error' ? 'var(--accent-3)' : 'var(--accent-4)', boxShadow: `0 0 6px ${wf.status === 'active' ? 'var(--accent-2)' : 'var(--accent-4)'}` }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{wf.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wf.last_run} · {wf.duration}</div>
                    </div>
                    <span className={`badge badge-${wf.status === 'active' ? 'active' : 'running'}`}>{wf.status}</span>
                </div>
            ))}
        </div>
    )
}
