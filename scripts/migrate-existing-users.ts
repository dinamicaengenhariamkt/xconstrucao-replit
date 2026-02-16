#!/usr/bin/env tsx
/**
 * Migration Script: Auto-verify existing users
 *
 * This script updates all existing users who registered before email verification
 * was implemented. It sets their emailVerified timestamp to the current date.
 *
 * Only users with passwords (credential-based) are updated. OAuth users will be
 * auto-verified on their next login via the signIn callback.
 */

import { db } from '../server/db';
import { users } from '@shared/db/schema';
import { sql } from 'drizzle-orm';

async function migrateExistingUsers() {
  try {
    console.log('🔄 Starting migration of existing users...\n');

    // Update users who have emailVerified = null and have a password
    const result = await db
      .update(users)
      .set({ emailVerified: sql`CURRENT_TIMESTAMP` })
      .where(sql`${users.emailVerified} IS NULL AND ${users.password} IS NOT NULL`)
      .returning({ id: users.id, email: users.email });

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 ${result.length} user(s) were auto-verified:\n`);

    result.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    if (result.length === 0) {
      console.log('   No users needed migration.');
    }

    console.log('\n✨ All done! Existing users can now log in normally.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateExistingUsers();
