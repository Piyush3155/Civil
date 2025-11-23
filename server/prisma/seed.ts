import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // -------------------------
  // CREATE ROLES
  // -------------------------
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

  // Civil construction roles
  const projectManagerRole = await prisma.role.upsert({
    where: { name: 'PROJECT_MANAGER' },
    update: {},
    create: {
      name: 'PROJECT_MANAGER',
      description: 'Project Manager - manages projects, teams, and contractors',
    },
  });

  const siteEngineerRole = await prisma.role.upsert({
    where: { name: 'SITE_ENGINEER' },
    update: {},
    create: {
      name: 'SITE_ENGINEER',
      description: 'Site Engineer - supervises on-site work, reviews drawings',
    },
  });

  const contractorRole = await prisma.role.upsert({
    where: { name: 'CONTRACTOR' },
    update: {},
    create: {
      name: 'CONTRACTOR',
      description: 'Contractor - manages labour, views project documents',
    },
  });

  const labourRole = await prisma.role.upsert({
    where: { name: 'LABOUR' },
    update: {},
    create: {
      name: 'LABOUR',
      description: 'Labour - views assigned drawings and work plans',
    },
  });

  // -------------------------
  // CREATE USERS WITH DIFFERENT ROLES
  // -------------------------
  const hashedPassword123 = await bcrypt.hash('123', 10);
  const hashedPasswordDefault = await bcrypt.hash('password123', 10);

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPasswordDefault,
      isVerified: true,
      isAdmin: true,
      phone: '+1234567890',
    },
  });

  // Piyush - Project Manager
  const piyushUser = await prisma.user.upsert({
    where: { email: 'piyush.playtech@gmail.com' },
    update: {},
    create: {
      name: 'Piyush Kumar',
      username: 'piyush',
      email: 'piyush.playtech@gmail.com',
      password: hashedPassword123,
      isVerified: true,
      isAdmin: false,
      phone: '+919876543210',
    },
  });

  // Site Engineer User
  const engineerUser = await prisma.user.upsert({
    where: { email: 'engineer@civil.com' },
    update: {},
    create: {
      name: 'Rajesh Sharma',
      username: 'rajesh_engineer',
      email: 'engineer@civil.com',
      password: hashedPassword123,
      isVerified: true,
      isAdmin: false,
      phone: '+919876543211',
    },
  });

  // Contractor User
  const contractorUser = await prisma.user.upsert({
    where: { email: 'contractor@civil.com' },
    update: {},
    create: {
      name: 'Amit Constructions',
      username: 'amit_contractor',
      email: 'contractor@civil.com',
      password: hashedPassword123,
      isVerified: true,
      isAdmin: false,
      phone: '+919876543212',
    },
  });

  // Labour User
  const labourUser = await prisma.user.upsert({
    where: { email: 'labour@civil.com' },
    update: {},
    create: {
      name: 'Ramesh Kumar',
      username: 'ramesh_labour',
      email: 'labour@civil.com',
      password: hashedPassword123,
      isVerified: true,
      isAdmin: false,
      phone: '+919876543213',
    },
  });

  // Another Site Engineer
  const engineerUser2 = await prisma.user.upsert({
    where: { email: 'priya.engineer@civil.com' },
    update: {},
    create: {
      name: 'Priya Singh',
      username: 'priya_engineer',
      email: 'priya.engineer@civil.com',
      password: hashedPassword123,
      isVerified: true,
      isAdmin: false,
      phone: '+919876543214',
    },
  });

  // -------------------------
  // ASSIGN ROLES TO USERS
  // -------------------------
  
  // Admin - both ADMIN and USER roles
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: userRole.id },
  });

  // Piyush - PROJECT_MANAGER
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: piyushUser.id, roleId: projectManagerRole.id } },
    update: {},
    create: { userId: piyushUser.id, roleId: projectManagerRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: piyushUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: piyushUser.id, roleId: userRole.id },
  });

  // Rajesh - SITE_ENGINEER
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: engineerUser.id, roleId: siteEngineerRole.id } },
    update: {},
    create: { userId: engineerUser.id, roleId: siteEngineerRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: engineerUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: engineerUser.id, roleId: userRole.id },
  });

  // Priya - SITE_ENGINEER
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: engineerUser2.id, roleId: siteEngineerRole.id } },
    update: {},
    create: { userId: engineerUser2.id, roleId: siteEngineerRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: engineerUser2.id, roleId: userRole.id } },
    update: {},
    create: { userId: engineerUser2.id, roleId: userRole.id },
  });

  // Amit - CONTRACTOR
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: contractorUser.id, roleId: contractorRole.id } },
    update: {},
    create: { userId: contractorUser.id, roleId: contractorRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: contractorUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: contractorUser.id, roleId: userRole.id },
  });

  // Ramesh - LABOUR
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: labourUser.id, roleId: labourRole.id } },
    update: {},
    create: { userId: labourUser.id, roleId: labourRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: labourUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: labourUser.id, roleId: userRole.id },
  });

  // -------------------------
  // CREATE SAMPLE CONTRACTOR COMPANY
  // -------------------------
  const amitContractorCompany = await prisma.contractor.upsert({
    where: { id: 'sample-contractor-1' },
    update: {},
    create: {
      id: 'sample-contractor-1',
      name: 'Amit Constructions Pvt Ltd',
      phone: '+919876543212',
      type: 'MAIN',
    },
  });

  // Link contractor user to contractor company
  await prisma.user.update({
    where: { id: contractorUser.id },
    data: { contractorId: amitContractorCompany.id },
  });

  // -------------------------
  // CREATE SAMPLE PROJECT
  // -------------------------
  const sampleProject = await prisma.project.upsert({
    where: { code: 'PROJ-2025-001' },
    update: {},
    create: {
      code: 'PROJ-2025-001',
      name: 'Metro Station Construction - Phase 1',
      location: 'New Delhi, India',
      status: 'ACTIVE',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
    },
  });

  // -------------------------
  // ASSIGN USERS TO PROJECT
  // -------------------------
  
  // Piyush as Project Manager
  await prisma.projectMember.upsert({
    where: { 
      projectId_userId: { 
        projectId: sampleProject.id, 
        userId: piyushUser.id 
      } 
    },
    update: {},
    create: {
      projectId: sampleProject.id,
      userId: piyushUser.id,
      roleId: projectManagerRole.id,
    },
  });

  // Rajesh as Site Engineer
  await prisma.projectMember.upsert({
    where: { 
      projectId_userId: { 
        projectId: sampleProject.id, 
        userId: engineerUser.id 
      } 
    },
    update: {},
    create: {
      projectId: sampleProject.id,
      userId: engineerUser.id,
      roleId: siteEngineerRole.id,
    },
  });

  // Priya as Site Engineer
  await prisma.projectMember.upsert({
    where: { 
      projectId_userId: { 
        projectId: sampleProject.id, 
        userId: engineerUser2.id 
      } 
    },
    update: {},
    create: {
      projectId: sampleProject.id,
      userId: engineerUser2.id,
      roleId: siteEngineerRole.id,
    },
  });

  // Assign contractor to project
  await prisma.projectContractor.upsert({
    where: { 
      projectId_contractorId: { 
        projectId: sampleProject.id, 
        contractorId: amitContractorCompany.id 
      } 
    },
    update: {},
    create: {
      projectId: sampleProject.id,
      contractorId: amitContractorCompany.id,
    },
  });

  // -------------------------
  // CREATE SAMPLE LABOUR PROFILE
  // -------------------------
  await prisma.labour.upsert({
    where: { userId: labourUser.id },
    update: {},
    create: {
      contractorId: amitContractorCompany.id,
      userId: labourUser.id,
      name: 'Ramesh Kumar',
      gender: 'Male',
      age: 35,
      skill: 'MASON',
      phone: '+919876543213',
      aadhaar: '1234-5678-9012',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Sample Users Created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Admin:');
  console.log('   Email: admin@example.com');
  console.log('   Username: admin');
  console.log('   Password: password123');
  console.log('   Role: ADMIN\n');
  
  console.log('2. Project Manager (Piyush):');
  console.log('   Email: piyush.playtech@gmail.com');
  console.log('   Username: piyush');
  console.log('   Password: 123');
  console.log('   Role: PROJECT_MANAGER\n');
  
  console.log('3. Site Engineer (Rajesh):');
  console.log('   Email: engineer@civil.com');
  console.log('   Username: rajesh_engineer');
  console.log('   Password: 123');
  console.log('   Role: SITE_ENGINEER\n');
  
  console.log('4. Site Engineer (Priya):');
  console.log('   Email: priya.engineer@civil.com');
  console.log('   Username: priya_engineer');
  console.log('   Password: 123');
  console.log('   Role: SITE_ENGINEER\n');
  
  console.log('5. Contractor (Amit):');
  console.log('   Email: contractor@civil.com');
  console.log('   Username: amit_contractor');
  console.log('   Password: 123');
  console.log('   Role: CONTRACTOR\n');
  
  console.log('6. Labour (Ramesh):');
  console.log('   Email: labour@civil.com');
  console.log('   Username: ramesh_labour');
  console.log('   Password: 123');
  console.log('   Role: LABOUR\n');
  
  console.log('🏗️  Sample Project Created:');
  console.log('   Project: Metro Station Construction - Phase 1');
  console.log('   Code: PROJ-2025-001');
  console.log('   Location: New Delhi, India');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });