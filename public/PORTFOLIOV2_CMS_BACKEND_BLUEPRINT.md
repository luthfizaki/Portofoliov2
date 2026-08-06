# PORTFOLIO V2 — CMS & Backend Development Blueprint

> Dokumen teknis untuk membangun ulang CMS Portfolio V2, memigrasikan penyimpanan JSON ke PostgreSQL, dan menjadikan seluruh konten portfolio lebih dinamis tanpa mengubah karakter visual utama website.

---

## 1. Tujuan Pengembangan

CMS baru harus memungkinkan pemilik portfolio mengelola hampir seluruh konten tanpa mengubah kode secara manual.

Target utamanya:

1. Mengelola halaman utama Portfolio V2.
2. Mengelola project archive dan detail case study.
3. Mengatur urutan section menggunakan drag-and-drop.
4. Menyimpan data secara permanen di PostgreSQL.
5. Mendukung draft, preview, publish, schedule, dan archive.
6. Mengelola media gambar, video, thumbnail, dan dokumen.
7. Menjaga tampilan CMS tetap konsisten dengan konsep visual Portfolio V2.
8. Menyediakan REST API yang aman dan mudah dikembangkan.
9. Memindahkan konten CMS lama yang masih menggunakan file JSON.
10. Memisahkan frontend portfolio, CMS, dan backend tanpa keluar dari folder `PORTFOLIOV2`.

---

## 2. Keputusan Arsitektur

### Stack yang digunakan

| Bagian | Teknologi |
|---|---|
| Portfolio Frontend | Next.js App Router + TypeScript |
| CMS Admin | Next.js App Router + TypeScript |
| Styling CMS | Tailwind CSS + komponen UI reusable |
| Backend API | NestJS REST API |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Form | React Hook Form + Zod |
| Data Fetching CMS | TanStack Query |
| Authentication | JWT access token + rotating refresh token |
| Password Hashing | Argon2id |
| File Storage | S3-compatible storage / Cloudinary |
| Local Database | Docker Compose |
| API Documentation | Swagger / OpenAPI |
| Package Manager | pnpm workspace |
| Testing | Vitest/Jest + Playwright |
| Deployment | Frontend/CMS dan API dipisahkan sebagai service berbeda |

### Mengapa backend dipisahkan?

Backend terpisah lebih cocok karena:

- CMS dan portfolio menggunakan sumber data yang sama.
- API dapat dikembangkan tanpa bergantung pada proses render Next.js.
- Autentikasi, media, audit log, revision, dan permission lebih mudah dikelola.
- Website publik tetap ringan.
- Backend dapat digunakan kembali untuk aplikasi lain.
- Kesalahan dari penyimpanan file JSON tidak lagi terjadi pada environment deployment.

---

## 3. Struktur Folder

Struktur ini tetap berada di dalam repository `PORTFOLIOV2`.

```text
PORTFOLIOV2/
│
├── app/                         # Existing Next.js App Router portfolio
├── src/                         # Existing source, jika digunakan
├── public/
├── package.json                 # Existing portfolio package
│
├── cms-admin/                   # CMS baru, hasil clone dan refactor CMS lama
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── pages/
│   │   │   ├── experience/
│   │   │   ├── skills/
│   │   │   ├── testimonials/
│   │   │   ├── media/
│   │   │   ├── messages/
│   │   │   ├── navigation/
│   │   │   ├── seo/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── preview/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── editors/
│   │   ├── blocks/
│   │   ├── media/
│   │   ├── data-table/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── pages/
│   │   ├── media/
│   │   └── settings/
│   ├── hooks/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── auth.ts
│   │   ├── query-client.ts
│   │   ├── validators/
│   │   └── constants/
│   ├── stores/
│   ├── types/
│   ├── middleware.ts
│   ├── .env.example
│   └── package.json
│
├── backend-api/                 # NestJS + Prisma + PostgreSQL
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── pipes/
│   │   │   ├── constants/
│   │   │   └── utils/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── projects/
│   │       ├── project-blocks/
│   │       ├── pages/
│   │       ├── page-sections/
│   │       ├── experiences/
│   │       ├── skills/
│   │       ├── testimonials/
│   │       ├── media/
│   │       ├── navigation/
│   │       ├── settings/
│   │       ├── seo/
│   │       ├── contact/
│   │       ├── revisions/
│   │       ├── audit-logs/
│   │       └── health/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── scripts/
│   │   └── import-legacy-json.ts
│   ├── test/
│   ├── uploads/                 # Local development only
│   ├── .env.example
│   └── package.json
│
├── packages/
│   ├── shared-types/            # DTO/type yang dipakai portfolio dan CMS
│   ├── design-tokens/           # Warna, radius, spacing, typography
│   ├── eslint-config/
│   └── tsconfig/
│
├── legacy-cms-backup/           # CMS lama, hanya sebagai referensi sementara
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json                   # Opsional
├── .env.example
└── README.md
```

### Catatan migrasi struktur

Jangan langsung menghapus CMS lama.

1. Copy CMS lama ke `legacy-cms-backup`.
2. Clone atau copy source CMS lama ke `cms-admin`.
3. Pertahankan bagian UI yang masih relevan.
4. Hapus seluruh proses baca/tulis file JSON dari CMS baru.
5. Ganti data layer dengan API client.
6. Setelah seluruh data berhasil dipindahkan, folder legacy dapat dihapus.

---

## 4. Konsep CMS

CMS tidak perlu terlihat seperti dashboard enterprise yang terlalu kompleks. Konsepnya harus:

- Clean.
- Elegan.
- Visual-first.
- Banyak ruang kosong.
- Mudah melihat preview hasil akhir.
- Konsisten dengan Portfolio V2.
- Fokus pada karya, media, urutan, dan storytelling.

### Layout utama

