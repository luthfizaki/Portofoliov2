ALTER TABLE "Testimonial"
ADD COLUMN "initial" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "accent" TEXT NOT NULL DEFAULT 'blue',
ADD COLUMN "featuredLabel" TEXT,
ADD COLUMN "tags" TEXT[];

CREATE INDEX "Testimonial_status_sortOrder_idx" ON "Testimonial"("status", "sortOrder");
CREATE INDEX "Testimonial_projectId_idx" ON "Testimonial"("projectId");
