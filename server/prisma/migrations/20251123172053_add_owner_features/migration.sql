-- CreateEnum
CREATE TYPE "ForgotPasswordStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CivilUserRole" AS ENUM ('PROJECT_MANAGER', 'SITE_ENGINEER', 'CONTRACTOR', 'LABOUR', 'OWNER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ANDROID', 'IOS', 'WEB', 'MAC', 'WINDOWS', 'LINUX', 'DESKTOP', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationTargetType" AS ENUM ('USER', 'MULTIPLE_USERS', 'ROLE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'PARTIALLY_SENT', 'READ', 'DELIVERED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractorType" AS ENUM ('MAIN', 'SUB', 'LABOUR_SUPPLY');

-- CreateEnum
CREATE TYPE "LabourSkill" AS ENUM ('UNSKILLED', 'SEMI_SKILLED', 'SKILLED', 'MASON', 'CARPENTER', 'ELECTRICIAN', 'PLUMBER', 'OPERATOR', 'HELPER');

-- CreateEnum
CREATE TYPE "DrawingCategory" AS ENUM ('LAYOUT', 'STRUCTURAL', 'ARCHITECTURAL', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'MODEL_3D', 'PROGRESS', 'OTHER');

-- CreateEnum
CREATE TYPE "DrawingType" AS ENUM ('PDF', 'IMAGE', 'DWG', 'DXF', 'IFC', 'RVT', 'GLB', 'MAP', 'MP4');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('SITE_MAP', 'CONTOUR_MAP', 'CAD_3D', 'BIM_3D', 'STRUCTURAL_MODEL', 'ARCHITECTURAL_MODEL', 'MEP_MODEL', 'WALKTHROUGH');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiaryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN DEFAULT false,
    "isAdmin" BOOLEAN DEFAULT false,
    "forgotPasswordToken" TEXT,
    "forgotPasswordTokenExpiry" TIMESTAMP(3),
    "verifyToken" TEXT,
    "verifyTokenExpiry" TIMESTAMP(3),
    "expire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "contractorId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForgotPasswordRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "ForgotPasswordStatus" NOT NULL DEFAULT 'PENDING',
    "newPassword" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "reason" TEXT,

    CONSTRAINT "ForgotPasswordRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTokens" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "token" TEXT NOT NULL,
    "deviceType" "DeviceType",
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationHistory" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "targetType" "NotificationTargetType" NOT NULL,
    "targetIds" JSONB NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentById" TEXT,

    CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FcmDeliveryStatus" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "processedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FcmDeliveryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "progress" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "area" TEXT,
    "nextMilestone" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectOwner" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "type" "ContractorType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContractor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,

    CONSTRAINT "ProjectContractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Labour" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "skill" "LabourSkill" NOT NULL,
    "phone" TEXT,
    "aadhaar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Labour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DrawingCategory" NOT NULL DEFAULT 'LAYOUT',
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" "DrawingType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawingAccess" (
    "id" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "roleId" TEXT,
    "userId" TEXT,
    "canView" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DrawingAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectModel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDelivery" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "contractorId" TEXT,
    "supplierName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "challanNumber" TEXT,
    "notes" TEXT,
    "photos" JSONB,
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialUsage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "contractorId" TEXT,
    "labourId" TEXT,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "quantityUsed" DECIMAL(65,30) NOT NULL,
    "usedFor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteDiary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "issues" TEXT,
    "photos" JSONB,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" "DiaryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryLabourLog" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "contractorId" TEXT,
    "labourId" TEXT,
    "count" INTEGER NOT NULL,
    "workDone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaryLabourLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryMaterialLog" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityUsed" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaryMaterialLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryEquipmentLog" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "hoursUsed" DECIMAL(65,30) NOT NULL,
    "operatorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaryEquipmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "ForgotPasswordRequest_userId_idx" ON "ForgotPasswordRequest"("userId");

-- CreateIndex
CREATE INDEX "ForgotPasswordRequest_status_idx" ON "ForgotPasswordRequest"("status");

-- CreateIndex
CREATE INDEX "ForgotPasswordRequest_processedBy_idx" ON "ForgotPasswordRequest"("processedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTokens_userId_deviceId_key" ON "UserTokens"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "NotificationHistory_sentAt_idx" ON "NotificationHistory"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationHistory_targetType_idx" ON "NotificationHistory"("targetType");

-- CreateIndex
CREATE INDEX "NotificationHistory_sentById_idx" ON "NotificationHistory"("sentById");

-- CreateIndex
CREATE INDEX "FcmDeliveryStatus_notificationId_idx" ON "FcmDeliveryStatus"("notificationId");

-- CreateIndex
CREATE INDEX "FcmDeliveryStatus_tokenId_idx" ON "FcmDeliveryStatus"("tokenId");

-- CreateIndex
CREATE INDEX "FcmDeliveryStatus_userId_idx" ON "FcmDeliveryStatus"("userId");

-- CreateIndex
CREATE INDEX "FcmDeliveryStatus_status_idx" ON "FcmDeliveryStatus"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "ProjectMember_roleId_idx" ON "ProjectMember"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectOwner_projectId_idx" ON "ProjectOwner"("projectId");

-- CreateIndex
CREATE INDEX "ProjectOwner_userId_idx" ON "ProjectOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOwner_projectId_userId_key" ON "ProjectOwner"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectContractor_projectId_idx" ON "ProjectContractor"("projectId");

-- CreateIndex
CREATE INDEX "ProjectContractor_contractorId_idx" ON "ProjectContractor"("contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContractor_projectId_contractorId_key" ON "ProjectContractor"("projectId", "contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "Labour_userId_key" ON "Labour"("userId");

-- CreateIndex
CREATE INDEX "Labour_contractorId_idx" ON "Labour"("contractorId");

-- CreateIndex
CREATE INDEX "Labour_userId_idx" ON "Labour"("userId");

-- CreateIndex
CREATE INDEX "Drawing_projectId_idx" ON "Drawing"("projectId");

-- CreateIndex
CREATE INDEX "Drawing_uploadedBy_idx" ON "Drawing"("uploadedBy");

-- CreateIndex
CREATE INDEX "Drawing_fileType_idx" ON "Drawing"("fileType");

-- CreateIndex
CREATE INDEX "DrawingAccess_drawingId_idx" ON "DrawingAccess"("drawingId");

-- CreateIndex
CREATE INDEX "DrawingAccess_roleId_idx" ON "DrawingAccess"("roleId");

-- CreateIndex
CREATE INDEX "DrawingAccess_userId_idx" ON "DrawingAccess"("userId");

-- CreateIndex
CREATE INDEX "ProjectModel_projectId_idx" ON "ProjectModel"("projectId");

-- CreateIndex
CREATE INDEX "ProjectModel_type_idx" ON "ProjectModel"("type");

-- CreateIndex
CREATE INDEX "MaterialDelivery_projectId_idx" ON "MaterialDelivery"("projectId");

-- CreateIndex
CREATE INDEX "MaterialDelivery_materialId_idx" ON "MaterialDelivery"("materialId");

-- CreateIndex
CREATE INDEX "MaterialDelivery_contractorId_idx" ON "MaterialDelivery"("contractorId");

-- CreateIndex
CREATE INDEX "MaterialUsage_projectId_idx" ON "MaterialUsage"("projectId");

-- CreateIndex
CREATE INDEX "MaterialUsage_materialId_idx" ON "MaterialUsage"("materialId");

-- CreateIndex
CREATE INDEX "MaterialUsage_contractorId_idx" ON "MaterialUsage"("contractorId");

-- CreateIndex
CREATE INDEX "MaterialUsage_labourId_idx" ON "MaterialUsage"("labourId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgotPasswordRequest" ADD CONSTRAINT "ForgotPasswordRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForgotPasswordRequest" ADD CONSTRAINT "ForgotPasswordRequest_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTokens" ADD CONSTRAINT "user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmDeliveryStatus" ADD CONSTRAINT "FcmDeliveryStatus_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmDeliveryStatus" ADD CONSTRAINT "FcmDeliveryStatus_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "UserTokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmDeliveryStatus" ADD CONSTRAINT "FcmDeliveryStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOwner" ADD CONSTRAINT "ProjectOwner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectOwner" ADD CONSTRAINT "ProjectOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContractor" ADD CONSTRAINT "ProjectContractor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContractor" ADD CONSTRAINT "ProjectContractor_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labour" ADD CONSTRAINT "Labour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingAccess" ADD CONSTRAINT "DrawingAccess_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "Drawing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingAccess" ADD CONSTRAINT "DrawingAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingAccess" ADD CONSTRAINT "DrawingAccess_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectModel" ADD CONSTRAINT "ProjectModel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialUsage" ADD CONSTRAINT "MaterialUsage_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiary" ADD CONSTRAINT "SiteDiary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiary" ADD CONSTRAINT "SiteDiary_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteDiary" ADD CONSTRAINT "SiteDiary_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryLabourLog" ADD CONSTRAINT "DiaryLabourLog_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "SiteDiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryLabourLog" ADD CONSTRAINT "DiaryLabourLog_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryLabourLog" ADD CONSTRAINT "DiaryLabourLog_labourId_fkey" FOREIGN KEY ("labourId") REFERENCES "Labour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryMaterialLog" ADD CONSTRAINT "DiaryMaterialLog_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "SiteDiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryMaterialLog" ADD CONSTRAINT "DiaryMaterialLog_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEquipmentLog" ADD CONSTRAINT "DiaryEquipmentLog_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "SiteDiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