```text
┌─────────────────────────────────────────────────────────────────┐
│ Topbar: Search | Preview Website | Notification | User          │
├──────────────┬──────────────────────────────────────────────────┤
│ Sidebar      │ Page title                          Primary CTA   │
│              │ Breadcrumb                                       │
│ Dashboard    ├──────────────────────────────────────────────────┤
│ Projects     │ Content / table / editor                          │
│ Pages        │                                                   │
│ Experience   │                                                   │
│ Skills       │                                                   │
│ Media        │                                                   │
│ Messages     │                                                   │
│ SEO          │                                                   │
│ Settings     │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

### Design tokens CMS

Gunakan token dari Portfolio V2 agar tidak membuat identitas baru.

```css
:root {
  --cms-background: var(--portfolio-background);
  --cms-surface: var(--portfolio-surface);
  --cms-surface-raised: var(--portfolio-surface-raised);
  --cms-text-primary: var(--portfolio-text-primary);
  --cms-text-secondary: var(--portfolio-text-secondary);
  --cms-border: var(--portfolio-border);
  --cms-accent: var(--portfolio-accent);
  --cms-success: #22c55e;
  --cms-warning: #f59e0b;
  --cms-danger: #ef4444;
}
```

Jika token Portfolio V2 belum dipisahkan, pindahkan ke:

```text
packages/design-tokens/
├── colors.css
├── typography.css
├── spacing.css
├── radius.css
└── index.css
```

### Pola UI yang digunakan

- Sidebar dapat di-collapse.
- Global command search.
- Table dengan filter, search, sorting, dan bulk action.
- Drawer untuk quick edit.
- Full-page editor untuk project dan case study.
- Split view: editor kiri, preview kanan.
- Auto-save dengan indikator status.
- Unsaved changes warning.
- Toast setelah create, update, delete, dan publish.
- Skeleton loading.
- Empty state yang informatif.
- Confirmation dialog untuk destructive action.
- Keyboard shortcut untuk save dan preview.

---

## 5. Modul dan Fitur CMS

## 5.1 Dashboard

Dashboard cukup menampilkan data penting:

- Total project.
- Project published.
- Project draft.
- Scheduled content.
- Total media.
- Unread contact messages.
- Project terakhir diperbarui.
- Aktivitas terbaru.
- Quick action:
  - Add project.
  - Upload media.
  - Edit homepage.
  - Preview website.

## 5.2 Project Archive

Field minimum:

- Project title.
- Slug.
- Short description.
- Cover image.
- Gallery.
- Client/company.
- Project category.
- Industry.
- Year.
- Timeline/duration.
- Role.
- Team.
- Platform.
- Tools.
- Services.
- Featured status.
- Visibility.
- Sort order.
- Project status.
- SEO title.
- SEO description.
- Open Graph image.
- Published date.

Status:

```text
DRAFT
IN_REVIEW
SCHEDULED
PUBLISHED
ARCHIVED
```

Fitur:

- Duplicate project.
- Archive/restore.
- Drag-and-drop featured project.
- Bulk publish.
- Bulk archive.
- Preview draft.
- Schedule publish.
- Custom project URL.
- Related project selection.
- Password-protected project, opsional.
- Hide sensitive client information.
- Mark project as NDA.

## 5.3 Project Case Study Builder

Detail project dibuat menggunakan block editor agar fleksibel.

Jenis block awal:

```text
HERO
OVERVIEW
TEXT
RICH_TEXT
IMAGE
FULL_WIDTH_IMAGE
IMAGE_GRID
GALLERY
VIDEO
FIGMA_EMBED
QUOTE
METRICS
PROBLEM
SOLUTION
PROCESS
RESEARCH
USER_FLOW
WIREFRAME
DESIGN_SYSTEM
BEFORE_AFTER
RESULT
LEARNING
NEXT_PROJECT
DIVIDER
SPACER
CUSTOM
```

Setiap block memiliki:

- ID.
- Type.
- Title, opsional.
- Content JSON.
- Sort order.
- Visibility desktop.
- Visibility tablet.
- Visibility mobile.
- Background variant.
- Width variant.
- Animation preset.
- Published state.

Contoh data block:

```json
{
  "type": "METRICS",
  "content": {
    "eyebrow": "Impact",
    "items": [
      {
        "value": "35%",
        "label": "Faster submission flow"
      },
      {
        "value": "22%",
        "label": "Lower validation error"
      }
    ]
  }
}
```

Gunakan JSONB hanya untuk isi block yang fleksibel. Informasi utama project tetap menggunakan tabel relasional.

## 5.4 Homepage/Page Builder

Homepage tidak perlu sepenuhnya bebas seperti Webflow. Gunakan section builder yang dikontrol agar desain tetap konsisten.

Section yang dapat diatur:

- Hero.
- Selected work.
- Project archive.
- Showreel.
- Experience.
- Capabilities.
- Process.
- Testimonial.
- Collaboration/contact.
- Footer.
- Custom section.

Kemampuan editor:

- Enable/disable section.
- Drag-and-drop urutan section.
- Edit content section.
- Pilih layout variant.
- Pilih project yang ditampilkan.
- Atur jumlah project.
- Atur background.
- Atur animation preset.
- Preview desktop, tablet, mobile.

## 5.5 Experience

Field:

- Company.
- Position.
- Employment type.
- Start date.
- End date.
- Current position.
- Location.
- Summary.
- Responsibilities.
- Achievements.
- Company logo.
- Sort order.
- Visibility.

## 5.6 Skills & Tools

Pisahkan:

- Skill.
- Tool.
- Capability/service.

Field:

- Name.
- Category.
- Level, opsional.
- Icon/logo.
- Description.
- Featured.
- Sort order.
- Visibility.

Jangan menampilkan level persentase apabila tidak memiliki dasar penilaian yang jelas.

## 5.7 Testimonials

Field:

- Name.
- Position.
- Company.
- Photo.
- Testimonial.
- Project relation.
- Featured.
- Status.
- Sort order.

## 5.8 Media Library

Media library harus dapat:

- Upload multi-file.
- Drag-and-drop upload.
- Preview.
- Search file.
- Filter berdasarkan type.
- Copy URL.
- Edit alt text.
- Edit caption.
- Replace file tanpa mengganti relasi.
- Melihat penggunaan file.
- Delete hanya jika tidak sedang digunakan.
- Generate thumbnail.
- Menyimpan width, height, size, dan MIME type.

Supported:

```text
image/jpeg
image/png
image/webp
image/avif
image/svg+xml
video/mp4
video/webm
application/pdf
```

Untuk production, file jangan disimpan di filesystem backend. Upload ke object storage, lalu PostgreSQL hanya menyimpan metadata dan URL.

## 5.9 Contact Inbox

Form collaboration/contact pada portfolio masuk ke CMS.

Field:

- Name.
- Email.
- Company.
- Project type.
- Budget range.
- Message.
- Source page.
- Status.
- Created date.

Status:

```text
NEW
READ
REPLIED
ARCHIVED
SPAM
```

Proteksi:

- Rate limit.
- Honeypot.
- CAPTCHA opsional.
- Input sanitization.
- Email validation.

## 5.10 SEO

Dapat dikelola per page dan project:

- Meta title.
- Meta description.
- Canonical URL.
- Keywords, opsional.
- Open Graph title.
- Open Graph description.
- Open Graph image.
- Robots index/noindex.
- Robots follow/nofollow.
- Structured data JSON-LD.
- Sitemap inclusion.

## 5.11 Settings

Kelompok setting:

### General

- Site name.
- Site URL.
- Short description.
- Default locale.
- Timezone.
- Maintenance mode.

### Profile

- Display name.
- Professional title.
- Bio.
- Email.
- Phone, opsional.
- Location.
- Resume URL.
- Availability status.

### Social

- LinkedIn.
- Behance.
- Dribbble.
- GitHub.
- Instagram.
- YouTube.
- Other social links.

### Branding

- Logo.
- Favicon.
- Default OG image.
- Theme token.
- Cursor effect setting.
- Loading animation.
- Page transition.

### Analytics

- Analytics provider ID.
- Tag manager ID.
- Enable cookie consent.
- Custom script, restricted to super admin.

---

## 6. Role dan Permission

Role minimum:

| Permission | Super Admin | Editor | Viewer |
|---|---:|---:|---:|
| Manage users | Yes | No | No |
| Manage settings | Yes | Limited | No |
| Create/edit content | Yes | Yes | No |
| Publish content | Yes | Optional | No |
| Delete content | Yes | Limited | No |
| Upload media | Yes | Yes | No |
| View messages | Yes | Yes | Yes |
| View audit logs | Yes | No | No |
| Preview content | Yes | Yes | Yes |

Gunakan role-based access control di backend. Menyembunyikan tombol di frontend saja tidak cukup.

---

## 7. Database Design

### Prinsip

1. Gunakan tabel relasional untuk entity utama.
2. Gunakan `JSONB` untuk konfigurasi block atau setting fleksibel.
3. Gunakan UUID atau CUID untuk ID publik.
4. Setiap tabel konten mempunyai `createdAt` dan `updatedAt`.
5. Konten yang dapat dipublikasikan mempunyai `status` dan `publishedAt`.
6. Gunakan soft delete untuk project, page, dan media.
7. Gunakan audit log untuk aktivitas admin.

### Entity utama

```text
User
RefreshToken
Project
ProjectBlock
ProjectMetric
Category
Tag
ProjectTag
Page
PageSection
Experience
Skill
Tool
Testimonial
MediaAsset
NavigationItem
SiteSetting
SeoMetadata
ContactMessage
Revision
AuditLog
```

---

## 8. Draft Prisma Schema

Schema berikut adalah fondasi awal dan dapat diperluas.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  EDITOR
  VIEWER
}

enum ContentStatus {
  DRAFT
  IN_REVIEW
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum ProjectVisibility {
  PUBLIC
  UNLISTED
  PASSWORD_PROTECTED
  PRIVATE
}

enum ContactStatus {
  NEW
  READ
  REPLIED
  ARCHIVED
  SPAM
}

enum MediaType {
  IMAGE
  VIDEO
  DOCUMENT
  OTHER
}

model User {
  id            String         @id @default(cuid())
  name          String
  email         String         @unique
  passwordHash  String
  avatarUrl     String?
  role          UserRole       @default(EDITOR)
  isActive      Boolean        @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
  revisions     Revision[]
  auditLogs     AuditLog[]
}

model RefreshToken {
  id         String   @id @default(cuid())
  tokenHash  String   @unique
  userId     String
  expiresAt  DateTime
  revokedAt  DateTime?
  userAgent  String?
  ipAddress  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model Project {
  id              String             @id @default(cuid())
  title           String
  slug            String             @unique
  excerpt         String?
  description     String?
  client          String?
  industry        String?
  year            Int?
  role            String?
  duration        String?
  platform        String?
  services        String[]
  tools           String[]
  team            Json?
  coverMediaId    String?
  featured        Boolean            @default(false)
  nda             Boolean            @default(false)
  visibility      ProjectVisibility  @default(PUBLIC)
  passwordHash    String?
  status          ContentStatus      @default(DRAFT)
  sortOrder       Int                @default(0)
  publishedAt     DateTime?
  scheduledAt     DateTime?
  deletedAt       DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  coverMedia      MediaAsset?        @relation("ProjectCover", fields: [coverMediaId], references: [id])
  blocks          ProjectBlock[]
  metrics         ProjectMetric[]
  categories      ProjectCategory[]
  tags            ProjectTag[]
  seo             SeoMetadata?
  testimonials    Testimonial[]
  revisions       Revision[]

  @@index([status, publishedAt])
  @@index([featured, sortOrder])
  @@index([deletedAt])
}

model ProjectBlock {
  id            String   @id @default(cuid())
  projectId     String
  type          String
  title         String?
  content       Json
  sortOrder     Int      @default(0)
  isVisible     Boolean  @default(true)
  desktop       Boolean  @default(true)
  tablet        Boolean  @default(true)
  mobile        Boolean  @default(true)
  layoutVariant String?
  background    String?
  animation     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, sortOrder])
}

model ProjectMetric {
  id        String  @id @default(cuid())
  projectId String
  value     String
  label     String
  note      String?
  sortOrder Int     @default(0)
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, sortOrder])
}

model Category {
  id       String            @id @default(cuid())
  name     String
  slug     String            @unique
  projects ProjectCategory[]
}

model ProjectCategory {
  projectId  String
  categoryId String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([projectId, categoryId])
}

model Tag {
  id       String       @id @default(cuid())
  name     String
  slug     String       @unique
  projects ProjectTag[]
}

model ProjectTag {
  projectId String
  tagId     String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([projectId, tagId])
}

model Page {
  id          String         @id @default(cuid())
  name        String
  slug        String         @unique
  status      ContentStatus  @default(DRAFT)
  isHomepage  Boolean        @default(false)
  publishedAt DateTime?
  scheduledAt DateTime?
  deletedAt   DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  sections    PageSection[]
  seo         SeoMetadata?
  revisions   Revision[]

  @@index([status, publishedAt])
}

model PageSection {
  id            String   @id @default(cuid())
  pageId        String
  type          String
  name          String?
  content       Json
  sortOrder     Int      @default(0)
  isVisible     Boolean  @default(true)
  layoutVariant String?
  background    String?
  animation     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  page          Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId, sortOrder])
}

model Experience {
  id             String   @id @default(cuid())
  company        String
  position       String
  employmentType String?
  location       String?
  startDate      DateTime
  endDate        DateTime?
  isCurrent      Boolean  @default(false)
  summary        String?
  responsibilities Json?
  achievements   Json?
  logoMediaId    String?
  sortOrder      Int      @default(0)
  isVisible      Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  logoMedia      MediaAsset? @relation("ExperienceLogo", fields: [logoMediaId], references: [id])

  @@index([sortOrder])
}

model Skill {
  id          String   @id @default(cuid())
  name        String
  category    String?
  description String?
  level       Int?
  iconMediaId String?
  featured    Boolean  @default(false)
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  iconMedia   MediaAsset? @relation("SkillIcon", fields: [iconMediaId], references: [id])

  @@index([category, sortOrder])
}

model Testimonial {
  id          String         @id @default(cuid())
  name        String
  position    String?
  company     String?
  quote       String
  photoMediaId String?
  projectId   String?
  featured    Boolean        @default(false)
  status      ContentStatus  @default(DRAFT)
  sortOrder   Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  photoMedia  MediaAsset?    @relation("TestimonialPhoto", fields: [photoMediaId], references: [id])
  project     Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)
}

model MediaAsset {
  id                 String        @id @default(cuid())
  type               MediaType
  filename           String
  originalName       String
  url                String
  storageKey         String        @unique
  mimeType           String
  size               Int
  width              Int?
  height             Int?
  duration           Int?
  altText            String?
  caption            String?
  blurDataUrl        String?
  deletedAt          DateTime?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  projectCovers      Project[]     @relation("ProjectCover")
  experienceLogos    Experience[]  @relation("ExperienceLogo")
  skillIcons         Skill[]       @relation("SkillIcon")
  testimonialPhotos  Testimonial[] @relation("TestimonialPhoto")

  @@index([type, createdAt])
  @@index([deletedAt])
}

model NavigationItem {
  id          String   @id @default(cuid())
  label       String
  url         String
  location    String   @default("HEADER")
  target      String   @default("_self")
  parentId    String?
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  parent      NavigationItem?  @relation("NavigationTree", fields: [parentId], references: [id])
  children    NavigationItem[] @relation("NavigationTree")

  @@index([location, sortOrder])
}

model SiteSetting {
  id          String   @id @default(cuid())
  group       String
  key         String
  value       Json
  isPublic    Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([group, key])
  @@index([group])
}

model SeoMetadata {
  id          String   @id @default(cuid())
  projectId   String?  @unique
  pageId      String?  @unique
  title       String?
  description String?
  canonical   String?
  ogTitle     String?
  ogDescription String?
  ogImageUrl  String?
  noIndex     Boolean  @default(false)
  noFollow    Boolean  @default(false)
  jsonLd      Json?
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  page        Page?    @relation(fields: [pageId], references: [id], onDelete: Cascade)
}

model ContactMessage {
  id           String        @id @default(cuid())
  name         String
  email        String
  company      String?
  projectType  String?
  budgetRange  String?
  message      String
  sourcePage   String?
  status       ContactStatus @default(NEW)
  ipHash       String?
  userAgent    String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([status, createdAt])
}

model Revision {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String
  version     Int
  snapshot    Json
  changeNote  String?
  userId      String
  projectId   String?
  pageId      String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  page        Page?    @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([entityType, entityId, version])
  @@index([entityType, entityId])
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  entityType  String
  entityId    String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Catatan Prisma

Untuk array seperti `services` dan `tools`, PostgreSQL mendukung scalar list. Jika nantinya diperlukan filtering yang lebih kompleks, ubah menjadi tabel relasional tersendiri.

---

## 9. API Design

Gunakan prefix:

```text
/api/v1
```

Response standar:

```json
{
  "success": true,
  "message": "Project berhasil diperbarui.",
  "data": {},
  "meta": {}
}
```

Error standar:

```json
{
  "success": false,
  "message": "Data tidak valid.",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "title",
      "message": "Title wajib diisi."
    }
  ]
}
```

## 9.1 Public API

```text
GET    /api/v1/public/site
GET    /api/v1/public/navigation
GET    /api/v1/public/pages/:slug
GET    /api/v1/public/projects
GET    /api/v1/public/projects/:slug
GET    /api/v1/public/experiences
GET    /api/v1/public/skills
GET    /api/v1/public/testimonials
POST   /api/v1/public/contact
GET    /api/v1/public/sitemap
```

Query project:

```text
GET /api/v1/public/projects?page=1&limit=12&category=ui-ux&tag=insurance&featured=true
```

Public API hanya mengembalikan content dengan status `PUBLISHED` dan `publishedAt <= now()`.

## 9.2 Auth API

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
```

