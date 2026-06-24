import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('goals').select('*').limit(1)
      if (error) {
        setStatus('❌ Error: ' + error.message)
      } else {
        setStatus('✅ Supabase conectado correctamente')
      }
    }
    testConnection()
  }, [])

  return (
    <div style={{ background: '#0d0d0d', color: '#ededed', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: '18px' }}>
      {status}
    </div>
  )
}

export default App