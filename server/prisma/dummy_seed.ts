import { PrismaClient, Material, EquipmentCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Common password for all users
const COMMON_PASSWORD = 'password@123';

async function main() {
  console.log('🚀 Starting Dummy Data Seeding...\n');

  const hashedPassword = await bcrypt.hash(COMMON_PASSWORD, 10);

  // -------------------------
  // CREATE ROLES
  // -------------------------
  console.log('📝 Creating Roles...');

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

  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: {
      name: 'CLIENT',
      description: 'Client/Owner - monitors project progress and approves milestones',
    },
  });

  console.log('✅ Roles created successfully!\n');

  // -------------------------
  // CREATE USERS FOR EACH ROLE
  // -------------------------
  console.log('👥 Creating Users...');

  // 1. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@civilproject.com' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      email: 'admin@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: true,
      phone: '+91-9000000001',
    },
  });

  // 2. Project Manager Users
  const pmUser1 = await prisma.user.upsert({
    where: { email: 'pm1@civilproject.com' },
    update: {},
    create: {
      name: 'Rajiv Mehta',
      username: 'rajiv_pm',
      email: 'pm1@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000002',
    },
  });

  const pmUser2 = await prisma.user.upsert({
    where: { email: 'pm2@civilproject.com' },
    update: {},
    create: {
      name: 'Anita Sharma',
      username: 'anita_pm',
      email: 'pm2@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000003',
    },
  });

  // 3. Site Engineer Users
  const engineerUser1 = await prisma.user.upsert({
    where: { email: 'engineer1@civilproject.com' },
    update: {},
    create: {
      name: 'Vikram Singh',
      username: 'vikram_eng',
      email: 'engineer1@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000004',
    },
  });

  const engineerUser2 = await prisma.user.upsert({
    where: { email: 'engineer2@civilproject.com' },
    update: {},
    create: {
      name: 'Priya Verma',
      username: 'priya_eng',
      email: 'engineer2@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000005',
    },
  });

  const engineerUser3 = await prisma.user.upsert({
    where: { email: 'engineer3@civilproject.com' },
    update: {},
    create: {
      name: 'Suresh Kumar',
      username: 'suresh_eng',
      email: 'engineer3@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000006',
    },
  });

  // 4. Contractor Users
  const contractorUser1 = await prisma.user.upsert({
    where: { email: 'contractor1@civilproject.com' },
    update: {},
    create: {
      name: 'Amit Constructions',
      username: 'amit_contractor_dummy',
      email: 'contractor1@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000007',
    },
  });

  const contractorUser2 = await prisma.user.upsert({
    where: { email: 'contractor2@civilproject.com' },
    update: {},
    create: {
      name: 'Sharma Builders',
      username: 'sharma_contractor_dummy',
      email: 'contractor2@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000008',
    },
  });

  // 5. Labour Users
  const labourUser1 = await prisma.user.upsert({
    where: { email: 'labour1@civilproject.com' },
    update: {},
    create: {
      name: 'Ramesh Kumar',
      username: 'ramesh_labour_dummy',
      email: 'labour1@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000009',
    },
  });

  const labourUser2 = await prisma.user.upsert({
    where: { email: 'labour2@civilproject.com' },
    update: {},
    create: {
      name: 'Sunil Mason',
      username: 'sunil_labour_dummy',
      email: 'labour2@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000010',
    },
  });

  const labourUser3 = await prisma.user.upsert({
    where: { email: 'labour3@civilproject.com' },
    update: {},
    create: {
      name: 'Raju Electrician',
      username: 'raju_labour_dummy',
      email: 'labour3@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000011',
    },
  });

  // 6. Client Users
  const clientUser1 = await prisma.user.upsert({
    where: { email: 'client1@civilproject.com' },
    update: {},
    create: {
      name: 'Mr. Arun Kapoor',
      username: 'arun_client',
      email: 'client1@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000012',
    },
  });

  const clientUser2 = await prisma.user.upsert({
    where: { email: 'client2@civilproject.com' },
    update: {},
    create: {
      name: 'Mrs. Sunita Devi',
      username: 'sunita_client',
      email: 'client2@civilproject.com',
      password: hashedPassword,
      isVerified: true,
      isAdmin: false,
      phone: '+91-9000000013',
    },
  });

  console.log('✅ Users created successfully!\n');

  // -------------------------
  // ASSIGN ROLES TO USERS
  // -------------------------
  console.log('🔗 Assigning Roles to Users...');

  // Admin roles
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

  // Project Manager roles
  for (const pmUser of [pmUser1, pmUser2]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: pmUser.id, roleId: projectManagerRole.id } },
      update: {},
      create: { userId: pmUser.id, roleId: projectManagerRole.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: pmUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: pmUser.id, roleId: userRole.id },
    });
  }

  // Site Engineer roles
  for (const engUser of [engineerUser1, engineerUser2, engineerUser3]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: engUser.id, roleId: siteEngineerRole.id } },
      update: {},
      create: { userId: engUser.id, roleId: siteEngineerRole.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: engUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: engUser.id, roleId: userRole.id },
    });
  }

  // Contractor roles
  for (const contUser of [contractorUser1, contractorUser2]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: contUser.id, roleId: contractorRole.id } },
      update: {},
      create: { userId: contUser.id, roleId: contractorRole.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: contUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: contUser.id, roleId: userRole.id },
    });
  }

  // Labour roles
  for (const labUser of [labourUser1, labourUser2, labourUser3]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: labUser.id, roleId: labourRole.id } },
      update: {},
      create: { userId: labUser.id, roleId: labourRole.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: labUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: labUser.id, roleId: userRole.id },
    });
  }

  // Client roles
  for (const cliUser of [clientUser1, clientUser2]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: cliUser.id, roleId: clientRole.id } },
      update: {},
      create: { userId: cliUser.id, roleId: clientRole.id },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: cliUser.id, roleId: userRole.id } },
      update: {},
      create: { userId: cliUser.id, roleId: userRole.id },
    });
  }

  console.log('✅ Roles assigned successfully!\n');

  // -------------------------
  // CREATE CONTRACTOR COMPANIES
  // -------------------------
  console.log('🏗️ Creating Contractor Companies...');

  const contractor1 = await prisma.contractor.upsert({
    where: { id: 'contractor-amit-001' },
    update: {},
    create: {
      id: 'contractor-amit-001',
      name: 'Amit Constructions Pvt Ltd',
      phone: '+91-9000000007',
      type: 'MAIN',
    },
  });

  const contractor2 = await prisma.contractor.upsert({
    where: { id: 'contractor-sharma-002' },
    update: {},
    create: {
      id: 'contractor-sharma-002',
      name: 'Sharma Builders & Co',
      phone: '+91-9000000008',
      type: 'SUB',
    },
  });

  const contractor3 = await prisma.contractor.upsert({
    where: { id: 'contractor-labour-003' },
    update: {},
    create: {
      id: 'contractor-labour-003',
      name: 'Krishna Labour Supply',
      phone: '+91-9000000014',
      type: 'LABOUR_SUPPLY',
    },
  });

  // Link contractor users to companies
  await prisma.user.update({
    where: { id: contractorUser1.id },
    data: { contractorId: contractor1.id },
  });
  await prisma.user.update({
    where: { id: contractorUser2.id },
    data: { contractorId: contractor2.id },
  });

  console.log('✅ Contractor companies created successfully!\n');

  // -------------------------
  // CREATE PROJECTS
  // -------------------------
  console.log('📂 Creating Projects...');

  const project1 = await prisma.project.upsert({
    where: { code: 'PROJ-2026-001' },
    update: {},
    create: {
      code: 'PROJ-2026-001',
      name: 'Skyline Residency - Tower A',
      location: 'Sector 50, Noida, UP',
      area: '50000 sq.ft',
      progress: 35.50,
      status: 'ACTIVE',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2027-06-30'),
      nextMilestone: 'Foundation Complete',
      milestoneDate: new Date('2026-03-15'),
    },
  });

  const project2 = await prisma.project.upsert({
    where: { code: 'PROJ-2026-002' },
    update: {},
    create: {
      code: 'PROJ-2026-002',
      name: 'Green Valley Commercial Complex',
      location: 'MG Road, Gurugram, Haryana',
      area: '75000 sq.ft',
      progress: 15.00,
      status: 'ACTIVE',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2028-03-31'),
      nextMilestone: 'Excavation Complete',
      milestoneDate: new Date('2026-02-28'),
    },
  });

  const project3 = await prisma.project.upsert({
    where: { code: 'PROJ-2025-003' },
    update: {},
    create: {
      code: 'PROJ-2025-003',
      name: 'Metro Station - Phase 2 Extension',
      location: 'Connaught Place, New Delhi',
      area: '120000 sq.ft',
      progress: 85.00,
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-06-30'),
      nextMilestone: 'Final Finishing',
      milestoneDate: new Date('2026-04-30'),
    },
  });

  console.log('✅ Projects created successfully!\n');

  // -------------------------
  // ASSIGN PROJECT MEMBERS
  // -------------------------
  console.log('👷 Assigning Project Members...');

  // Project 1 - Skyline Residency
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: pmUser1.id } },
    update: {},
    create: { projectId: project1.id, userId: pmUser1.id, roleId: projectManagerRole.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: engineerUser1.id } },
    update: {},
    create: { projectId: project1.id, userId: engineerUser1.id, roleId: siteEngineerRole.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: engineerUser2.id } },
    update: {},
    create: { projectId: project1.id, userId: engineerUser2.id, roleId: siteEngineerRole.id },
  });

  // Project 2 - Green Valley
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: pmUser2.id } },
    update: {},
    create: { projectId: project2.id, userId: pmUser2.id, roleId: projectManagerRole.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: engineerUser3.id } },
    update: {},
    create: { projectId: project2.id, userId: engineerUser3.id, roleId: siteEngineerRole.id },
  });

  // Project 3 - Metro Station
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project3.id, userId: pmUser1.id } },
    update: {},
    create: { projectId: project3.id, userId: pmUser1.id, roleId: projectManagerRole.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project3.id, userId: engineerUser1.id } },
    update: {},
    create: { projectId: project3.id, userId: engineerUser1.id, roleId: siteEngineerRole.id },
  });

  // Assign Project Owners (Clients)
  await prisma.projectOwner.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: clientUser1.id } },
    update: {},
    create: { projectId: project1.id, userId: clientUser1.id },
  });
  await prisma.projectOwner.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: clientUser2.id } },
    update: {},
    create: { projectId: project2.id, userId: clientUser2.id },
  });

  // Assign Contractors to Projects
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project1.id, contractorId: contractor1.id } },
    update: {},
    create: { projectId: project1.id, contractorId: contractor1.id },
  });
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project1.id, contractorId: contractor3.id } },
    update: {},
    create: { projectId: project1.id, contractorId: contractor3.id },
  });
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project2.id, contractorId: contractor2.id } },
    update: {},
    create: { projectId: project2.id, contractorId: contractor2.id },
  });
  await prisma.projectContractor.upsert({
    where: { projectId_contractorId: { projectId: project3.id, contractorId: contractor1.id } },
    update: {},
    create: { projectId: project3.id, contractorId: contractor1.id },
  });

  console.log('✅ Project members assigned successfully!\n');

  // -------------------------
  // CREATE LABOUR PROFILES
  // -------------------------
  console.log('👷 Creating Labour Profiles...');

  await prisma.labour.upsert({
    where: { userId: labourUser1.id },
    update: {},
    create: {
      contractorId: contractor1.id,
      userId: labourUser1.id,
      name: 'Ramesh Kumar',
      gender: 'Male',
      age: 32,
      skill: 'SKILLED',
      phone: '+91-9000000009',
      aadhaar: '1234-5678-9001',
    },
  });

  await prisma.labour.upsert({
    where: { userId: labourUser2.id },
    update: {},
    create: {
      contractorId: contractor1.id,
      userId: labourUser2.id,
      name: 'Sunil Kumar',
      gender: 'Male',
      age: 28,
      skill: 'MASON',
      phone: '+91-9000000010',
      aadhaar: '1234-5678-9002',
    },
  });

  await prisma.labour.upsert({
    where: { userId: labourUser3.id },
    update: {},
    create: {
      contractorId: contractor2.id,
      userId: labourUser3.id,
      name: 'Raju Singh',
      gender: 'Male',
      age: 35,
      skill: 'ELECTRICIAN',
      phone: '+91-9000000011',
      aadhaar: '1234-5678-9003',
    },
  });

  console.log('✅ Labour profiles created successfully!\n');

  // -------------------------
  // CREATE MATERIALS
  // -------------------------
  console.log('📦 Creating Materials...');

  const materials = [
    { name: 'Cement (OPC 53 Grade)', unit: 'BAG', description: 'Ordinary Portland Cement 53 Grade - 50kg bag' },
    { name: 'Steel TMT Bars (8mm)', unit: 'KG', description: 'TMT Steel Reinforcement Bars 8mm diameter' },
    { name: 'Steel TMT Bars (12mm)', unit: 'KG', description: 'TMT Steel Reinforcement Bars 12mm diameter' },
    { name: 'Steel TMT Bars (16mm)', unit: 'KG', description: 'TMT Steel Reinforcement Bars 16mm diameter' },
    { name: 'River Sand', unit: 'CFT', description: 'Fine aggregate river sand for construction' },
    { name: 'Crushed Stone (20mm)', unit: 'CFT', description: 'Coarse aggregate crushed stone 20mm' },
    { name: 'Crushed Stone (10mm)', unit: 'CFT', description: 'Coarse aggregate crushed stone 10mm' },
    { name: 'AAC Blocks (4 inch)', unit: 'PCS', description: 'Autoclaved Aerated Concrete Blocks 4 inch' },
    { name: 'AAC Blocks (6 inch)', unit: 'PCS', description: 'Autoclaved Aerated Concrete Blocks 6 inch' },
    { name: 'Red Bricks', unit: 'PCS', description: 'Standard clay red bricks' },
    { name: 'PVC Pipes (4 inch)', unit: 'PCS', description: 'PVC drainage pipes 4 inch diameter' },
    { name: 'Electrical Conduit (25mm)', unit: 'MTR', description: 'PVC electrical conduit 25mm' },
    { name: 'Copper Wire (1.5 sqmm)', unit: 'MTR', description: 'Copper electrical wire 1.5 sqmm' },
    { name: 'Ready Mix Concrete M30', unit: 'CUM', description: 'RMC M30 grade concrete' },
    { name: 'Wall Putty', unit: 'KG', description: 'White cement based wall putty' },
  ];

  const createdMaterials: Material[] = [];
  for (const mat of materials) {
    const material = await prisma.material.upsert({
      where: { id: mat.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      update: {},
      create: {
        id: mat.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...mat,
      },
    });
    createdMaterials.push(material);
  }

  console.log('✅ Materials created successfully!\n');

  // -------------------------
  // CREATE SUPPLIERS
  // -------------------------
  console.log('🏪 Creating Suppliers...');

  const supplier1 = await prisma.supplier.upsert({
    where: { id: 'supplier-ultratech-001' },
    update: {},
    create: {
      id: 'supplier-ultratech-001',
      name: 'UltraTech Cement Ltd',
      contactName: 'Rajesh Agarwal',
      phone: '+91-9500000001',
      email: 'rajesh@ultratech.com',
      address: 'Industrial Area, Noida',
      gstNumber: '09AAACI1234A1Z5',
      rating: 4.5,
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 'supplier-tata-steel-002' },
    update: {},
    create: {
      id: 'supplier-tata-steel-002',
      name: 'Tata Steel Distributors',
      contactName: 'Amit Jain',
      phone: '+91-9500000002',
      email: 'amit@tatasteel.com',
      address: 'Steel Market, Faridabad',
      gstNumber: '06AABCT1234B1Z6',
      rating: 4.8,
      isActive: true,
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { id: 'supplier-acc-003' },
    update: {},
    create: {
      id: 'supplier-acc-003',
      name: 'ACC Building Materials',
      contactName: 'Suresh Gupta',
      phone: '+91-9500000003',
      email: 'suresh@acc.com',
      address: 'Construction Hub, Ghaziabad',
      gstNumber: '09AAACC1234C1Z7',
      rating: 4.2,
      isActive: true,
    },
  });

  console.log('✅ Suppliers created successfully!\n');

  // -------------------------
  // CREATE EQUIPMENT CATEGORIES
  // -------------------------
  console.log('🔧 Creating Equipment Categories...');

  const equipmentCategories = [
    { name: 'Earthmoving', description: 'Excavators, Loaders, Bulldozers' },
    { name: 'Concrete', description: 'Mixers, Batching Plants, Pumps' },
    { name: 'Lifting', description: 'Cranes, Hoists, Forklifts' },
    { name: 'Compaction', description: 'Rollers, Plate Compactors, Rammers' },
    { name: 'Surveying', description: 'Total Stations, Levels, GPS' },
    { name: 'Power Tools', description: 'Drills, Grinders, Cutters' },
  ];

  const createdCategories: EquipmentCategory[] = [];
  for (const cat of equipmentCategories) {
    const category = await prisma.equipmentCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  console.log('✅ Equipment categories created successfully!\n');

  // -------------------------
  // CREATE EQUIPMENT
  // -------------------------
  console.log('🚜 Creating Equipment...');

  const earthmovingCategory = createdCategories.find(c => c.name === 'Earthmoving');
  const concreteCategory = createdCategories.find(c => c.name === 'Concrete');
  const liftingCategory = createdCategories.find(c => c.name === 'Lifting');

  if (earthmovingCategory && concreteCategory && liftingCategory) {
    await prisma.equipment.upsert({
      where: { id: 'equip-excavator-001' },
      update: {},
      create: {
        id: 'equip-excavator-001',
        name: 'JCB Excavator',
        model: 'JCB 3DX',
        capacity: '3.5 Ton',
        status: 'IN_USE',
        rental: true,
        rentalVendor: 'ABC Rentals',
        rentalRate: 5000.00,
        categoryId: earthmovingCategory.id,
        projectId: project1.id,
        createdById: pmUser1.id,
      },
    });

    await prisma.equipment.upsert({
      where: { id: 'equip-mixer-001' },
      update: {},
      create: {
        id: 'equip-mixer-001',
        name: 'Concrete Mixer',
        model: 'Schwing Stetter AM 6 C',
        capacity: '6 Cubic Meter',
        status: 'AVAILABLE',
        rental: false,
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 850000.00,
        categoryId: concreteCategory.id,
        projectId: project1.id,
        createdById: pmUser1.id,
      },
    });

    await prisma.equipment.upsert({
      where: { id: 'equip-crane-001' },
      update: {},
      create: {
        id: 'equip-crane-001',
        name: 'Tower Crane',
        model: 'Potain MC 85 B',
        capacity: '5 Ton',
        status: 'IN_USE',
        rental: true,
        rentalVendor: 'Heavy Lift India',
        rentalRate: 25000.00,
        categoryId: liftingCategory.id,
        projectId: project3.id,
        createdById: pmUser1.id,
      },
    });
  }

  console.log('✅ Equipment created successfully!\n');

  // -------------------------
  // CREATE EXPENSE CATEGORIES
  // -------------------------
  console.log('💰 Creating Expense Categories...');

  const expenseCategories = [
    'Labour Wages',
    'Material Purchase',
    'Equipment Rental',
    'Transportation',
    'Site Utilities',
    'Miscellaneous',
    'Professional Fees',
    'Insurance',
  ];

  for (const catName of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
  }

  console.log('✅ Expense categories created successfully!\n');

  // -------------------------
  // CREATE SAMPLE TASKS
  // -------------------------
  console.log('📋 Creating Sample Tasks...');

  const sampleTasks = [
    { title: 'Site Preparation & Clearing', category: 'PRE_CONSTRUCTION', weightage: 2.0, status: 'COMPLETED' },
    { title: 'Soil Testing & Analysis', category: 'PRE_CONSTRUCTION', weightage: 1.5, status: 'COMPLETED' },
    { title: 'Foundation Excavation', category: 'FOUNDATION', weightage: 5.0, status: 'COMPLETED' },
    { title: 'PCC Laying', category: 'FOUNDATION', weightage: 3.0, status: 'COMPLETED' },
    { title: 'Footing Reinforcement', category: 'FOUNDATION', weightage: 5.0, status: 'IN_PROGRESS' },
    { title: 'Footing Concrete', category: 'FOUNDATION', weightage: 5.0, status: 'PENDING' },
    { title: 'Plinth Beam Work', category: 'PLINTH', weightage: 4.0, status: 'PENDING' },
    { title: 'Column Casting - Ground Floor', category: 'STRUCTURE', weightage: 8.0, status: 'PENDING' },
  ];

  for (const task of sampleTasks) {
    const existingTask = await prisma.task.findFirst({
      where: { projectId: project1.id, title: task.title },
    });

    if (!existingTask) {
      await prisma.task.create({
        data: {
          projectId: project1.id,
          title: task.title,
          category: task.category as any,
          weightage: task.weightage,
          status: task.status as any,
          description: `${task.title} - construction phase`,
          createdBy: pmUser1.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });
    }
  }

  console.log('✅ Sample tasks created successfully!\n');

  // -------------------------
  // PRINT SUMMARY
  // -------------------------
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    🎉 SEED DATA CREATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('🔐 COMMON PASSWORD FOR ALL USERS: ' + COMMON_PASSWORD);
  console.log('\n📋 USER CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔴 ADMIN:');
  console.log('   Email: admin@civilproject.com');
  console.log('   Username: superadmin');
  console.log('   Role: ADMIN\n');
  
  console.log('🔵 PROJECT MANAGERS:');
  console.log('   1. Email: pm1@civilproject.com | Username: rajiv_pm | Name: Rajiv Mehta');
  console.log('   2. Email: pm2@civilproject.com | Username: anita_pm | Name: Anita Sharma\n');
  
  console.log('🟢 SITE ENGINEERS:');
  console.log('   1. Email: engineer1@civilproject.com | Username: vikram_eng | Name: Vikram Singh');
  console.log('   2. Email: engineer2@civilproject.com | Username: priya_eng | Name: Priya Verma');
  console.log('   3. Email: engineer3@civilproject.com | Username: suresh_eng | Name: Suresh Kumar\n');
  
  console.log('🟠 CONTRACTORS:');
  console.log('   1. Email: contractor1@civilproject.com | Username: amit_contractor_dummy | Company: Amit Constructions');
  console.log('   2. Email: contractor2@civilproject.com | Username: sharma_contractor_dummy | Company: Sharma Builders\n');
  
  console.log('🟡 LABOUR:');
  console.log('   1. Email: labour1@civilproject.com | Username: ramesh_labour_dummy | Name: Ramesh Kumar | Skill: SKILLED');
  console.log('   2. Email: labour2@civilproject.com | Username: sunil_labour_dummy | Name: Sunil Mason | Skill: MASON');
  console.log('   3. Email: labour3@civilproject.com | Username: raju_labour_dummy | Name: Raju Electrician | Skill: ELECTRICIAN\n');
  
  console.log('🟣 CLIENTS:');
  console.log('   1. Email: client1@civilproject.com | Username: arun_client | Name: Mr. Arun Kapoor');
  console.log('   2. Email: client2@civilproject.com | Username: sunita_client | Name: Mrs. Sunita Devi\n');
  
  console.log('🏗️ SAMPLE PROJECTS:');
  console.log('   1. Skyline Residency - Tower A (PROJ-2026-001) - 35.5% Progress');
  console.log('   2. Green Valley Commercial Complex (PROJ-2026-002) - 15% Progress');
  console.log('   3. Metro Station - Phase 2 Extension (PROJ-2025-003) - 85% Progress\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 Run: npx prisma db seed to execute the seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