## 9.3 Admin Project API

```text
GET    /api/v1/admin/projects
POST   /api/v1/admin/projects
GET    /api/v1/admin/projects/:id
PATCH  /api/v1/admin/projects/:id
DELETE /api/v1/admin/projects/:id
POST   /api/v1/admin/projects/:id/restore
POST   /api/v1/admin/projects/:id/duplicate
POST   /api/v1/admin/projects/:id/publish
POST   /api/v1/admin/projects/:id/unpublish
POST   /api/v1/admin/projects/:id/schedule
POST   /api/v1/admin/projects/reorder
```

## 9.4 Project Block API

```text
GET    /api/v1/admin/projects/:projectId/blocks
POST   /api/v1/admin/projects/:projectId/blocks
PATCH  /api/v1/admin/project-blocks/:id
DELETE /api/v1/admin/project-blocks/:id
POST   /api/v1/admin/projects/:projectId/blocks/reorder
```

## 9.5 Page API

```text
GET    /api/v1/admin/pages
POST   /api/v1/admin/pages
GET    /api/v1/admin/pages/:id
PATCH  /api/v1/admin/pages/:id
DELETE /api/v1/admin/pages/:id
POST   /api/v1/admin/pages/:id/publish
POST   /api/v1/admin/pages/:id/preview-token
POST   /api/v1/admin/pages/:pageId/sections/reorder
```

