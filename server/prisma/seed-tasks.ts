import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const constructionTasks = [
  // PHASE 1 — PRE-CONSTRUCTION (5%)
  {
    title: "Site Survey & Measurement",
    weightage: 1.0,
    category: "PRE_CONSTRUCTION",
    description: "Conduct detailed site survey and measurements for accurate planning"
  },
  {
    title: "Soil Test & Report",
    weightage: 1.0,
    category: "PRE_CONSTRUCTION",
    description: "Perform soil testing and analysis for foundation design"
  },
  {
    title: "Architectural Design Finalization",
    weightage: 1.5,
    category: "PRE_CONSTRUCTION",
    description: "Finalize architectural drawings and specifications"
  },
  {
    title: "Structural Design (Footing + Column + Slab)",
    weightage: 1.0,
    category: "PRE_CONSTRUCTION",
    description: "Complete structural engineering design and calculations"
  },
  {
    title: "Government / Municipal Approvals",
    weightage: 0.5,
    category: "PRE_CONSTRUCTION",
    description: "Obtain all necessary permits and approvals from authorities"
  },

  // PHASE 2 — FOUNDATION (10%)
  {
    title: "Site Clearing & Excavation",
    weightage: 2.0,
    category: "FOUNDATION",
    description: "Clear site vegetation and excavate for foundation work"
  },
  {
    title: "Line-Out & Marking",
    weightage: 0.5,
    category: "FOUNDATION",
    description: "Mark foundation layout lines and levels"
  },
  {
    title: "PCC (Plain Cement Concrete)",
    weightage: 0.5,
    category: "FOUNDATION",
    description: "Lay plain cement concrete base for foundation"
  },
  {
    title: "Footing Reinforcement",
    weightage: 2.0,
    category: "FOUNDATION",
    description: "Install reinforcement steel for footings"
  },
  {
    title: "Footing Concrete Work",
    weightage: 3.0,
    category: "FOUNDATION",
    description: "Pour and cure footing concrete"
  },
  {
    title: "Backfilling & Compaction",
    weightage: 2.0,
    category: "FOUNDATION",
    description: "Backfill excavated areas and compact soil"
  },

  // PHASE 3 — PLINTH WORK (5%)
  {
    title: "Plinth Beam Shuttering + Steel",
    weightage: 2.0,
    category: "PLINTH",
    description: "Install formwork and reinforcement for plinth beams"
  },
  {
    title: "Plinth Beam Concrete",
    weightage: 2.0,
    category: "PLINTH",
    description: "Pour and cure plinth beam concrete"
  },
  {
    title: "DPC (Damp Proof Course)",
    weightage: 1.0,
    category: "PLINTH",
    description: "Install damp proof course above plinth level"
  },

  // PHASE 4 — STRUCTURE WORK (35%)
  {
    title: "Ground Floor Column Reinforcement + Concrete",
    weightage: 4.0,
    category: "STRUCTURE",
    description: "Install reinforcement and pour concrete for ground floor columns"
  },
  {
    title: "Ground Floor Beam Shuttering + Steel",
    weightage: 4.0,
    category: "STRUCTURE",
    description: "Install formwork and reinforcement for ground floor beams"
  },
  {
    title: "Ground Floor Slab Shuttering + Steel",
    weightage: 6.0,
    category: "STRUCTURE",
    description: "Install formwork and reinforcement for ground floor slab"
  },
  {
    title: "Ground Floor Slab Concrete",
    weightage: 3.0,
    category: "STRUCTURE",
    description: "Pour and cure ground floor slab concrete"
  },
  {
    title: "First Floor Column Reinforcement + Concrete",
    weightage: 3.0,
    category: "STRUCTURE",
    description: "Install reinforcement and pour concrete for first floor columns"
  },
  {
    title: "First Floor Beam + Slab Shuttering + Steel",
    weightage: 6.0,
    category: "STRUCTURE",
    description: "Install formwork and reinforcement for first floor beams and slab"
  },
  {
    title: "First Floor Slab Concrete",
    weightage: 3.0,
    category: "STRUCTURE",
    description: "Pour and cure first floor slab concrete"
  },
  {
    title: "Staircase Casting",
    weightage: 2.0,
    category: "STRUCTURE",
    description: "Construct staircase with formwork, reinforcement and concrete"
  },
  {
    title: "Roof Parapet Wall + Waterproofing",
    weightage: 4.0,
    category: "STRUCTURE",
    description: "Build parapet walls and apply waterproofing"
  },

  // PHASE 5 — BRICK / BLOCK WORK (10%)
  {
    title: "External Wall Masonry",
    weightage: 4.0,
    category: "MASONRY",
    description: "Construct external brick/block walls"
  },
  {
    title: "Internal Wall Masonry",
    weightage: 4.0,
    category: "MASONRY",
    description: "Construct internal brick/block walls and partitions"
  },
  {
    title: "Lintel Casting / Chajja",
    weightage: 2.0,
    category: "MASONRY",
    description: "Cast lintels and chajjas above openings"
  },

  // PHASE 6 — PLASTERING & PUTTY (10%)
  {
    title: "Internal Plaster",
    weightage: 4.0,
    category: "PLASTERING",
    description: "Apply internal wall plastering"
  },
  {
    title: "External Plaster",
    weightage: 3.0,
    category: "PLASTERING",
    description: "Apply external wall plastering"
  },
  {
    title: "Wall Putty (2 coats)",
    weightage: 3.0,
    category: "PLASTERING",
    description: "Apply two coats of wall putty for smooth finish"
  },

  // PHASE 7 — ELECTRICAL & PLUMBING (10%)
  {
    title: "Electrical Conduiting (Internal Wiring)",
    weightage: 3.0,
    category: "ELECTRICAL",
    description: "Install electrical conduits and internal wiring"
  },
  {
    title: "Plumbing Work (Water + Drainage Lines)",
    weightage: 3.0,
    category: "PLUMBING",
    description: "Install water supply and drainage piping"
  },
  {
    title: "Bathroom Waterproofing",
    weightage: 2.0,
    category: "PLUMBING",
    description: "Apply waterproofing treatment in bathrooms"
  },
  {
    title: "Switchboard + DB Installation",
    weightage: 2.0,
    category: "ELECTRICAL",
    description: "Install main switchboard and distribution boards"
  },

  // PHASE 8 — FLOORING & TILES (8%)
  {
    title: "Flooring – Ground Floor",
    weightage: 4.0,
    category: "FLOORING",
    description: "Install flooring material on ground floor"
  },
  {
    title: "Bathroom Wall/Floor Tiling",
    weightage: 2.0,
    category: "FLOORING",
    description: "Install ceramic tiles in bathrooms"
  },
  {
    title: "Kitchen Platform + Wall Tiles",
    weightage: 2.0,
    category: "FLOORING",
    description: "Install kitchen platform and wall tiles"
  },

  // PHASE 9 — DOORS & WINDOWS (4%)
  {
    title: "Window Fixing (Aluminium/UPVC)",
    weightage: 2.0,
    category: "DOORS_WINDOWS",
    description: "Install aluminium or UPVC windows"
  },
  {
    title: "Door Frames + Shutters",
    weightage: 2.0,
    category: "DOORS_WINDOWS",
    description: "Install door frames and shutters"
  },

  // PHASE 10 — PAINTING & FINISHING (5%)
  {
    title: "Interior Painting",
    weightage: 3.0,
    category: "PAINTING",
    description: "Apply interior wall painting"
  },
  {
    title: "Exterior Painting",
    weightage: 2.0,
    category: "PAINTING",
    description: "Apply exterior wall painting"
  },
];

async function seedTasksForProject(projectId: string) {
  console.log(`Seeding tasks for project ${projectId}...`);

  // Get an admin user to set as creator
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true }
  });

  if (!adminUser) {
    throw new Error('No admin user found. Please create an admin user first.');
  }

  const tasksWithProject = constructionTasks.map((task, index) => ({
    ...task,
    projectId,
    category: task.category as any,
    createdBy: adminUser.id,
    status: 'PENDING' as const,
  }));

  await prisma.task.createMany({
    data: tasksWithProject,
  });

  console.log(`Created ${constructionTasks.length} tasks for project ${projectId}`);
}

async function main() {
  // Get all projects
  const projects = await prisma.project.findMany();

  if (projects.length === 0) {
    console.log('No projects found. Please create a project first.');
    return;
  }

  for (const project of projects) {
    // Check if tasks already exist for this project
    const existingTasks = await prisma.task.findMany({
      where: { projectId: project.id }
    });

    if (existingTasks.length === 0) {
      await seedTasksForProject(project.id);
    } else {
      console.log(`Tasks already exist for project ${project.id} (${project.name})`);
    }
  }

  console.log('Task seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });