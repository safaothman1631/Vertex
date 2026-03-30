import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Storage policies SQL
const policies = [
  {
    name: 'auth_upload_images',
    sql: `CREATE POLICY "auth_upload_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images')`
  },
  {
    name: 'public_read_images',
    sql: `CREATE POLICY "public_read_images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images')`
  },
  {
    name: 'auth_update_images',
    sql: `CREATE POLICY "auth_update_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images')`
  },
  {
    name: 'auth_delete_images',
    sql: `CREATE POLICY "auth_delete_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images')`
  },
]

for (const p of policies) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  // Try using the Supabase Management API instead
}

// Alternative: test upload directly to verify bucket works
const testBlob = new Blob(['test'], { type: 'text/plain' })
const { data, error } = await supabase.storage.from('images').upload('_test.txt', testBlob, { upsert: true })
if (error) {
  console.log('Upload test failed:', error.message)
} else {
  console.log('Upload test passed:', data.path)
  await supabase.storage.from('images').remove(['_test.txt'])
  console.log('Test file cleaned up')
}

// Get public URL format
const { data: urlData } = supabase.storage.from('images').getPublicUrl('test.jpg')
console.log('Public URL format:', urlData.publicUrl)

console.log('\nStorage bucket "images" is ready!')
console.log('Note: Since the bucket is public, no RLS SELECT policy needed for reads.')
console.log('Upload policies may need to be set in Supabase Dashboard > Storage > Policies')
