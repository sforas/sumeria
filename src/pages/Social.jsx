import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const INTERACTION_TYPES = ['Networking', 'Friend', 'LinkedIn', 'Coffee', 'Call', 'Event', 'Other']
const RELATIONSHIP_TYPES = ['Friend', 'Family', 'Colleague', 'Networking', 'Mentor', 'Other']

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function daysSince(date) {
  if (!date) return null
  const diff = new Date() - new Date(date)
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysUntil(date) {
  if (!date) return null
  const diff = new Date(date) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Social() {
  const [view, setView] = useState('day')
  const [tab, setTab] = useState('log')
  const [interactions, setInteractions] = useState([])
  const [contacts, setContacts] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddReminder, setShowAddReminder] = useState(null)
  const [newInteraction, setNewInteraction] = useState({ person: '', type: 'Networking', notes: '' })
  const [newContact, setNewContact] = useState({ name: '', relationship: 'Friend', remind_every_days: 7, notes: '' })
  const [newReminder, setNewReminder] = useState({ title: '', remind_on: '', notes: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: i }, { data: c }, { data: r }] = await Promise.all([
      supabase.from('interactions').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').order('name'),
      supabase.from('reminders').select('*').order('remind_on', { ascending: true })
    ])
    setInteractions(i || [])
    setContacts(c || [])
    setReminders(r || [])
    setLoading(false)
  }

  async function addInteraction() {
    if (!newInteraction.person.trim()) return
    const { data } = await supabase.from('interactions').insert({
      ...newInteraction,
      date: today()
    }).select().single()
    if (data) setInteractions(prev => [data, ...prev])

    // Update last_contacted if person matches a contact
    const contact = contacts.find(c => c.name.toLowerCase() === newInteraction.person.toLowerCase())
    if (contact) {
      await supabase.from('contacts').update({ last_contacted: today() }).eq('id', contact.id)
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, last_contacted: today() } : c))
    }

    setNewInteraction({ person: '', type: 'Networking', notes: '' })
    setShowAddInteraction(false)
    await supabase.from('xp_log').insert({ amount: 40, reason: 'Social interaction logged', date: today() })
  }

  async function deleteInteraction(id) {
    await supabase.from('interactions').delete().eq('id', id)
    setInteractions(prev => prev.filter(i => i.id !== id))
  }

  async function addContact() {
    if (!newContact.name.trim()) return
    const { data } = await supabase.from('contacts').insert({
      ...newContact,
      remind_every_days: parseInt(newContact.remind_every_days) || 7
    }).select().single()
    if (data) setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewContact({ name: '', relationship: 'Friend', remind_every_days: 7, notes: '' })
    setShowAddContact(false)
  }

  async function deleteContact(id) {
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  async function markContacted(contact) {
    await supabase.from('contacts').update({ last_contacted: today() }).eq('id', contact.id)
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, last_contacted: today() } : c))
    // Also log an interaction
    const { data } = await supabase.from('interactions').insert({
      person: contact.name,
      type: contact.relationship,
      notes: '',
      date: today()
    }).select().single()
    if (data) setInteractions(prev => [data, ...prev])
    await supabase.from('xp_log').insert({ amount: 40, reason: 'Social interaction logged', date: today() })
  }

  async function addReminder(contactId) {
    if (!newReminder.title.trim() || !newReminder.remind_on) return
    const { data } = await supabase.from('reminders').insert({
      contact_id: contactId,
      title: newReminder.title,
      remind_on: newReminder.remind_on,
      notes: newReminder.notes,
      done: false
    }).select().single()
    if (data) setReminders(prev => [...prev, data].sort((a, b) => a.remind_on?.localeCompare(b.remind_on)))
    setNewReminder({ title: '', remind_on: '', notes: '' })
    setShowAddReminder(null)
  }

  async function toggleReminder(id, done) {
    await supabase.from('reminders').update({ done: !done }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !done } : r))
  }

  async function deleteReminder(id) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const thisWeek = interactions.filter(i => {
    const d = new Date(i.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })

  const thisMonth = interactions.filter(i => i.date?.startsWith(today().slice(0, 7)))

  // Contacts that need attention
  const needsAttention = contacts.filter(c => {
    if (!c.remind_every_days) return false
    const days = daysSince(c.last_contacted)
    return days === null || days >= c.remind_every_days
  })

  // Upcoming reminders
  const upcomingReminders = reminders.filter(r => !r.done && daysUntil(r.remind_on) >= 0)
  const overdueReminders = reminders.filter(r => !r.done && daysUntil(r.remind_on) < 0)

  const views = ['day', 'week', 'month', 'ytd']

  function typeEmoji(type) {
    const map = { Networking: '🤝', Friend: '👥', LinkedIn: '💼', Coffee: '☕', Call: '📞', Event: '🎉', Other: '💬', Family: '❤️', Mentor: '🎓', Colleague: '💼' }
    return map[type] || '💬'
  }

  function urgencyColor(days, target) {
    if (days === null) return 'var(--social)'
    const ratio = days / target
    if (ratio >= 1.5) return 'var(--danger)'
    if (ratio >= 1) return 'var(--xp)'
    return 'var(--fit)'
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

      {view === 'day' && (
        <>
          {/* Sub tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {[
              { id: 'log', label: 'Activity log' },
              { id: 'contacts', label: `Contacts ${needsAttention.length > 0 ? `(${needsAttention.length} due)` : ''}` },
              { id: 'reminders', label: `Reminders ${upcomingReminders.length > 0 ? `(${upcomingReminders.length})` : ''}` },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '7px 4px', borderRadius: '7px', fontSize: '11px',
                cursor: 'pointer', border: '0.5px solid var(--border)',
                background: tab === t.id ? 'var(--social)' : 'var(--surf)',
                color: tab === t.id ? '#fff' : 'var(--muted)',
                fontWeight: tab === t.id ? 500 : 400
              }}>{t.label}</button>
            ))}
          </div>

          {/* ACTIVITY LOG TAB */}
          {tab === 'log' && (
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
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
                  No interactions logged yet
                </div>
              )}

              {interactions.slice(0, 10).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px', alignItems: 'center' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#140a10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                    {typeEmoji(item.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{item.person}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                      {item.type} · {item.date}{item.notes ? ` · ${item.notes}` : ''}
                    </div>
                  </div>
                  <button onClick={() => deleteInteraction(item.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>×</button>
                </div>
              ))}

              {showAddInteraction ? (
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginTop: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Log interaction</div>
                  <input autoFocus placeholder="Person's name" value={newInteraction.person}
                    onChange={e => setNewInteraction(prev => ({ ...prev, person: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
                  <select value={newInteraction.type} onChange={e => setNewInteraction(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                    {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Notes (optional)" value={newInteraction.notes}
                    onChange={e => setNewInteraction(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={addInteraction} style={{ flex: 1, background: 'var(--social)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                    <button onClick={() => setShowAddInteraction(false)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddInteraction(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                  + Log interaction
                </button>
              )}
            </>
          )}

          {/* CONTACTS TAB */}
          {tab === 'contacts' && (
            <>
              {needsAttention.length > 0 && (
                <>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                    Needs attention
                  </div>
                  {needsAttention.map(contact => {
                    const days = daysSince(contact.last_contacted)
                    return (
                      <div key={contact.id} style={{ background: 'var(--surf)', border: '0.5px solid #3d1a16', borderRadius: '10px', padding: '12px 13px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surf3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            {typeEmoji(contact.relationship)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{contact.name}</div>
                            <div style={{ fontSize: '11px', color: urgencyColor(days, contact.remind_every_days) }}>
                              {days === null ? 'Never contacted' : `Last contact: ${days} days ago`} · every {contact.remind_every_days}d
                            </div>
                          </div>
                          <button onClick={() => markContacted(contact)} style={{ background: 'var(--social)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
                </>
              )}

              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                All contacts
              </div>

              {contacts.length === 0 && (
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
                  No contacts yet
                </div>
              )}

              {contacts.map(contact => {
                const days = daysSince(contact.last_contacted)
                return (
                  <div key={contact.id} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 13px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surf3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                        {typeEmoji(contact.relationship)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{contact.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                          {contact.relationship} · {days === null ? 'Never contacted' : `${days}d ago`} · every {contact.remind_every_days}d
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        <button onClick={() => setShowAddReminder(contact.id)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--muted)', fontSize: '11px', padding: '5px 8px', cursor: 'pointer' }}>
                          + Reminder
                        </button>
                        <button onClick={() => markContacted(contact)} style={{ background: 'var(--social)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '5px 8px', cursor: 'pointer' }}>
                          ✓
                        </button>
                        <button onClick={() => deleteContact(contact.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                      </div>
                    </div>

                    {/* Reminders for this contact */}
                    {reminders.filter(r => r.contact_id === contact.id && !r.done).map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '7px 10px', background: 'var(--surf3)', borderRadius: '7px' }}>
                        <span style={{ fontSize: '11px', flex: 1, color: daysUntil(r.remind_on) <= 0 ? 'var(--danger)' : daysUntil(r.remind_on) <= 2 ? 'var(--xp)' : 'var(--muted2)' }}>
                          🔔 {r.title} · {daysUntil(r.remind_on) === 0 ? 'Today' : daysUntil(r.remind_on) < 0 ? `${Math.abs(daysUntil(r.remind_on))}d overdue` : `in ${daysUntil(r.remind_on)}d`}
                        </span>
                        <button onClick={() => toggleReminder(r.id, r.done)} style={{ background: 'var(--fit)', border: 'none', borderRadius: '5px', color: '#000', fontSize: '10px', padding: '3px 7px', cursor: 'pointer' }}>Done</button>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>×</button>
                      </div>
                    ))}

                    {/* Add reminder form */}
                    {showAddReminder === contact.id && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surf3)', borderRadius: '8px' }}>
                        <input placeholder="Reminder (e.g. Diego's interview)" value={newReminder.title}
                          onChange={e => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                          style={{ width: '100%', background: 'var(--surf2)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '12px', padding: '8px 10px', outline: 'none', marginBottom: '7px' }} />
                        <div style={{ display: 'flex', gap: '7px' }}>
                          <input type="date" value={newReminder.remind_on}
                            onChange={e => setNewReminder(prev => ({ ...prev, remind_on: e.target.value }))}
                            style={{ flex: 1, background: 'var(--surf2)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '12px', padding: '8px 10px', outline: 'none' }} />
                          <button onClick={() => addReminder(contact.id)} style={{ background: 'var(--social)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', padding: '8px 12px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                          <button onClick={() => setShowAddReminder(null)} style={{ background: 'var(--surf2)', border: '0.5px solid var(--border)', borderRadius: '6px', color: 'var(--muted)', fontSize: '12px', padding: '8px 10px', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {showAddContact ? (
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginTop: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Add contact</div>
                  <input autoFocus placeholder="Name" value={newContact.name}
                    onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
                  <select value={newContact.relationship} onChange={e => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }}>
                    {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Remind me to contact every</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[3, 7, 14, 30].map(d => (
                        <button key={d} onClick={() => setNewContact(prev => ({ ...prev, remind_every_days: d }))}
                          style={{ flex: 1, padding: '7px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid var(--border)', background: newContact.remind_every_days === d ? 'var(--social)' : 'var(--surf3)', color: newContact.remind_every_days === d ? '#fff' : 'var(--muted)', fontWeight: newContact.remind_every_days === d ? 500 : 400 }}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <input placeholder="Notes (optional)" value={newContact.notes}
                    onChange={e => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button onClick={addContact} style={{ flex: 1, background: 'var(--social)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                    <button onClick={() => setShowAddContact(false)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddContact(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                  + Add contact
                </button>
              )}
            </>
          )}

          {/* REMINDERS TAB */}
          {tab === 'reminders' && (
            <>
              {overdueReminders.length > 0 && (
                <>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                    Overdue
                  </div>
                  {overdueReminders.map(r => {
                    const contact = contacts.find(c => c.id === r.contact_id)
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid #3d1a16', borderRadius: '8px', marginBottom: '6px' }}>
                        <div style={{ fontSize: '18px' }}>🔔</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{r.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--danger)' }}>
                            {contact?.name} · {Math.abs(daysUntil(r.remind_on))}d overdue
                          </div>
                        </div>
                        <button onClick={() => toggleReminder(r.id, r.done)} style={{ background: 'var(--fit)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}>Done</button>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                      </div>
                    )
                  })}
                  <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
                </>
              )}

              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
                Upcoming
              </div>

              {upcomingReminders.length === 0 && (
                <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  No upcoming reminders
                </div>
              )}

              {upcomingReminders.map(r => {
                const contact = contacts.find(c => c.id === r.contact_id)
                const days = daysUntil(r.remind_on)
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '18px' }}>🔔</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: days === 0 ? 'var(--xp)' : days <= 2 ? 'var(--xp)' : 'var(--muted2)' }}>
                        {contact?.name} · {days === 0 ? 'Today!' : `in ${days} day${days !== 1 ? 's' : ''}`} · {r.remind_on}
                      </div>
                    </div>
                    <button onClick={() => toggleReminder(r.id, r.done)} style={{ background: 'var(--fit)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '11px', padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}>Done</button>
                    <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                )
              })}

              {reminders.filter(r => r.done).length > 0 && (
                <>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>
                    Completed
                  </div>
                  {reminders.filter(r => r.done).slice(0, 5).map(r => {
                    const contact = contacts.find(c => c.id === r.contact_id)
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '5px', opacity: 0.5 }}>
                        <div style={{ fontSize: '16px' }}>✅</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--muted)' }}>{r.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{contact?.name}</div>
                        </div>
                        <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>×</button>
                      </div>
                    )
                  })}
                </>
              )}
            </>
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
            { label: 'Contacts', value: contacts.length, color: 'var(--text)' },
            { label: 'Reminders done', value: reminders.filter(r => r.done).length, color: 'var(--fit)' },
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