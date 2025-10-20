const bcrypt = require('bcryptjs');

async function generateAdmin() {
  const password = 'AdminPass123!';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  console.log('Password:', password);
  console.log('Hashed Password:', hashedPassword);
  
  const insertSQL = `
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  approval_status, 
  mobile_app_access, 
  dashboard_access, 
  platform_panel_access, 
  is_active, 
  created_at, 
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@platform.com',
  '${hashedPassword}',
  'Platform',
  'Admin',
  'platform_admin',
  'approved',
  false,
  false,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
`;

  console.log('\nSQL to execute:');
  console.log(insertSQL);
}

generateAdmin().catch(console.error);
