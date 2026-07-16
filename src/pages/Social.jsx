import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const RELATIONSHIP_TYPES = ['Friend', 'Family', 'Work', 'Partner', 'Other']

const FREQUENCY_OPTIONS = [
  { value: '3days', label: 'Every 3 days' },
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Every month' },
  { value: 'none', label: 'No reminder' }
]

const FREQUENCY_LABELS = {
  '3days': 'Every 3 days',
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Every month'
}

const EMPTY_CONTACT = { name: '', relationship: 'Friend', phone: '', email: '', birthday: '', contact_frequency: 'none', notes: '' }
const EMPTY_REMINDER = { contact_id: '', title: '', remind_on: '', recurring: 'once' }

const INPUT_STYLE = { width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }
const FIELD_LABEL_STYLE = { fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

function frequencyLabel(freq) {
  return FREQUENCY_LABELS[freq] || null
}

function formatBirthday(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return `Birthday: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function formatReminderDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function nextBirthdayOccurrence(birthday) {
  const [, month, day] = birthday.split('-')
  const thisYear = Number(today().slice(0, 4))
  const candidate = `${thisYear}-${month}-${day}`
  return candidate >= today() ? candidate : `${thisYear + 1}-${month}-${day}`
}

function ContactForm({ data, setData, onSave, onCancel, title }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>{title}</div>
      <input autoFocus placeholder="Name" value={data.name}
        onChange={e => setData(p => ({ ...p, name: e.target.value }))}
        style={INPUT_STYLE} />
      <select value={data.relationship} onChange={e => setData(p => ({ ...p, relationship: e.target.value }))} style={INPUT_STYLE}>
        {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input placeholder="Phone (optional)" value={data.phone}
        onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
        style={INPUT_STYLE} />
      <input placeholder="Email (optional)" type="email" value={data.email}
        onChange={e => setData(p => ({ ...p, email: e.target.value }))}
        style={INPUT_STYLE} />
      <div style={{ marginBottom: '8px' }}>
        <div style={FIELD_LABEL_STYLE}>Birthday (optional)</div>
        <input type="date" value={data.birthday}
          onChange={e => setData(p => ({ ...p, birthday: e.target.value }))}
          style={{ ...INPUT_STYLE, marginBottom: 0 }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={FIELD_LABEL_STYLE}>Contact frequency</div>
        <select value={data.contact_frequency} onChange={e => setData(p => ({ ...p, contact_frequency: e.target.value }))}
          style={{ ...INPUT_STYLE, marginBottom: 0 }}>
          {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <textarea placeholder="Notes (optional)" rows={3} value={data.notes}
        onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
        style={{ ...INPUT_STYLE, resize: 'none', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: '7px' }}>
        <button onClick={onSave} style={{ flex: 1, background: 'var(--social)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
        <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function ReminderForm({ data, setData, contacts, onSave, onCancel, title }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>{title}</div>
      <select value={data.contact_id} onChange={e => setData(p => ({ ...p, contact_id: e.target.value }))} style={INPUT_STYLE}>
        <option value=''>Select contact...</option>
        {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input placeholder="Title" value={data.title}
        onChange={e => setData(p => ({ ...p, title: e.target.value }))}
        style={INPUT_STYLE} />
      <div style={{ marginBottom: '8px' }}>
        <div style={FIELD_LABEL_STYLE}>Date</div>
        <input type="date" value={data.remind_on}
          onChange={e => setData(p => ({ ...p, remind_on: e.target.value }))}
          style={{ ...INPUT_STYLE, marginBottom: 0 }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={FIELD_LABEL_STYLE}>Recurring</div>
        <select value={data.recurring} onChange={e => setData(p => ({ ...p, recurring: e.target.value }))}
          style={{ ...INPUT_STYLE, marginBottom: 0 }}>
          <option value="once">Once</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '7px' }}>
        <button onClick={onSave} style={{ flex: 1, background: 'var(--social)', border: 'none', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
        <button onClick={onCancel} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function Social() {
  const [tab, setTab] = useState('contacts')
  const [contacts, setContacts] = useState([])
  const [contactReminders, setContactReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailContact, setDetailContact] = useState(null)

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactFormData, setContactFormData] = useState(EMPTY_CONTACT)
  const [editingContactId, setEditingContactId] = useState(null)

  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reminderFormData, setReminderFormData] = useState(EMPTY_REMINDER)
  const [editingReminderId, setEditingReminderId] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from('contacts').select('*').order('name'),
      supabase.from('contact_reminders').select('*, contacts(name)').order('remind_on', { ascending: true })
    ])
    setContacts(c || [])
    setContactReminders(r || [])
    setLoading(false)
  }

  async function syncBirthdayReminder(contact) {
    const { data: existing } = await supabase
      .from('contact_reminders')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('recurring', 'yearly')
      .limit(1)

    if (!contact.birthday) {
      if (existing && existing.length > 0) {
        await supabase.from('contact_reminders').delete().eq('id', existing[0].id)
      }
      return
    }

    const remindOn = nextBirthdayOccurrence(contact.birthday)
    const title = `${contact.name}'s birthday`

    if (existing && existing.length > 0) {
      await supabase.from('contact_reminders').update({ title, remind_on: remindOn, done: false }).eq('id', existing[0].id)
    } else {
      await supabase.from('contact_reminders').insert({ contact_id: contact.id, title, remind_on: remindOn, recurring: 'yearly', done: false })
    }
  }

  function openAddContact() {
    setContactFormData(EMPTY_CONTACT)
    setEditingContactId(null)
    setContactModalOpen(true)
  }

  function openEditContact(contact) {
    setContactFormData({
      name: contact.name || '', relationship: contact.relationship || 'Friend',
      phone: contact.phone || '', email: contact.email || '',
      birthday: contact.birthday || '', contact_frequency: contact.contact_frequency || 'none',
      notes: contact.notes || ''
    })
    setEditingContactId(contact.id)
    setContactModalOpen(true)
  }

  async function saveContact() {
    if (!contactFormData.name.trim()) return
    const payload = {
      name: contactFormData.name.trim(),
      relationship: contactFormData.relationship,
      phone: contactFormData.phone || null,
      email: contactFormData.email || null,
      birthday: contactFormData.birthday || null,
      contact_frequency: contactFormData.contact_frequency || 'none',
      notes: contactFormData.notes || ''
    }
    let saved = null
    if (editingContactId) {
      await supabase.from('contacts').update(payload).eq('id', editingContactId)
      saved = { id: editingContactId, ...payload }
    } else {
      const { data } = await supabase.from('contacts').insert(payload).select().single()
      saved = data
    }
    if (saved) await syncBirthdayReminder(saved)
    setContactModalOpen(false)
    await fetchData()
  }

  async function deleteContact(id) {
    await supabase.from('contact_reminders').delete().eq('contact_id', id)
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setContactReminders(prev => prev.filter(r => r.contact_id !== id))
    setDetailContact(null)
  }

  function openAddReminder() {
    setReminderFormData(EMPTY_REMINDER)
    setEditingReminderId(null)
    setReminderModalOpen(true)
  }

  function openEditReminder(reminder) {
    setReminderFormData({
      contact_id: reminder.contact_id || '', title: reminder.title || '',
      remind_on: reminder.remind_on || '', recurring: reminder.recurring || 'once'
    })
    setEditingReminderId(reminder.id)
    setReminderModalOpen(true)
  }

  async function saveReminder() {
    if (!reminderFormData.title.trim() || !reminderFormData.contact_id || !reminderFormData.remind_on) return
    const payload = {
      contact_id: reminderFormData.contact_id,
      title: reminderFormData.title.trim(),
      remind_on: reminderFormData.remind_on,
      recurring: reminderFormData.recurring || 'once'
    }
    if (editingReminderId) {
      await supabase.from('contact_reminders').update(payload).eq('id', editingReminderId)
    } else {
      await supabase.from('contact_reminders').insert({ ...payload, done: false })
    }
    setReminderModalOpen(false)
    await fetchData()
  }

  async function deleteReminder(id) {
    await supabase.from('contact_reminders').delete().eq('id', id)
    setContactReminders(prev => prev.filter(r => r.id !== id))
  }

  async function toggleReminderDone(reminder) {
    await supabase.from('contact_reminders').update({ done: !reminder.done }).eq('id', reminder.id)
    setContactReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, done: !reminder.done } : r))
  }

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const todayStr = today()
  const upcomingReminders = contactReminders.filter(r => !r.done && r.remind_on >= todayStr)
  const pastReminders = contactReminders.filter(r => r.done || r.remind_on < todayStr)
  const detailReminders = detailContact ? contactReminders.filter(r => r.contact_id === detailContact.id) : []

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--social)' }}>Social</div>
        <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Contacts · Reminders</div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[{ id: 'contacts', label: 'Contacts' }, { id: 'reminders', label: 'Reminders' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            border: '0.5px solid var(--border)',
            background: tab === t.id ? 'var(--social)' : 'var(--surf)',
            color: tab === t.id ? '#fff' : 'var(--muted)',
            fontWeight: tab === t.id ? 500 : 400
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'contacts' && (
        <>
          <input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '13px', padding: '10px', outline: 'none', marginBottom: '14px' }} />

          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && filteredContacts.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              {search ? 'No contacts match your search' : 'No contacts yet'}
            </div>
          )}

          {filteredContacts.map(contact => (
            <div key={contact.id} onClick={() => setDetailContact(contact)} style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--social)',
              borderRadius: '0 8px 8px 0', padding: '12px 13px', marginBottom: '8px', cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{contact.name}</div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <div onClick={e => { e.stopPropagation(); openEditContact(contact) }} style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>Edit</div>
                  <div onClick={e => { e.stopPropagation(); deleteContact(contact.id) }} style={{ fontSize: '14px', color: 'var(--muted)', cursor: 'pointer' }}>×</div>
                </div>
              </div>
              <span style={{
                display: 'inline-block', background: 'color-mix(in srgb, var(--social) 20%, transparent)',
                color: 'var(--social)', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginBottom: '4px'
              }}>{contact.relationship}</span>
              {frequencyLabel(contact.contact_frequency) && (
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{frequencyLabel(contact.contact_frequency)}</div>
              )}
              {contact.birthday && (
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatBirthday(contact.birthday)}</div>
              )}
              {contact.notes && (
                <div style={{ fontSize: '11px', color: 'var(--muted2)', fontStyle: 'italic', marginTop: '4px' }}>
                  {contact.notes.slice(0, 60)}{contact.notes.length > 60 ? '…' : ''}
                </div>
              )}
            </div>
          ))}

          <button onClick={openAddContact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
            + Add contact
          </button>
        </>
      )}

      {tab === 'reminders' && (
        <>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Upcoming</div>
          {upcomingReminders.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              No upcoming reminders
            </div>
          )}
          {upcomingReminders.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--social)', borderRadius: '0 8px 8px 0', marginBottom: '6px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{r.contacts?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                  {formatReminderDate(r.remind_on)}{r.recurring === 'yearly' ? ' · Recurring' : ''}
                </div>
              </div>
              <div onClick={() => openEditReminder(r)} style={{ fontSize: '10px', color: 'var(--muted)', cursor: 'pointer' }}>Edit</div>
              <div onClick={() => deleteReminder(r.id)} style={{ fontSize: '14px', color: 'var(--muted)', cursor: 'pointer' }}>×</div>
              <div onClick={() => toggleReminderDone(r)} style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: r.done ? 'none' : '1.5px solid var(--border)',
                background: r.done ? 'var(--social)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff'
              }}>{r.done ? '✓' : ''}</div>
            </div>
          ))}

          <button onClick={openAddReminder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px', marginBottom: '16px' }}>
            + Add reminder
          </button>

          {pastReminders.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Past / Done</div>
              {pastReminders.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderLeft: '2px solid var(--social)', borderRadius: '0 8px 8px 0', marginBottom: '6px', opacity: 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{r.contacts?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                      {formatReminderDate(r.remind_on)}{r.recurring === 'yearly' ? ' · Recurring' : ''}
                    </div>
                  </div>
                  <div onClick={() => deleteReminder(r.id)} style={{ fontSize: '14px', color: 'var(--muted)', cursor: 'pointer' }}>×</div>
                  <div onClick={() => toggleReminderDone(r)} style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    border: r.done ? 'none' : '1.5px solid var(--border)',
                    background: r.done ? 'var(--social)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff'
                  }}>{r.done ? '✓' : ''}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {contactModalOpen && (
        <div onClick={() => setContactModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 36px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <ContactForm data={contactFormData} setData={setContactFormData} onSave={saveContact} onCancel={() => setContactModalOpen(false)}
              title={editingContactId ? 'Edit contact' : 'Add contact'} />
          </div>
        </div>
      )}

      {reminderModalOpen && (
        <div onClick={() => setReminderModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 36px', width: '100%' }}>
            <ReminderForm data={reminderFormData} setData={setReminderFormData} contacts={contacts} onSave={saveReminder} onCancel={() => setReminderModalOpen(false)}
              title={editingReminderId ? 'Edit reminder' : 'Add reminder'} />
          </div>
        </div>
      )}

      {detailContact && (
        <div onClick={() => setDetailContact(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surf)', borderRadius: '14px 14px 0 0', padding: '20px 18px 40px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{detailContact.name}</div>
            <span style={{
              display: 'inline-block', background: 'color-mix(in srgb, var(--social) 20%, transparent)',
              color: 'var(--social)', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginBottom: '14px'
            }}>{detailContact.relationship}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {detailContact.phone && <div style={{ fontSize: '12px', color: 'var(--text)' }}>{detailContact.phone}</div>}
              {detailContact.email && <div style={{ fontSize: '12px', color: 'var(--text)' }}>{detailContact.email}</div>}
              {frequencyLabel(detailContact.contact_frequency) && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{frequencyLabel(detailContact.contact_frequency)}</div>}
              {detailContact.birthday && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{formatBirthday(detailContact.birthday)}</div>}
              {detailContact.notes && <div style={{ fontSize: '12px', color: 'var(--muted2)', fontStyle: 'italic' }}>{detailContact.notes}</div>}
            </div>

            <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Reminders</div>
            {detailReminders.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>No reminders for this contact</div>
            )}
            {detailReminders.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--surf3)', borderRadius: '7px', marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatReminderDate(r.remind_on)}{r.recurring === 'yearly' ? ' · Recurring' : ''}</div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => { openEditContact(detailContact); setDetailContact(null) }} style={{ flex: 1, background: 'var(--social)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '11px', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
              <button onClick={() => setDetailContact(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '13px', padding: '11px 16px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
