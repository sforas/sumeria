import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const INTERACTION_TYPES = ['Networking', 'Friend', 'LinkedIn', 'Coffee', 'Call', 'Event', 'Other']

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Social() {
  const [view, setView] = useState('day')
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ person: '', type: 'Networking', notes: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('interactions')
      .select('*')
      .order('created_at', { ascending: false })
    setInteractions(data || [])
    setLoading(false)
  }

  async function addInteraction() {
    if (!newItem.person.trim()) return
    const { data } = await supabase.from('interactions').insert({
      ...newItem,
      date: today()
    }).select().single()
    if (data) setInteractions([data, ...interactions])
    setNewItem({ person: '', type: 'Networking', notes: '' })
    setShowAdd(false)
    await supabase.from('xp_log').insert({ amount: 40, reason: 'Social interaction logged', date: today() })
  }

  async function deleteInteraction(id) {
    await supabase.from('interactions').delete().eq('id', id)
    setInteractions(interactions.filter(i => i.id !== id))
  }

  const thisWeek = interactions.filter(i => {
    const d = new Date(i.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })

  const thisMonth = interactions.filter(i => i.date?.startsWith(today().slice(0, 7)))
  const views = ['day', 'week', 'month', 'ytd']

  function typeEmoji(type) {
    const map = { Networking: '🤝', Friend: '👥', LinkedIn: '💼', Coffee: '☕', Call: '📞', Event: '🎉', Other: '💬' }
    return map[type] || '💬'
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--social)' }}>Social</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Relationships · Networking · Connections</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {views.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surf3)' : 'none',
              border: '0.5px solid var(--border)',
              borderColor: view === v ? 'var(--surf3)' : 'var(--border)',
              borderRadius: '5px', color: view === v ? 'var(--text)' : 'var(--muted)',
              padding: '4px 7px', fontSize: '10px', cursor: 'pointer'
            }}>{v.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* DAY VIEW */}
      {view === 'day' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'This week', value: thisWeek.length, color: 'var(--social)' },
              { label: 'This month', value: thisMonth.length, color: 'var(--text)' },
              { label: 'Total', value: interactions.length, color: 'var(--text)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Recent interactions
          </div>

          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && interactions.length === 0 && (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px', marginBottom: '8px'
            }}>No interactions logged yet</div>
          )}

          {interactions.slice(0, 10).map(item => (
            <div key={item.id} style={{
              display: 'flex', gap: '10px', padding: '10px 12px',
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '8px', marginBottom: '6px', alignItems: 'center'
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: '#140a10', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, fontSize: '14px'
              }}>{typeEmoji(item.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{item.person}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                  {item.type} · {item.date}{item.notes ? ` · ${item.notes}` : ''}
                </div>
              </div>
              <button onClick={() => deleteInteraction(item.id)} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', fontSize: '16px', padding: '4px'
              }}>×</button>
            </div>
          ))}

          {showAdd ? (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '13px', marginTop: '6px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Log interaction</div>
              <input
                autoFocus
                placeholder="Person's name"
                value={newItem.person}
                onChange={e => setNewItem({ ...newItem, person: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              >
                {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                placeholder="Notes (optional)"
                value={newItem.notes}
                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addInteraction} style={{
                  flex: 1, background: 'var(--social)', border: 'none', borderRadius: '7px',
                  color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500
                }}>Save</button>
                <button onClick={() => setShowAdd(false)} style={{
                  background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--muted)', fontSize: '13px',
                  padding: '9px 14px', cursor: 'pointer'
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              width: '100%', padding: '9px', background: 'none',
              border: '0.5px dashed var(--border)', borderRadius: '8px',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px'
            }}>+ Log interaction</button>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Interactions', value: thisWeek.length, color: 'var(--social)' },
            { label: 'Networking', value: thisWeek.filter(i => i.type === 'Networking' || i.type === 'LinkedIn').length, color: 'var(--work)' },
            { label: 'Friends', value: thisWeek.filter(i => i.type === 'Friend' || i.type === 'Coffee').length, color: 'var(--fit)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Total', value: thisMonth.length, color: 'var(--social)' },
            { label: 'Networking', value: thisMonth.filter(i => i.type === 'Networking' || i.type === 'LinkedIn').length, color: 'var(--work)' },
            { label: 'Friends', value: thisMonth.filter(i => i.type === 'Friend' || i.type === 'Coffee').length, color: 'var(--fit)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* YTD VIEW */}
      {view === 'ytd' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Total interactions', value: interactions.length, color: 'var(--social)' },
            { label: 'Unique people', value: [...new Set(interactions.map(i => i.person))].length, color: 'var(--text)' },
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