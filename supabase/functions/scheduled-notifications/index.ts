import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendPush(supabase: any, title: string, body: string) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (!subscriptions || subscriptions.length === 0) return

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
  const vapidEmail = Deno.env.get('VAPID_EMAIL') ?? ''

  const webpush = await import('npm:web-push@3.6.7')
  webpush.default.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

  await Promise.allSettled(
    subscriptions.map((sub: any) =>
      webpush.default.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body })
      )
    )
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type } = await req.json()

    if (type === 'morning') {
      await sendPush(supabase, 'Good morning', 'Open Sumeria to set your priority and start your day.')
    } else if (type === 'evening') {
      await sendPush(supabase, 'Evening reflection', 'How was your day? Log your win and gratitude.')
    } else if (type === 'medicines') {
      const now = new Date()
      const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
      const currentHour = mexicoTime.getHours()
      const currentMin = mexicoTime.getMinutes()

      const { data: meds } = await supabase.from('medicines').select('*')
      if (!meds) return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })

      for (const med of meds) {
        if (!med.time) continue
        const [h, m] = med.time.split(':').map(Number)
        const notifyMin = med.notify_before_min || 15
        let fireH = h
        let fireM = m - notifyMin
        if (fireM < 0) { fireH -= 1; fireM += 60 }

        if (fireH === currentHour && Math.abs(fireM - currentMin) <= 1) {
          await sendPush(
            supabase,
            'Medicine reminder',
            `Time to take ${med.name} — ${med.dose}${med.with_food ? ' with food' : ''}`
          )
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})