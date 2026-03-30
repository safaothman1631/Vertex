const { createClient } = require('@supabase/supabase-js')
const s = createClient(
  'https://xlzcnxketisxbuznfipn.supabase.co',
  'sb_publishable_6k4OSj36zUydhW4E8pNcSg_y9KIgZSH'
)

async function test() {
  const { data: d1, error: e1 } = await s.from('notifications').select('id').limit(1)
  console.log('notifications:', e1 ? 'ERROR: ' + JSON.stringify(e1) : 'OK')

  const { data: d2, error: e2 } = await s.from('products').select('id').limit(1)
  console.log('products:', e2 ? 'ERROR: ' + JSON.stringify(e2) : 'OK')

  const { data: d3, error: e3 } = await s.from('profiles').select('id').limit(1)
  console.log('profiles:', e3 ? 'ERROR: ' + JSON.stringify(e3) : 'OK')

  const { data: d4, error: e4 } = await s.from('wishlist').select('id').limit(1)
  console.log('wishlist:', e4 ? 'ERROR: ' + JSON.stringify(e4) : 'OK')
}

test().catch(err => console.error('FATAL:', err.message))
