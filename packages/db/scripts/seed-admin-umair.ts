import { drizzleClient } from '../src/client';
import { adminUsers } from '../src/schema';
import { hashPassword } from '@brainliest/shared/crypto/password';

async function seedAdminUser() {
  try {
    const email = 'umair.warraich@gmail.com';
    const password = 'Um@ir7156';

    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);

    console.log('Creating admin user...');
    await drizzleClient
      .insert(adminUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'active',
        lastLoginAt: null,
      })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: {
          passwordHash: hashedPassword,
          status: 'active',
          updatedAt: new Date(),
        },
      });

    console.log('✓ Admin user created/updated successfully');
    console.log(`  Email: ${email}`);
    console.log(`  Role: admin`);
    console.log(`  Status: active`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exit(1);
  }
}

seedAdminUser();
