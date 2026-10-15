import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./database/prisma.module";
import { ExperiencesModule } from "./experiences/experiences.module";
import { HealthModule } from "./health/health.module";
import { MediaModule } from "./media/media.module";
import { ProjectsModule } from "./projects/projects.module";
import { SeoModule } from "./seo/seo.module";
import { PublicModule } from "./public/public.module";
import { PagesModule } from "./pages/pages.module";
import { SkillsModule } from "./skills/skills.module";
import { TestimonialsModule } from "./testimonials/testimonials.module";
import { CmsPreviewReadOnlyInterceptor } from "./security/cms-preview-read-only.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    MediaModule,
    AuthModule,
    ProjectsModule,
    SeoModule,
    PublicModule,
    PagesModule,
    ExperiencesModule,
    SkillsModule,
    TestimonialsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CmsPreviewReadOnlyInterceptor,
    },
  ],
})
export class AppModule {}