## 9.6 Media API

```text
GET    /api/v1/admin/media
POST   /api/v1/admin/media/presign
POST   /api/v1/admin/media/complete
PATCH  /api/v1/admin/media/:id
DELETE /api/v1/admin/media/:id
GET    /api/v1/admin/media/:id/usage
```

Rekomendasi upload:

1. CMS meminta presigned upload URL.
2. Browser upload langsung ke object storage.
3. CMS mengirim metadata hasil upload ke backend.
4. Backend menyimpan metadata ke PostgreSQL.
5. Backend tidak menerima file besar secara langsung kecuali fallback.

## 9.7 Settings dan lainnya

```text
GET/PATCH /api/v1/admin/settings/:group
GET/POST/PATCH/DELETE /api/v1/admin/navigation
GET/POST/PATCH/DELETE /api/v1/admin/experiences
GET/POST/PATCH/DELETE /api/v1/admin/skills
GET/POST/PATCH/DELETE /api/v1/admin/testimonials
GET/PATCH /api/v1/admin/contact/:id
GET       /api/v1/admin/audit-logs
GET       /api/v1/admin/revisions/:entityType/:entityId
POST      /api/v1/admin/revisions/:id/restore
```

---

## 10. Authentication Flow

### Login

1. User memasukkan email dan password.
2. Backend mencari user aktif.
3. Backend memverifikasi password menggunakan Argon2id.
4. Backend membuat access token berdurasi pendek.
5. Backend membuat refresh token acak.
6. Refresh token disimpan dalam bentuk hash di database.
7. Access dan refresh token dikirim melalui cookie `HttpOnly`.
8. CMS memanggil endpoint `/auth/me`.
9. Backend mengembalikan profile dan permission.

