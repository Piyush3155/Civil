# Prisma Schema Organization

This project uses Prisma's multi-file schema feature to organize database models logically.

## Structure

```
prisma/
├── schema.prisma          # Main configuration (generator & datasource)
├── schema/                # Model definitions organized by domain
│   ├── user.prisma       # User management & authentication
│   ├── role.prisma       # Roles & permissions
│   ├── notification.prisma # FCM notifications & device tokens
│   ├── project.prisma    # Project management
│   ├── contractor.prisma # Contractor companies
│   ├── labour.prisma     # Labour profiles
│   ├── drawing.prisma    # Drawings & documents
│   └── projectModel.prisma # 3D models & BIM files
├── migrations/            # Database migrations
└── seed.ts               # Database seeding script
```

## Model Organization

### 📁 **user.prisma**
- `user` - User accounts
- `ForgotPasswordRequest` - Password reset requests
- `ForgotPasswordStatus` enum

### 📁 **role.prisma**
- `Role` - Role definitions
- `UserRole` - User-role assignments
- `CivilUserRole` enum (PROJECT_MANAGER, SITE_ENGINEER, CONTRACTOR, LABOUR)

### 📁 **notification.prisma**
- `UserTokens` - FCM device tokens
- `NotificationHistory` - Notification records
- `FcmDeliveryStatus` - Per-token delivery status
- Related enums: `DeviceType`, `NotificationTargetType`, `NotificationStatus`

### 📁 **project.prisma**
- `Project` - Construction projects
- `ProjectMember` - Project team assignments
- `ProjectStatus` enum

### 📁 **contractor.prisma**
- `Contractor` - Contractor companies
- `ProjectContractor` - Contractor-project assignments
- `ContractorType` enum

### 📁 **labour.prisma**
- `Labour` - Labour profiles (workers)
- `LabourSkill` enum

### 📁 **drawing.prisma**
- `Drawing` - CAD drawings, PDFs, blueprints
- `DrawingAccess` - Permission control per drawing
- `DrawingType` enum (PDF, IMAGE, DWG, DXF, IFC, RVT, GLB, MAP, MP4)

### 📁 **projectModel.prisma**
- `ProjectModel` - 3D models, BIM files, site maps
- `ModelType` enum (SITE_MAP, CAD_3D, BIM_3D, STRUCTURAL_MODEL, etc.)

## Benefits of This Organization

1. **Clear Separation of Concerns** - Each file represents a specific business domain
2. **Easier Navigation** - Find models quickly by domain rather than scrolling through one large file
3. **Better Collaboration** - Team members can work on different domains with fewer merge conflicts
4. **Maintainability** - Changes to one domain don't affect others visually
5. **Documentation** - File organization serves as natural documentation

## Usage

All Prisma commands work the same way:

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name <migration_name>

# View database in Prisma Studio
npx prisma studio

# Format schema files
npx prisma format

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed
```

## Adding New Models

1. Create a new `.prisma` file in the `schema/` folder
2. Define your models with proper relations
3. Run `npx prisma format` to validate
4. Run `npx prisma migrate dev` to create migration

Example:

```prisma
// schema/equipment.prisma

model Equipment {
  id        String   @id @default(cuid())
  name      String
  projectId String
  
  project   Project @relation(fields: [projectId], references: [id])
}
```

## Notes

- The `schema.prisma` file contains only the generator and datasource configuration
- All model definitions are in the `schema/` folder
- Prisma automatically discovers and merges all `.prisma` files in the schema folder
- Cross-file relations work seamlessly (e.g., `user` from `user.prisma` can relate to `Project` from `project.prisma`)
