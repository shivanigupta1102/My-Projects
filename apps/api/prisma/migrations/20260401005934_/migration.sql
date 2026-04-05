-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('AMAZON', 'EBAY', 'WALMART', 'SHOPIFY', 'ETSY');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR', 'PENDING_AUTH');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTING', 'BUILDING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'PDF', 'CSV', 'XLSX', 'URL', 'SPREADSHEET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'REVIEW_READY', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('NEEDS_REVIEW', 'IN_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "ExtractionMethod" AS ENUM ('OCR', 'IMAGE_VISION', 'LLM_INFERENCE', 'STRUCTURED_PARSE', 'URL_SCRAPE', 'API_LOOKUP', 'SELLER_CONFIRMED', 'PRIOR_LISTING');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'VALIDATED', 'APPROVED', 'PUBLISHED', 'FAILED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'BLOCKING');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SUPPRESSED', 'ERROR');

-- CreateEnum
CREATE TYPE "RemediationType" AS ENUM ('SUPPRESSION_FIX', 'MISSING_REQUIRED', 'CATEGORY_MISMATCH', 'CONTENT_DRIFT', 'DISCOVERABILITY', 'CONVERSION');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('OPEN', 'APPLIED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "monthlyTokenUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT,
    "credentialsJson" JSONB NOT NULL,
    "status" "AccountStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL,
    "sourceLabel" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceAsset" (
    "id" TEXT NOT NULL,
    "ingestionJobId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksumSha256" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ingestionJobId" TEXT,
    "title" TEXT,
    "brand" TEXT,
    "modelNumber" TEXT,
    "upc" TEXT,
    "ean" TEXT,
    "asin" TEXT,
    "status" "ProductStatus" NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "canonicalJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "attributesJson" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "method" "ExtractionMethod" NOT NULL,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "conflicted" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sourceAssetId" TEXT,
    "attributeId" TEXT,
    "snippet" TEXT,
    "explanation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "regionJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPackage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "status" "PackageStatus" NOT NULL,
    "title" TEXT,
    "bulletsJson" JSONB NOT NULL,
    "description" TEXT,
    "attributesJson" JSONB NOT NULL,
    "keywordsJson" JSONB NOT NULL,
    "imagesJson" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Validation" (
    "id" TEXT NOT NULL,
    "listingPackageId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "message" TEXT NOT NULL,
    "suggestedFix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Validation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "listingPackageId" TEXT,
    "channelAccountId" TEXT,
    "channel" "Channel" NOT NULL,
    "status" "PublishStatus" NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "channelListingId" TEXT,
    "errorMessage" TEXT,
    "rawResponseJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "channelListingId" TEXT NOT NULL,
    "status" "MonitorStatus" NOT NULL,
    "healthScore" DOUBLE PRECISION,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationRecommendation" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "type" "RemediationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "suggestedFixJson" JSONB NOT NULL,
    "status" "RemediationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detailsJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "ChannelAccount_organizationId_idx" ON "ChannelAccount"("organizationId");

-- CreateIndex
CREATE INDEX "ChannelAccount_organizationId_channel_idx" ON "ChannelAccount"("organizationId", "channel");

-- CreateIndex
CREATE INDEX "ChannelAccount_organizationId_status_idx" ON "ChannelAccount"("organizationId", "status");

-- CreateIndex
CREATE INDEX "IngestionJob_organizationId_idx" ON "IngestionJob"("organizationId");

-- CreateIndex
CREATE INDEX "IngestionJob_organizationId_status_idx" ON "IngestionJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SourceAsset_ingestionJobId_idx" ON "SourceAsset"("ingestionJobId");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE INDEX "Product_organizationId_status_idx" ON "Product"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Product_organizationId_reviewStatus_idx" ON "Product"("organizationId", "reviewStatus");

-- CreateIndex
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");

-- CreateIndex
CREATE INDEX "Attribute_productId_idx" ON "Attribute"("productId");

-- CreateIndex
CREATE INDEX "Attribute_productId_fieldName_idx" ON "Attribute"("productId", "fieldName");

-- CreateIndex
CREATE INDEX "Evidence_productId_idx" ON "Evidence"("productId");

-- CreateIndex
CREATE INDEX "Evidence_attributeId_idx" ON "Evidence"("attributeId");

-- CreateIndex
CREATE INDEX "Evidence_sourceAssetId_idx" ON "Evidence"("sourceAssetId");

-- CreateIndex
CREATE INDEX "ListingPackage_productId_idx" ON "ListingPackage"("productId");

-- CreateIndex
CREATE INDEX "ListingPackage_productId_status_idx" ON "ListingPackage"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPackage_productId_channel_key" ON "ListingPackage"("productId", "channel");

-- CreateIndex
CREATE INDEX "Validation_listingPackageId_idx" ON "Validation"("listingPackageId");

-- CreateIndex
CREATE INDEX "Validation_listingPackageId_severity_idx" ON "Validation"("listingPackageId", "severity");

-- CreateIndex
CREATE INDEX "PublishEvent_organizationId_idx" ON "PublishEvent"("organizationId");

-- CreateIndex
CREATE INDEX "PublishEvent_organizationId_status_idx" ON "PublishEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PublishEvent_productId_idx" ON "PublishEvent"("productId");

-- CreateIndex
CREATE INDEX "Monitor_organizationId_idx" ON "Monitor"("organizationId");

-- CreateIndex
CREATE INDEX "Monitor_organizationId_status_idx" ON "Monitor"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Monitor_productId_idx" ON "Monitor"("productId");

-- CreateIndex
CREATE INDEX "RemediationRecommendation_monitorId_idx" ON "RemediationRecommendation"("monitorId");

-- CreateIndex
CREATE INDEX "RemediationRecommendation_monitorId_status_idx" ON "RemediationRecommendation"("monitorId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelAccount" ADD CONSTRAINT "ChannelAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceAsset" ADD CONSTRAINT "SourceAsset_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "IngestionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_ingestionJobId_fkey" FOREIGN KEY ("ingestionJobId") REFERENCES "IngestionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "SourceAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPackage" ADD CONSTRAINT "ListingPackage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_listingPackageId_fkey" FOREIGN KEY ("listingPackageId") REFERENCES "ListingPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishEvent" ADD CONSTRAINT "PublishEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishEvent" ADD CONSTRAINT "PublishEvent_listingPackageId_fkey" FOREIGN KEY ("listingPackageId") REFERENCES "ListingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationRecommendation" ADD CONSTRAINT "RemediationRecommendation_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
