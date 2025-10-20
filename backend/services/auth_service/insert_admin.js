const { Client } = require('pg');

async function insertAdmin() {
  const client = new Client({
    host: 'db',
    port: 5432,
    database: 'attendance_db',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, let's check if the users table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    console.log('Tables found:', tableCheck.rows);

    if (tableCheck.rows.length === 0) {
      console.log('Users table does not exist. Creating it...');
      
      // Create the users table
      await client.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(50),
          employee_id VARCHAR(100),
          role VARCHAR(50) NOT NULL,
          position VARCHAR(100),
          department VARCHAR(100),
          hire_date TIMESTAMP WITH TIME ZONE,
          salary DECIMAL(12,2),
          profile_photo_url VARCHAR(500),
          face_encoding_data TEXT,
          face_encoding_created_at TIMESTAMP WITH TIME ZONE,
          face_encoding_expires_at TIMESTAMP WITH TIME ZONE,
          face_encoding_quality_score DECIMAL(5,2),
          work_mode VARCHAR(20) DEFAULT 'onsite',
          hybrid_remote_days INTEGER DEFAULT 0,
          preferred_remote_days JSONB DEFAULT '[]',
          home_address TEXT,
          home_latitude DECIMAL(10,8),
          home_longitude DECIMAL(11,8),
          home_geofence_radius INTEGER DEFAULT 100,
          approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          approved_by UUID,
          approved_at TIMESTAMP WITH TIME ZONE,
          rejection_reason TEXT,
          mobile_app_access BOOLEAN NOT NULL DEFAULT false,
          mobile_app_last_used TIMESTAMP WITH TIME ZONE,
          dashboard_access BOOLEAN NOT NULL DEFAULT false,
          dashboard_last_used TIMESTAMP WITH TIME ZONE,
          platform_panel_access BOOLEAN NOT NULL DEFAULT false,
          platform_panel_last_used TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_login_at TIMESTAMP WITH TIME ZONE,
          last_login_ip INET,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP WITH TIME ZONE,
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP WITH TIME ZONE,
          email_verified BOOLEAN NOT NULL DEFAULT false,
          email_verification_token VARCHAR(255),
          two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
          two_factor_secret VARCHAR(255),
          two_factor_backup_codes JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      console.log('Users table created successfully');
    }

    // Now insert the platform admin
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
    
    const result = await client.query(`
      INSERT INTO users (
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name, role
    `, [
      'admin@platform.com',
      hashedPassword,
      'Platform',
      'Admin',
      'platform_admin',
      'approved',
      false,
      false,
      true,
      true
    ]);

    if (result.rows.length > 0) {
      console.log('Platform admin created successfully:', result.rows[0]);
    } else {
      console.log('Platform admin already exists');
    }

    // Verify the user was created
    const verifyResult = await client.query(`
      SELECT id, email, first_name, last_name, role, approval_status, platform_panel_access 
      FROM users 
      WHERE email = 'admin@platform.com'
    `);
    
    console.log('Verification:', verifyResult.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

insertAdmin();
