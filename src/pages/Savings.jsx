import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Savings() {
  const [view, setView] = useState('month')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTx, setNewTx] = useState({ description: '', amount: '', type: 'saving' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function addTransaction() {
    if (!newTx.description.trim() || !newTx.amount) return
    const amount = newTx.type === 'expense'
      ? -Math.abs(parseFloat(newTx.amount))
      : Math.abs(parseFloat(newTx.amount))
    const { data } = await supabase.from('transactions').insert({
      description: newTx.description,
      amount,
      type: newTx.type,
      date: today()
    }).select().single()
    if (data) setTransactions([data, ...transactions])
    setNewTx({ description: '', amount: '', type: 'saving' })
    setShowAdd(false)
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const totalSaved = transactions
  .filter(t => t.type === 'saving')
  .reduce((sum, t) => sum + (t.amount || 0), 0)

const totalIncome = transactions
  .filter(t => t.type === 'income')
  .reduce((sum, t) => sum + (t.amount || 0), 0)

const totalExpenses = transactions
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

const availableBalance = totalIncome - totalExpenses - totalSaved

  const thisMonth = today().slice(0, 7)
  const monthTx = transactions.filter(t => t.date?.startsWith(thisMonth))
  const monthSaved = monthTx.filter(t => t.type === 'saving').reduce((sum, t) => sum + (t.amount || 0), 0)
  const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
  const monthIncome = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)

  const ytdTx = transactions.filter(t => t.date?.startsWith(today().slice(0, 4)))
  const ytdSaved = ytdTx.filter(t => t.type === 'saving').reduce((sum, t) => sum + (t.amount || 0), 0)

  const emergencyGoal = 100000
  const views = ['month', 'ytd']

  function txIcon(type) {
    return type === 'saving' ? '💰' : type === 'income' ? '📈' : '📉'
  }

  function txColor(type) {
    return type === 'expense' ? 'var(--diet)' : 'var(--savings)'
  }

  function formatMXN(amount) {
    return `$${Math.abs(amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--savings)' }}>Savings</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Plan · Track · Invest</div>
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

      {/* Available balance */}
<div style={{
  background: 'var(--surf)', border: '0.5px solid var(--border)',
  borderRadius: '10px', padding: '13px 15px', marginBottom: '8px'
}}>
  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>
    Available balance
  </div>
  <div style={{ fontSize: '28px', fontWeight: 500, color: availableBalance >= 0 ? 'var(--fit)' : 'var(--danger)', marginBottom: '2px' }}>
    {availableBalance >= 0 ? '' : '-'}{formatMXN(availableBalance)}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '10px' }}>
    {[
      { label: 'Income', value: formatMXN(totalIncome), color: 'var(--fit)' },
      { label: 'Expenses', value: formatMXN(totalExpenses), color: 'var(--diet)' },
      { label: 'Saved', value: formatMXN(totalSaved), color: 'var(--savings)' },
    ].map((k, i) => (
      <div key={i} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>{k.label}</div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: k.color }}>{k.value}</div>
      </div>
    ))}
  </div>
</div>

      {/* MONTH VIEW */}
      {view === 'month' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'Saved', value: formatMXN(monthSaved), color: 'var(--savings)' },
              { label: 'Income', value: formatMXN(monthIncome), color: 'var(--fit)' },
              { label: 'Expenses', value: formatMXN(monthExpenses), color: 'var(--diet)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Transactions
          </div>

          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && transactions.length === 0 && (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px', marginBottom: '8px'
            }}>No transactions yet</div>
          )}

          {transactions.slice(0, 15).map(tx => (
            <div key={tx.id} style={{
              display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px',
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '8px', marginBottom: '5px'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: tx.type === 'expense' ? '#160d07' : '#061208',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '13px'
              }}>{txIcon(tx.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{tx.description}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{tx.date} · {tx.type}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: txColor(tx.type) }}>
                {tx.amount > 0 ? '+' : ''}{formatMXN(tx.amount)}
              </div>
              <button onClick={() => deleteTransaction(tx.id)} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', fontSize: '16px', padding: '0'
              }}>×</button>
            </div>
          ))}

          {showAdd ? (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '13px', marginTop: '6px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Add transaction</div>
              <input
                autoFocus
                placeholder="Description"
                value={newTx.description}
                onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <input
                placeholder="Amount (MXN)"
                type="number"
                value={newTx.amount}
                onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <select
                value={newTx.type}
                onChange={e => setNewTx({ ...newTx, type: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '10px'
                }}
              >
                <option value="saving">Saving</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addTransaction} style={{
                  flex: 1, background: 'var(--savings)', border: 'none', borderRadius: '7px',
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
            }}>+ Add transaction</button>
          )}
        </>
      )}

      {/* YTD VIEW */}
      {view === 'ytd' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Saved YTD', value: formatMXN(ytdSaved), color: 'var(--savings)' },
              { label: 'Transactions', value: ytdTx.length, color: 'var(--text)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 500, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: 'var(--surf)', border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '13px', fontSize: '12px',
            color: 'var(--muted2)', lineHeight: 1.7
          }}>
            💡 When you land a job, this section evolves into a full investment tracker — CETES, ETFs, GBM+, and more.
          </div>
        </>
      )}
    </div>
  )
}