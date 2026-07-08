import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '🤩']
const ENERGY_EMOJIS = ['', '😴', '😕', '😐', '⚡', '🔥']

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('log')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('daily_journal')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)
    setEntries(data || [])
    setLoading(false)
  }

  async function deleteEntry(id) {
    await supabase.from('daily_journal').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const avgMood = entries.filter(e => e.mood).reduce((s, e) => s + e.mood, 0) / (entries.filter(e => e.mood).length || 1)
  const avgEnergy = entries.filter(e => e.energy).reduce((s, e) => s + e.energy, 0) / (entries.filter(e => e.energy).length || 1)

  const chartData = [...entries].reverse().slice(-14).map(e => ({
    date: e.date?.slice(5),
    mood: e.mood || null,
    energy: e.energy || null
  }))

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: '#A78BFA' }}>Journal</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Mood · Energy · Gratitude · Wins</div>
        </div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {['log', 'charts'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? 'var(--surf3)' : 'none',
              border: '0.5px solid var(--border)',
              borderColor: view === v ? 'var(--surf3)' : 'var(--border)',
              borderRadius: '5px', color: view === v ? 'var(--text)' : 'var(--muted)',
              padding: '4px 10px', fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize'
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'Entries', value: entries.length, color: '#A78BFA' },
          { label: 'Avg mood', value: avgMood > 0 ? `${MOOD_EMOJIS[Math.round(avgMood)]} ${avgMood.toFixed(1)}` : '—', color: 'var(--social)' },
          { label: 'Avg energy', value: avgEnergy > 0 ? `${ENERGY_EMOJIS[Math.round(avgEnergy)]} ${avgEnergy.toFixed(1)}` : '—', color: 'var(--xp)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* LOG VIEW */}
      {view === 'log' && (
        <>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && entries.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No journal entries yet — complete the evening reflection in Home
            </div>
          )}
          {entries.map(entry => (
            <div key={entry.id} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted2)' }}>{entry.date}</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {entry.mood && <span style={{ fontSize: '16px' }}>{MOOD_EMOJIS[entry.mood]}</span>}
                  {entry.energy && <span style={{ fontSize: '16px' }}>{ENERGY_EMOJIS[entry.energy]}</span>}
                  <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              </div>
              {entry.priority && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>🎯 Priority</div>
                  <div style={{ fontSize: '13px' }}>{entry.priority}</div>
                </div>
              )}
              {entry.gratitude && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>🙏 Grateful for</div>
                  <div style={{ fontSize: '13px' }}>{entry.gratitude}</div>
                </div>
              )}
              {entry.win && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>🏆 Win</div>
                  <div style={{ fontSize: '13px' }}>{entry.win}</div>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* CHARTS VIEW */}
      {view === 'charts' && (
        <>
          {chartData.length > 1 ? (
            <>
              <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>Mood & Energy — last 14 days</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#2c2c2c" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fill: '#666', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1f1f1f', border: '0.5px solid #2c2c2c', borderRadius: '8px', color: '#ededed', fontSize: '12px' }}
                      formatter={(val, name) => [`${val}/5`, name]}
                    />
                    <Line type="monotone" dataKey="mood" stroke="#D46FA0" strokeWidth={2} dot={{ fill: '#D46FA0', r: 3 }} connectNulls name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke="#EF9F27" strokeWidth={2} dot={{ fill: '#EF9F27', r: 3 }} connectNulls name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>Best mood day</div>
                  {(() => {
                    const best = entries.filter(e => e.mood).sort((a, b) => b.mood - a.mood)[0]
                    return best ? (
                      <>
                        <div style={{ fontSize: '22px', marginBottom: '2px' }}>{MOOD_EMOJIS[best.mood]}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{best.date}</div>
                      </>
                    ) : <div style={{ fontSize: '13px', color: 'var(--muted)' }}>—</div>
                  })()}
                </div>
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '6px' }}>Best energy day</div>
                  {(() => {
                    const best = entries.filter(e => e.energy).sort((a, b) => b.energy - a.energy)[0]
                    return best ? (
                      <>
                        <div style={{ fontSize: '22px', marginBottom: '2px' }}>{ENERGY_EMOJIS[best.energy]}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{best.date}</div>
                      </>
                    ) : <div style={{ fontSize: '13px', color: 'var(--muted)' }}>—</div>
                  })()}
                </div>
              </div>

              <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px 14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>Recent wins 🏆</div>
                {entries.filter(e => e.win).slice(0, 5).map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', flexShrink: 0 }}>{e.date?.slice(5)}</div>
                    <div style={{ fontSize: '13px', flex: 1 }}>{e.win}</div>
                  </div>
                ))}
                {entries.filter(e => e.win).length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>No wins logged yet</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Log at least 2 entries to see charts
            </div>
          )}
        </>
      )}
    </div>
  )
}