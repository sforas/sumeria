import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

export default function Reading() {
  const [view, setView] = useState('day')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showLogPages, setShowLogPages] = useState(null)
  const [editBook, setEditBook] = useState(null)
  const [newBook, setNewBook] = useState({ title: '', author: '', total_pages: '', format: 'physical' })
  const [newPages, setNewPages] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    setBooks(data || [])
    setLoading(false)
  }

  async function addBook() {
    if (!newBook.title.trim()) return
    const { data } = await supabase.from('books').insert({
      ...newBook, total_pages: parseInt(newBook.total_pages) || 0, pages_read: 0, status: 'reading'
    }).select().single()
    if (data) setBooks(prev => [data, ...prev])
    setNewBook({ title: '', author: '', total_pages: '', format: 'physical' })
    setShowAdd(false)
  }

  async function saveBook() {
    if (!editBook) return
    const payload = { title: editBook.title, author: editBook.author, total_pages: parseInt(editBook.total_pages) || 0, format: editBook.format }
    await supabase.from('books').update(payload).eq('id', editBook.id)
    setBooks(prev => prev.map(b => b.id === editBook.id ? { ...b, ...payload } : b))
    setEditBook(null)
  }

  async function updatePages(book) {
    const pages = parseInt(newPages)
    if (!pages || pages < 0) return
    const updatedPages = Math.min(pages, book.total_pages)
    const status = updatedPages >= book.total_pages ? 'finished' : 'reading'
    const { data } = await supabase.from('books').update({ pages_read: updatedPages, status }).eq('id', book.id).select().single()
    if (data) setBooks(books.map(b => b.id === book.id ? data : b))
    setNewPages('')
    setShowLogPages(null)
    await supabase.from('xp_log').insert({ amount: 15, reason: 'Pages logged', date: today() })
    if (status === 'finished') await supabase.from('xp_log').insert({ amount: 200, reason: 'Book finished!', date: today() })
  }

  async function deleteBook(id) {
    await supabase.from('books').delete().eq('id', id)
    setBooks(books.filter(b => b.id !== id))
  }

  const reading = books.filter(b => b.status === 'reading')
  const finished = books.filter(b => b.status === 'finished')
  const thisMonth = today().slice(0, 7)
  const finishedThisMonth = finished.filter(b => b.created_at?.startsWith(thisMonth))
  const totalPagesRead = books.reduce((sum, b) => sum + (b.pages_read || 0), 0)
  const views = ['day', 'week', 'month', 'ytd']

  function BookEditForm() {
    return (
      <div style={{ padding: '4px 0' }}>
        <input placeholder="Title" value={editBook.title} onChange={e => setEditBook(p => ({ ...p, title: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
        <input placeholder="Author" value={editBook.author} onChange={e => setEditBook(p => ({ ...p, author: e.target.value }))}
          style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <input placeholder="Total pages" type="number" value={editBook.total_pages} onChange={e => setEditBook(p => ({ ...p, total_pages: e.target.value }))}
            style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }} />
          <select value={editBook.format} onChange={e => setEditBook(p => ({ ...p, format: e.target.value }))}
            style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none' }}>
            <option value="physical">Physical</option>
            <option value="kindle">Kindle</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button onClick={saveBook} style={{ flex: 1, background: 'var(--read)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
          <button onClick={() => setEditBook(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--read)' }}>Reading</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Books · Pages · Notes</div>
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
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>Currently reading</div>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && reading.length === 0 && (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>No books in progress</div>
          )}
          {reading.map(book => (
            <div key={book.id} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '12px 13px', marginBottom: '8px' }}>
              {editBook?.id === book.id ? (
                <BookEditForm />
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '48px', borderRadius: '4px', background: 'var(--surf3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{book.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)', marginBottom: '6px' }}>{book.author} · {book.format === 'physical' ? 'Physical' : 'Kindle'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted2)', marginBottom: '4px' }}>
                      <span>Page {book.pages_read} of {book.total_pages}</span>
                      <span>{book.total_pages > 0 ? Math.round(book.pages_read / book.total_pages * 100) : 0}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${book.total_pages > 0 ? book.pages_read / book.total_pages * 100 : 0}%`, height: '100%', background: 'var(--read)', borderRadius: '2px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={() => setEditBook({ ...book })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => deleteBook(book.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                </div>
              )}
              {editBook?.id !== book.id && (
                showLogPages === book.id ? (
                  <div style={{ display: 'flex', gap: '7px', marginTop: '10px' }}>
                    <input autoFocus placeholder={`Current page (max ${book.total_pages})`} type="number"
                      value={newPages} onChange={e => setNewPages(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && updatePages(book)}
                      style={{ flex: 1, background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
                    <button onClick={() => updatePages(book)} style={{ background: 'var(--read)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '12px', padding: '8px 14px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                    <button onClick={() => setShowLogPages(null)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '12px', padding: '8px 10px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowLogPages(book.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '7px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '7px', color: 'var(--muted)', cursor: 'pointer', fontSize: '11px', marginTop: '10px' }}>
                    + Update pages
                  </button>
                )
              )}
            </div>
          ))}

          {finished.length > 0 && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', margin: '12px 0 8px' }}>Finished</div>
              {finished.map(book => (
                <div key={book.id} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '8px', marginBottom: '6px', alignItems: 'center', opacity: 0.7 }}>
                  <div style={{ width: '30px', height: '42px', borderRadius: '4px', background: 'var(--surf3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{book.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{book.author} · {book.total_pages} pages</div>
                  </div>
                  <button onClick={() => setEditBook({ ...book })} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                  <button onClick={() => deleteBook(book.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              ))}
            </>
          )}

          {showAdd ? (
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '13px', marginTop: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Add book</div>
              <input autoFocus placeholder="Title" value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
              <input placeholder="Author" value={newBook.author} onChange={e => setNewBook(p => ({ ...p, author: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
              <input placeholder="Total pages" type="number" value={newBook.total_pages} onChange={e => setNewBook(p => ({ ...p, total_pages: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '8px' }} />
              <select value={newBook.format} onChange={e => setNewBook(p => ({ ...p, format: e.target.value }))}
                style={{ width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--text)', fontSize: '13px', padding: '9px 11px', outline: 'none', marginBottom: '10px' }}>
                <option value="physical">Physical</option>
                <option value="kindle">Kindle</option>
              </select>
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addBook} style={{ flex: 1, background: 'var(--read)', border: 'none', borderRadius: '7px', color: '#000', fontSize: '13px', padding: '9px', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '7px', color: 'var(--muted)', fontSize: '13px', padding: '9px 14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '9px', background: 'none', border: '0.5px dashed var(--border)', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>+ Add book</button>
          )}
        </>
      )}

      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Reading', value: reading.length, sub: 'In progress', color: 'var(--read)' },
            { label: 'Finished', value: finished.length, sub: 'Total', color: 'var(--fit)' },
            { label: 'Pages read', value: totalPagesRead, sub: 'All time', color: 'var(--text)' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Finished this month', value: finishedThisMonth.length, color: 'var(--fit)' },
            { label: 'Total pages read', value: totalPagesRead, color: 'var(--read)' },
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
            { label: 'Books finished', value: finished.length, color: 'var(--fit)' },
            { label: 'In progress', value: reading.length, color: 'var(--read)' },
            { label: 'Total pages', value: totalPagesRead, color: 'var(--text)' },
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