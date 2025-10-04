import { eq } from 'drizzle-orm';
import { createDrizzleClient } from '../src/client';
import * as schema from '../src/schema';
import { hashPassword } from '@brainliest/shared/crypto/password';

async function main() {
  const db = createDrizzleClient();
  console.log('Starting user seed...');

  try {
    const hashedPassword = await hashPassword('Um@ir7156');

    // Check if regular user exists
    const [existingUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, 'umair.warraich@gmail.com'))
      .limit(1);

    if (!existingUser) {
      // Create regular user account
      await db.insert(schema.users).values({
        email: 'umair.warraich@gmail.com',
        firstName: 'Umair',
        lastName: 'Warraich',
        passwordHash: hashedPassword,
        role: 'STUDENT',
      });
      console.log('✓ Created regular user: umair.warraich@gmail.com');
    } else {
      // Update password if user exists
      await db
        .update(schema.users)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.email, 'umair.warraich@gmail.com'));
      console.log('✓ Updated regular user password: umair.warraich@gmail.com');
    }

    // Check if admin user exists
    const [existingAdmin] = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, 'umair.warraich@gmail.com'))
      .limit(1);

    if (!existingAdmin) {
      // Create admin account
      await db.insert(schema.adminUsers).values({
        email: 'umair.warraich@gmail.com',
        firstName: 'Umair',
        lastName: 'Warraich',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
      });
      console.log('✓ Created super admin: umair.warraich@gmail.com');
    } else {
      // Update password if admin exists
      await db
        .update(schema.adminUsers)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(schema.adminUsers.email, 'umair.warraich@gmail.com'));
      console.log('✓ Updated super admin password: umair.warraich@gmail.com');
    }

    console.log('\n✅ User seeding completed successfully!');
    console.log('\nYou can now log in with:');
    console.log('  Regular User (Student):');
    console.log('    Email: umair.warraich@gmail.com');
    console.log('    Password: Um@ir7156');
    console.log('    URL: http://localhost:3000');
    console.log('\n  Super Admin:');
    console.log('    Email: umair.warraich@gmail.com');
    console.log('    Password: Um@ir7156');
    console.log('    URL: http://localhost:3001');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

// Run the seed function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