### Cookie production

```text
HttpOnly: true
Secure: true
SameSite: Lax atau Strict
Path: /
```

Jika CMS dan API berada pada domain berbeda, konfigurasi CORS dan cookie domain harus diuji secara khusus. Struktur domain yang lebih sederhana:

```text
portfolio.domain.com
cms.domain.com
api.domain.com
```

### Session security

- Rotating refresh token.
- Logout menghapus dan revoke refresh token.
- Logout all devices menghapus seluruh token user.
- Rate limit endpoint login.
- Lock sementara setelah percobaan gagal berulang.
- Audit login berhasil dan gagal.
- Jangan simpan token di `localStorage`.
- Tambahkan CSRF protection untuk operasi berbasis cookie.
- Tambahkan MFA pada fase lanjutan.

---

## 11. Preview dan Publishing Flow

### Draft preview

1. Editor menekan **Preview**.
2. CMS meminta preview token dari backend.
3. Backend membuat signed token dengan:
   - content ID,
   - user ID,
   - expiry,
   - permission.
4. CMS membuka:
   ```text
   https://portfolio.domain.com/preview?token=...
   ```
5. Portfolio memvalidasi token ke backend.
6. Backend mengembalikan draft content.
7. Preview banner ditampilkan.
8. Token berakhir dalam waktu singkat.

### Publish

1. Editor menekan **Publish**.
2. Backend membuat revision snapshot.
3. Backend mengubah status menjadi `PUBLISHED`.
4. Backend mengisi `publishedAt`.
5. Backend memanggil endpoint revalidation pada Portfolio Next.js.
6. Halaman terkait diregenerasi.
7. CMS menampilkan status berhasil.

### Schedule

Gunakan field `scheduledAt` dan scheduled worker.

Opsi sederhana:

- Cron job setiap satu menit.
- Cari content `SCHEDULED`.
- Jika `scheduledAt <= now()`, publish content.
- Buat audit log.
- Trigger revalidation.

---

## 12. Integrasi Portfolio Frontend

Portfolio tidak boleh langsung membaca database. Portfolio mengambil data melalui public API.

