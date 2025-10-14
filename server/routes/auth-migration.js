const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Generate simple UUID using crypto (built-in)
function generateUserId() {
  return crypto.randomUUID();
}

// Simple migration - just add user_id to existing users
router.post('/migrate-all-users', async (req, res) => {
  try {
    console.log('Starting user migration...');

    // Get all users without user_id
    const { data: unlinkedUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .is('user_id', null);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    if (!unlinkedUsers || unlinkedUsers.length === 0) {
      return res.json({ message: 'No users need migration' });
    }

    console.log(`Found ${unlinkedUsers.length} users to migrate`);

    let migrated = 0;
    let errors = [];

    for (const user of unlinkedUsers) {
      try {
        // Generate a UUID for user_id
        const userId = generateUserId();
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ user_id: userId })
          .eq('id', user.id);

        if (updateError) {
          errors.push(`${user.email}: ${updateError.message}`);
        } else {
          migrated++;
          console.log(`✅ Migrated: ${user.email} -> ${userId}`);
        }
      } catch (err) {
        errors.push(`${user.email}: ${err.message}`);
        console.error(`❌ Migration failed for ${user.email}:`, err);
      }
    }

    console.log(`Migration complete: ${migrated} successful, ${errors.length} errors`);

    res.json({ 
      message: `Migration complete: ${migrated} users migrated`,
      migrated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Batch migration error:', error);
    res.status(500).json({ error: 'Batch migration failed: ' + error.message });
  }
});

module.exports = router;
