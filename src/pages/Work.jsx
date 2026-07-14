import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUSES = [
  { id: 'applied', label: 'Applied', color: '#666' },
  { id: 'interview', label: 'Interview', color: 'var(--xp)' },
  { id: 'offer', label: 'Offer', color: 'var(--fit)' },
  { id: 'rejected', label: 'Rejected', color: 'var(--danger)' },
]

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function AppForm({ data, setData, onSave, onCancel, title }) {
  return (
    <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginBottom: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>{title}</div>
      <input placeholder="Company" value={data.company} onChange={e => setData(p => ({ ...p, company: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <input placeholder="Role" value={data.role} onChange={e => setData(p => ({ ...p, role: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
      <select value={data.status} onChange={e => setData(p => ({ ...p, status: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <input placeholder="Notes (optional)" value={data.notes} onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
        style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
      <div style={{ display: 'flex', gap: '7px' }}>
        <button onClick={onSave} style={{ flex: 1, background: 'var(--work)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
        <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function Work() {
  const [view, setView] = useState('day')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editApp, setEditApp] = useState(null)
  const [newApp, setNewApp] = useState({ company: '', role: '', status: 'applied', notes: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    setApplications(data || [])
    setLoading(false)
  }

  async function addApplication() {
    if (!newApp.company.trim() || !newApp.role.trim()) return
    const { data } = await supabase.from('applications').insert({ ...newApp, date: today() }).select().single()
    if (data) setApplications([data, ...applications])
    setNewApp({ company: '', role: '', status: 'applied', notes: '' })
    setShowAdd(false)
    await supabase.from('xp_log').insert({ amount: 40, reason: 'Job application sent', date: today() })
  }

  async function saveApplication() {
    if (!editApp) return
    await supabase.from('applications').update({
      company: editApp.company, role: editApp.role,
      status: editApp.status, notes: editApp.notes
    }).eq('id', editApp.id)
    setApplications(prev => prev.map(a => a.id === editApp.id ? { ...a, ...editApp } : a))
    setEditApp(null)
  }

  async function updateStatus(id, status) {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApplications(applications.map(a => a.id === id ? { ...a, status } : a))
  }

  async function deleteApp(id) {
    await supabase.from('applications').delete().eq('id', id)
    setApplications(applications.filter(a => a.id !== id))
  }

  function statusColor(status) {
    return STATUSES.find(s => s.id === status)?.color || '#666'
  }

  const thisMonth = today().slice(0, 7)
  const monthApps = applications.filter(a => a.date?.startsWith(thisMonth))
  const interviews = applications.filter(a => a.status === 'interview')
  const offers = applications.filter(a => a.status === 'offer')
  const views = ['day', 'week', 'month', 'ytd']


  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--work)' }}>Work</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Job search · Pipeline · Networking</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {views.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surf3)' : 'none', border: '0.5px solid var(--border)',
              borderColor: view === v ? 'var(--surf3)' : 'var(--border)', borderRadius: '5px',
              color: view === v ? 'var(--text)' : 'var(--muted)', padding: '4px 7px', fontSize: '10px', cursor: 'pointer'
            }}>{v.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {view === 'day' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'Total apps', value: applications.length, color: 'var(--work)' },
              { label: 'Interviews', value: interviews.length, color: 'var(--xp)' },
              { label: 'Offers', value: offers.length, color: 'var(--fit)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Pipeline</div>

          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && applications.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>No applications yet</div>
          )}

          {applications.map(app => (
            <div key={app.id}>
              {editApp?.id === app.id ? (
                <AppForm data={editApp} setData={setEditApp} onSave={saveApplication} onCancel={() => setEditApp(null)} title="Edit application" />
              ) : (
                <div style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor(app.status), marginTop: '5px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{app.company} · {app.role}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{app.date}{app.notes ? ` · ${app.notes}` : ''}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {STATUSES.map(s => (
                        <button key={s.id} onClick={() => updateStatus(app.id, s.id)} style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer',
                          border: '0.5px solid var(--border)',
                          background: app.status === s.id ? s.color : 'var(--surf3)',
                          color: app.status === s.id ? '#000' : 'var(--muted)',
                          fontWeight: app.status === s.id ? 500 : 400
                        }}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setEditApp({ ...app })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                  <button onClick={() => deleteApp(app.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              )}
            </div>
          ))}

          {showAdd ? (
            <AppForm data={newApp} setData={setNewApp} onSave={addApplication} onCancel={() => setShowAdd(false)} title="New application" />
          ) : (
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
              + Add application
            </button>
          )}
        </>
      )}

      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Apps this week', value: applications.filter(a => { const d = new Date(a.date); const w = new Date(); w.setDate(w.getDate()-7); return d >= w }).length, color: 'var(--work)' },
            { label: 'Interviews', value: interviews.length, color: 'var(--xp)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Apps this month', value: monthApps.length, color: 'var(--work)' },
            { label: 'Interviews', value: monthApps.filter(a => a.status === 'interview').length, color: 'var(--xp)' },
            { label: 'Offers', value: monthApps.filter(a => a.status === 'offer').length, color: 'var(--fit)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'ytd' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Total apps', value: applications.length, color: 'var(--work)' },
            { label: 'Interviews', value: interviews.length, color: 'var(--xp)' },
            { label: 'Offers', value: offers.length, color: 'var(--fit)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}