Contoh service:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getFeaturedProjects() {
  const response = await fetch(
    `${API_URL}/api/v1/public/projects?featured=true&limit=6`,
    {
      next: {
        revalidate: 3600,
        tags: ["projects", "featured-projects"],
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load featured projects");
  }

  return response.json();
}
```

Contoh revalidation route di portfolio:

```ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidation-secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  if (body.tag) {
    revalidateTag(body.tag);
  }

  if (body.path) {
    revalidatePath(body.path);
  }

  return NextResponse.json({ revalidated: true });
}
```

Fallback UI tetap diperlukan saat API gagal:

- Show cached content.
- Tampilkan project archive yang terakhir berhasil dimuat.
- Jangan membuat seluruh homepage error karena satu section gagal.

---

## 13. Migrasi dari CMS JSON Lama

### Masalah pendekatan lama

File JSON dapat digunakan untuk prototype atau konten statis. Namun, menulis file JSON saat aplikasi sudah di-deploy sering bermasalah karena:

- Filesystem dapat bersifat read-only.
- File dapat hilang saat instance restart.
- Beberapa instance mempunyai copy file berbeda.
- Tidak ada transaksi database.
- Sulit menangani banyak user.
- Tidak ada audit log dan revision.
- API error kadang mengembalikan halaman HTML, lalu frontend mencoba membacanya sebagai JSON dan memunculkan:
  ```text
  Unexpected token '<'
  ```

### Tahapan migrasi

#### Step 1 — Inventaris data

Cari seluruh file:

```text
data/*.json
content/*.json
db/*.json
public/data/*.json
```

Buat mapping:

```text
projects.json      -> Project + ProjectBlock
experience.json    -> Experience
skills.json        -> Skill
testimonials.json  -> Testimonial
settings.json      -> SiteSetting
navigation.json    -> NavigationItem
```

#### Step 2 — Normalisasi

Sebelum import:

- Pastikan slug unik.
- Ubah date menjadi ISO date.
- Pisahkan project category.
- Pisahkan tag.
- Pastikan URL media valid.
- Berikan default status.
- Buat mapping ID lama ke ID baru.

#### Step 3 — Import script

Contoh kerangka:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(
    process.cwd(),
    "../legacy-cms-backup/data/projects.json",
  );

  const raw = await fs.readFile(filePath, "utf8");
  const projects = JSON.parse(raw);

  for (const [index, item] of projects.entries()) {
    await prisma.project.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        excerpt: item.description ?? null,
        featured: Boolean(item.featured),
        sortOrder: index,
      },
      create: {
        title: item.title,
        slug: item.slug,
        excerpt: item.description ?? null,
        featured: Boolean(item.featured),
        sortOrder: index,
        status: "DRAFT",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

#### Step 4 — Verifikasi

Bandingkan:

- Jumlah project lama dan baru.
- Slug.
- Thumbnail.
- Urutan project.
- Rich text.
- Gallery.
- Featured state.
- Published state.

#### Step 5 — Cutover

1. Bekukan update CMS lama.
2. Jalankan import final.
3. Hubungkan portfolio ke public API.
4. Lakukan smoke test.
5. Aktifkan CMS baru.
6. Simpan backup JSON untuk beberapa waktu.
7. Hapus write access dari CMS lama.

---

## 14. Setup Workspace

### `pnpm-workspace.yaml`

```yaml
packages:
  - "."
  - "cms-admin"
  - "backend-api"
  - "packages/*"
```

### Root script yang direkomendasikan

```json
{
  "scripts": {
    "dev:portfolio": "pnpm dev",
    "dev:cms": "pnpm --dir cms-admin dev",
    "dev:api": "pnpm --dir backend-api start:dev",
    "build:cms": "pnpm --dir cms-admin build",
    "build:api": "pnpm --dir backend-api build",
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose down",
    "db:migrate": "pnpm --dir backend-api prisma migrate dev",
    "db:seed": "pnpm --dir backend-api prisma db seed",
    "db:studio": "pnpm --dir backend-api prisma studio",
    "lint:all": "pnpm -r lint",
    "test:all": "pnpm -r test"
  }
}
```

Catatan: apabila script root portfolio sudah bernama `dev`, jangan membuat `dev:portfolio` menjalankan dirinya sendiri. Gunakan workspace package name atau pindahkan script orchestration ke file terpisah.

---

## 15. Docker Compose PostgreSQL

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: portfoliov2-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: portfoliov2
      POSTGRES_USER: portfolio
      POSTGRES_PASSWORD: portfolio_local_password
    ports:
      - "5432:5432"
    volumes:
      - portfoliov2_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portfolio -d portfoliov2"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  portfoliov2_postgres_data:
```

Password pada file ini hanya untuk local development. Production harus menggunakan secret dari provider.

---

## 16. Environment Variables

### Root Portfolio `.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
REVALIDATION_SECRET=replace-with-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### CMS `.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PORTFOLIO_URL=http://localhost:3000
NEXT_PUBLIC_CMS_URL=http://localhost:3001
```

### Backend `.env.example`

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://portfolio:portfolio_local_password@localhost:5432/portfoliov2?schema=public

PORTFOLIO_URL=http://localhost:3000
CMS_URL=http://localhost:3001

JWT_ACCESS_SECRET=replace-with-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

REVALIDATION_URL=http://localhost:3000/api/revalidate
REVALIDATION_SECRET=replace-with-long-random-secret

STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=
STORAGE_REGION=auto
STORAGE_BUCKET=portfoliov2
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_PUBLIC_URL=

MAIL_PROVIDER=
MAIL_FROM=
MAIL_API_KEY=
```

Jangan commit file `.env`.

---

## 17. Backend Bootstrap

### Global configuration NestJS

Aktifkan:

- Global route prefix.
- Global validation pipe.
- CORS allowlist.
- Cookie parser.
- Helmet.
- Compression.
- Request ID.
- Structured logger.
- Global exception filter.
- Swagger hanya pada staging atau dengan proteksi.

Contoh:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");

  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: [
      process.env.PORTFOLIO_URL!,
      process.env.CMS_URL!,
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
```

---

## 18. CMS Data Layer

Buat satu API client terpusat.

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(
      `API returned non-JSON response with status ${response.status}`,
    );
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "API request failed");
  }

  return payload;
}
```

Pengecekan `content-type` membantu mendeteksi kasus API mengembalikan halaman HTML sebelum menjalankan `response.json()`.

### Query key

```ts
export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (filters: Record<string, unknown>) =>
      ["projects", "list", filters] as const,
    detail: (id: string) =>
      ["projects", "detail", id] as const,
  },
  pages: {
    all: ["pages"] as const,
    detail: (id: string) =>
      ["pages", "detail", id] as const,
  },
};
```

---

## 19. Auto-save Strategy

Auto-save tidak boleh mengirim request pada setiap keypress.

Gunakan:

- Local form state.
- Debounce 800–1500 ms.
- Simpan hanya jika form valid.
- Tampilkan state:
  - Unsaved.
  - Saving.
  - Saved.
  - Failed.
- Buat revision hanya pada manual save atau publish, bukan setiap auto-save.
- Gunakan optimistic update untuk reorder.
- Warning saat user menutup halaman dengan perubahan belum tersimpan.

---

## 20. Rich Text dan Block Validation

Setiap block type harus memiliki schema Zod sendiri.

Contoh:

```ts
import { z } from "zod";

export const metricBlockSchema = z.object({
  eyebrow: z.string().optional(),
  items: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
});
```

Backend tetap harus melakukan validation. Validation frontend hanya untuk pengalaman pengguna.

---

## 21. Search

MVP dapat menggunakan query `ILIKE` pada:

- Project title.
- Excerpt.
- Client.
- Tag.
- Category.

Fase lanjutan dapat menggunakan PostgreSQL full-text search dengan `tsvector` dan GIN index untuk project archive yang lebih besar.

---

## 22. Performance

### Portfolio

- Gunakan server-side data fetching.
- Gunakan cache tag.
- Revalidate setelah publish.
- Optimize image.
- Lazy load gallery dan video.
- Jangan mengirim seluruh block detail pada project listing.
- Pisahkan endpoint list dan detail.
- Gunakan pagination atau cursor.

### CMS

- Paginate table.
- Virtualize media grid jika jumlah file besar.
- Debounce search.
- Prefetch project detail saat hover, opsional.
- Compress image sebelum upload, bila sesuai.
- Gunakan signed URL upload.

### Database

Index minimum:

- Project slug.
- Project status + published date.
- Featured + sort order.
- Page slug.
- Media type + created date.
- Contact status + created date.
- Audit created date.
- Foreign key pada semua relation.

---

## 23. Security Checklist

- [ ] Password di-hash menggunakan Argon2id.
- [ ] JWT secret berbeda untuk access dan refresh.
- [ ] Refresh token disimpan dalam bentuk hash.
- [ ] Cookie menggunakan `HttpOnly`.
- [ ] Cookie production menggunakan `Secure`.
- [ ] CORS menggunakan allowlist, bukan wildcard.
- [ ] CSRF protection untuk mutation berbasis cookie.
- [ ] Login mempunyai rate limit.
- [ ] Contact form mempunyai rate limit dan anti-spam.
- [ ] DTO menggunakan whitelist validation.
- [ ] Semua admin route menggunakan auth guard.
- [ ] Permission diperiksa di backend.
- [ ] File type dan ukuran upload divalidasi.
- [ ] SVG diperlakukan hati-hati atau disanitasi.
- [ ] Secret tidak masuk repository.
- [ ] Database production tidak dibuka ke public tanpa restriction.
- [ ] Audit log untuk login, publish, delete, restore, dan setting.
- [ ] Backup database otomatis.
- [ ] Endpoint health tidak membocorkan secret.
- [ ] Error production tidak mengembalikan stack trace.
- [ ] Dependency update dilakukan secara berkala.

---

## 24. Testing Strategy

### Unit test

- Slug generator.
- Permission guard.
- Publish service.
- Schedule service.
- Media validation.
- Block validation.
- Contact spam detection.

### Integration test

- Login dan refresh.
- Project CRUD.
- Publish project.
- Draft tidak muncul pada public API.
- Reorder block.
- Media metadata.
- Revision restore.
- Contact submission.

### End-to-end

- Admin login.
- Create project.
- Upload cover.
- Add case study blocks.
- Preview.
- Publish.
- Project tampil pada website publik.
- Edit lalu rollback revision.
- Logout.

---

## 25. Deployment Architecture

```text
Git Repository: PORTFOLIOV2
│
├── Portfolio Service
│   └── portfolio.domain.com
│
├── CMS Service
│   └── cms.domain.com
│
├── Backend API Service
│   └── api.domain.com
│
├── PostgreSQL
│
└── Object Storage
```

### Environment

Gunakan minimal:

```text
Local
Staging
Production
```

Staging penting untuk menguji:

- Database migration.
- Cookie.
- CORS.
- Media upload.
- Preview.
- Revalidation.
- Scheduled publishing.

### Deployment order

1. Backup database.
2. Jalankan migration.
3. Deploy backend.
4. Jalankan health check.
5. Deploy CMS.
6. Deploy portfolio.
7. Smoke test public page.
8. Smoke test login CMS.
9. Test publish dan revalidation.

---

## 26. Tahapan Pengerjaan

## Phase 0 — Audit CMS Lama

- Copy source CMS lama.
- Identifikasi halaman dan fitur yang masih digunakan.
- Identifikasi semua file JSON.
- Catat struktur data.
- Identifikasi komponen UI yang dapat dipakai kembali.
- Buat screenshot flow lama sebagai referensi.

**Output:** migration map dan daftar fitur existing.

## Phase 1 — Foundation

- Setup PostgreSQL lokal.
- Setup NestJS.
- Setup Prisma.
- Buat auth.
- Buat user seed.
- Setup CMS shell.
- Setup API client.
- Setup shared design token.

**Output:** login CMS dan dashboard kosong sudah berjalan.

## Phase 2 — Project Management

- Project CRUD.
- Category dan tag.
- Media cover.
- Project table.
- Project form.
- Draft/publish.
- Public project endpoint.

**Output:** project dapat dibuat di CMS dan tampil pada website.

## Phase 3 — Case Study Builder

- Project block schema.
- Block editor.
- Drag-and-drop.
- Preview.
- Responsive visibility.
- Revision.

**Output:** detail project dapat dibangun tanpa coding manual.

## Phase 4 — Homepage Builder

- Page dan page section.
- Reorder homepage section.
- Selected project configuration.
- Settings.
- Navigation.
- SEO.

**Output:** homepage dapat dikelola dari CMS.

## Phase 5 — Supporting Content

- Experience.
- Skills/tools.
- Testimonials.
- Contact inbox.
- Media library lengkap.

**Output:** hampir seluruh konten portfolio dikelola dari CMS.

## Phase 6 — Migration

- Import JSON.
- Validasi data.
- Uji semua route.
- Bekukan CMS lama.
- Cutover ke PostgreSQL.

**Output:** CMS lama sudah tidak menjadi sumber data.

## Phase 7 — Hardening

- Audit log.
- Rate limit.
- CSRF.
- Backup.
- E2E test.
- Monitoring.
- Error tracking.
- Performance audit.

**Output:** siap production.

---

## 27. Prioritas MVP

Fitur yang harus dikerjakan dahulu:

1. Authentication.
2. Project CRUD.
3. Category dan tag.
4. Media upload.
5. Case study block editor.
6. Draft dan publish.
7. Public API.
8. Portfolio API integration.
9. Homepage section management.
10. Experience dan skills.
11. Settings.
12. JSON migration.

Fitur yang dapat menunggu:

- Scheduled publish.
- Revision rollback lengkap.
- Multi-user workflow.
- MFA.
- Analytics dashboard.
- Advanced full-text search.
- Localization.
- Password-protected project.
- Custom script settings.
- Realtime collaboration.

---

## 28. Definition of Done

CMS dan backend dianggap selesai untuk MVP apabila:

- Admin dapat login dan logout dengan aman.
- Data tidak lagi ditulis ke file JSON.
- Semua data utama tersimpan di PostgreSQL.
- Admin dapat membuat, mengedit, menghapus, dan mempublikasikan project.
- Admin dapat mengubah urutan project.
- Admin dapat menyusun case study menggunakan block editor.
- Admin dapat upload dan memilih media.
- Admin dapat preview draft.
- Project published tampil di portfolio.
- Draft tidak tampil di public API.
- Publish memicu revalidation frontend.
- Homepage section dapat diaktifkan, dinonaktifkan, dan diurutkan.
- Experience dan skill dapat dikelola.
- Contact form masuk ke CMS.
- Validasi dan permission dilakukan oleh backend.
- Database migration dan seed dapat dijalankan dari command.
- Environment local dan production terdokumentasi.
- CMS lama sudah dibackup.
- Data lama berhasil diimport dan diverifikasi.

---

## 29. Urutan Perintah Awal

Contoh inisialisasi dari root `PORTFOLIOV2`:

```bash
# Buat backup CMS lama
mkdir legacy-cms-backup

# Clone/copy CMS lama ke folder baru
mkdir cms-admin

# Buat backend
pnpm dlx @nestjs/cli new backend-api --package-manager pnpm

# Jika CMS akan dibuat ulang dari awal
pnpm create next-app@latest cms-admin \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Install Prisma di backend
cd backend-api
pnpm add @prisma/client
pnpm add -D prisma
pnpm prisma init

# Kembali ke root dan jalankan PostgreSQL
cd ..
docker compose up -d postgres

# Buat migration pertama
cd backend-api
pnpm prisma migrate dev --name init

# Jalankan Prisma Studio
pnpm prisma studio
```

Apabila `cms-admin` merupakan hasil copy CMS lama, jangan menjalankan `create-next-app` pada folder yang sama. Gunakan salah satu pendekatan saja.

---

## 30. Seed Admin Awal

Buat seed admin melalui environment variable, bukan hard-code.

```env
SEED_ADMIN_NAME=Luthfi Arzaki
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace-before-running
```

Setelah seed berhasil:

1. Hapus password dari shell history bila perlu.
2. Ganti password melalui CMS.
3. Jangan menjalankan seed admin berulang tanpa `upsert`.
4. Production sebaiknya menggunakan secret sekali pakai.

---

## 31. Hal yang Tidak Boleh Dilakukan

- Jangan lagi menyimpan perubahan konten ke file JSON production.
- Jangan mengakses PostgreSQL langsung dari browser.
- Jangan menyimpan password plaintext.
- Jangan menyimpan refresh token plaintext di database.
- Jangan menyimpan JWT di localStorage.
- Jangan membiarkan endpoint admin tanpa guard.
- Jangan mengandalkan hidden menu sebagai permission.
- Jangan upload file production ke folder lokal backend.
- Jangan membuat page builder terlalu bebas hingga merusak konsistensi desain.
- Jangan memasukkan seluruh project detail ke response listing.
- Jangan menghapus data legacy sebelum migrasi tervalidasi.
- Jangan menjalankan destructive migration tanpa backup.
- Jangan mengizinkan custom JavaScript untuk role editor biasa.

---

## 32. Rekomendasi Implementasi Akhir

Arsitektur yang paling sesuai untuk Portfolio V2:

```text
Existing Portfolio Next.js
        │
        │ Public REST API
        ▼
NestJS Backend ───────── PostgreSQL
        │
        ├─────────────── Object Storage
        │
        └─────────────── Revalidation Webhook
        ▲
        │ Admin REST API
        │
Next.js CMS Admin
```

Kombinasi ini menjaga:

- Portfolio tetap cepat.
- CMS tetap fleksibel.
- Backend dapat dikembangkan.
- Data tersimpan aman dan permanen.
- Case study tetap dinamis.
- Desain tetap terkontrol.
- Migrasi dari CMS JSON lama dapat dilakukan bertahap.

---

## 33. Referensi Resmi

Gunakan dokumentasi resmi terbaru ketika implementasi:

- Next.js App Router documentation.
- NestJS documentation untuk modules, controllers, validation, authentication, authorization, upload, dan OpenAPI.
- Prisma ORM documentation untuk PostgreSQL dan migrations.
- PostgreSQL documentation untuk JSONB, indexing, dan full-text search.
- OWASP Cheat Sheet Series untuk password storage, REST security, session, CSRF, dan Node.js security.
- Docker documentation untuk PostgreSQL local development dan Compose health check.

Versi dependency sebaiknya dikunci melalui lockfile dan diperbarui secara terkontrol, bukan ditulis permanen di dokumen ini.
