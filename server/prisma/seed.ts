import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role with full access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user role',
    },
  });

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: true,
      phone: '+1234567890',
    },
  });

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      name: 'Regular User',
      username: 'user',
      email: 'user@example.com',
      password: hashedPassword,
      isVerified: true,
      phone: '+0987654321',
    },
  });

  // Assign roles
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: userRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: userRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: regularUser.id, roleId: userRole.id } },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
    },
  });

  // Create sample FCM token
  await prisma.userTokens.upsert({
    where: { userId_deviceId: { userId: adminUser.id, deviceId: 'device1' } },
    update: {},
    create: {
      userId: adminUser.id,
      token: 'sample-fcm-token-admin',
      deviceType: 'WEB',
      deviceId: 'device1',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Sample users:');
  console.log('- Username: admin, Password: password123 (Admin)');
  console.log('- Username: user, Password: password123 (Regular user)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });