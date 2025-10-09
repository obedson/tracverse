const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Migration endpoint to link existing users to Supabase Auth
router.post('/migrate-to-auth', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from our table
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .is('user_id', null) // Only migrate users without auth link
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found or already migrated' });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      return res.status(500).json({ error: 'Auth migration failed' });
    }

    // Link auth user to our table
    await supabase
      .from('users')
      .update({ user_id: authData.user.id })
      .eq('id', user.id);

    res.json({ message: 'Migration successful', auth_linked: true });

  } catch (error) {
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Batch migration for all users
router.post('/migrate-all-users', async (req, res) => {
  try {
    const { data: unlinkedUsers } = await supabase
      .from('users')
      .select('*')
      .is('user_id', null);

    let migrated = 0;
    for (const user of unlinkedUsers) {
      try {
        // Generate temporary password for migration
        const tempPassword = 'TempPass123!' + user.id.slice(-4);
        
        const { data: authData } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true
        });

        if (authData) {
          await supabase
            .from('users')
            .update({ user_id: authData.user.id })
            .eq('id', user.id);
          migrated++;
        }
      } catch (err) {
        console.error(`Migration failed for ${user.email}:`, err);
      }
    }

    res.json({ message: `Migrated ${migrated} users` });
  } catch (error) {
    res.status(500).json({ error: 'Batch migration failed' });
  }
});

module.exports = router;
