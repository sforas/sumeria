import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Diet() {
  const [view, setView] = useState('day')
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newMeal, setNewMeal] = useState({ name: '', meal_type: 'Breakfast', calories: '', protein_g: '', notes: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setMeals(data || [])
    setLoading(false)
  }

  async function addMeal() {
    if (!newMeal.name.trim()) return
    const { data } = await supabase.from('meals').insert({
      ...newMeal,
      calories: parseInt(newMeal.calories) || 0,
      protein_g: parseInt(newMeal.protein_g) || 0,
      date: today()
    }).select().single()
    if (data) setMeals([data, ...meals])
    setNewMeal({ name: '', meal_type: 'Breakfast', calories: '', protein_g: '', notes: '' })
    setShowAdd(false)
    await supabase.from('xp_log').insert({ amount: 20, reason: 'Meal logged', date: today() })
  }

  async function deleteMeal(id) {
    await supabase.from('meals').delete().eq('id', id)
    setMeals(meals.filter(m => m.id !== id))
  }

  const todayMeals = meals.filter(m => m.date === today())
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein_g || 0), 0)
  const calorieGoal = 2000
  const proteinGoal = 120
  const views = ['day', 'week', 'month', 'ytd']

  const monthMeals = meals.filter(m => m.date?.startsWith(today().slice(0, 7)))
  const uniqueDaysMonth = [...new Set(monthMeals.map(m => m.date))].length
  const avgCalories = uniqueDaysMonth > 0
    ? Math.round(monthMeals.reduce((sum, m) => sum + (m.calories || 0), 0) / uniqueDaysMonth)
    : 0

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '19px', fontWeight: 500, color: 'var(--diet)' }}>Diet</div>
          <div style={{ fontSize: '12px', color: 'var(--muted2)', marginTop: '2px' }}>Meals · Macros · Energy</div>
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
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Calories</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: totalCalories > calorieGoal ? 'var(--danger)' : 'var(--diet)' }}>{totalCalories}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>Goal: {calorieGoal}</div>
              <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(totalCalories / calorieGoal * 100, 100)}%`, height: '100%', background: totalCalories > calorieGoal ? 'var(--danger)' : 'var(--diet)', borderRadius: '2px', transition: 'width .3s' }} />
              </div>
            </div>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Protein</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--fit)' }}>{totalProtein}g</div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>Goal: {proteinGoal}g</div>
              <div style={{ height: '3px', background: 'var(--surf3)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(totalProtein / proteinGoal * 100, 100)}%`, height: '100%', background: 'var(--fit)', borderRadius: '2px', transition: 'width .3s' }} />
              </div>
            </div>
            <div style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>Meals</div>
              <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text)' }}>{todayMeals.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>Today</div>
            </div>
          </div>

          {/* Meals list */}
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '8px' }}>
            Today's meals
          </div>
          {loading && <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading...</div>}
          {!loading && todayMeals.length === 0 && (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px', marginBottom: '8px'
            }}>No meals logged today</div>
          )}
          {todayMeals.map(meal => (
            <div key={meal.id} style={{
              display: 'flex', gap: '10px', padding: '10px 12px',
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '8px', marginBottom: '6px', alignItems: 'center'
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: '#160d07', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, fontSize: '14px'
              }}>
                {meal.meal_type === 'Breakfast' ? '🌅' : meal.meal_type === 'Lunch' ? '☀️' : meal.meal_type === 'Dinner' ? '🌙' : '🍎'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>{meal.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                  {meal.meal_type} · {meal.calories} kcal · {meal.protein_g}g protein
                </div>
              </div>
              <button onClick={() => deleteMeal(meal.id)} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', fontSize: '16px', padding: '4px'
              }}>×</button>
            </div>
          ))}

          {/* Add meal */}
          {showAdd ? (
            <div style={{
              background: 'var(--surf)', border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '13px', marginTop: '6px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '10px' }}>Log meal</div>
              <input
                autoFocus
                placeholder="What did you eat?"
                value={newMeal.name}
                onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              />
              <select
                value={newMeal.meal_type}
                onChange={e => setNewMeal({ ...newMeal, meal_type: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '8px'
                }}
              >
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  placeholder="Calories"
                  type="number"
                  value={newMeal.calories}
                  onChange={e => setNewMeal({ ...newMeal, calories: e.target.value })}
                  style={{
                    width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                    borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                    padding: '9px 11px', outline: 'none'
                  }}
                />
                <input
                  placeholder="Protein (g)"
                  type="number"
                  value={newMeal.protein_g}
                  onChange={e => setNewMeal({ ...newMeal, protein_g: e.target.value })}
                  style={{
                    width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                    borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                    padding: '9px 11px', outline: 'none'
                  }}
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={newMeal.notes}
                onChange={e => setNewMeal({ ...newMeal, notes: e.target.value })}
                style={{
                  width: '100%', background: 'var(--surf3)', border: '0.5px solid var(--border)',
                  borderRadius: '7px', color: 'var(--text)', fontSize: '13px',
                  padding: '9px 11px', outline: 'none', marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '7px' }}>
                <button onClick={addMeal} style={{
                  flex: 1, background: 'var(--diet)', border: 'none', borderRadius: '7px',
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
            }}>+ Log meal</button>
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Days logged', value: [...new Set(meals.filter(m => { const d = new Date(m.date); const w = new Date(); w.setDate(w.getDate()-7); return d >= w }).map(m => m.date))].length, sub: 'This week', color: 'var(--diet)' },
              { label: 'Avg calories', value: (() => { const wm = meals.filter(m => { const d = new Date(m.date); const w = new Date(); w.setDate(w.getDate()-7); return d >= w }); const days = [...new Set(wm.map(m => m.date))].length; return days > 0 ? Math.round(wm.reduce((s,m) => s+(m.calories||0),0)/days) : 0 })(), sub: 'Per day', color: 'var(--text)' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surf)', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '11px 13px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 500, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px' }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Days logged', value: uniqueDaysMonth, color: 'var(--diet)' },
            { label: 'Avg calories', value: avgCalories, color: 'var(--text)' },
            { label: 'Consistency', value: `${Math.round(uniqueDaysMonth / 30 * 100)}%`, color: uniqueDaysMonth >= 25 ? 'var(--fit)' : 'var(--xp)' },
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {[
            { label: 'Total meals', value: meals.length, color: 'var(--diet)' },
            { label: 'Days logged', value: [...new Set(meals.map(m => m.date))].length, color: 'var(--text)' },
            { label: 'Avg calories', value: (() => { const days = [...new Set(meals.map(m => m.date))].length; return days > 0 ? Math.round(meals.reduce((s,m) => s+(m.calories||0),0)/days) : 0 })(), color: 'var(--text)' },
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