import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./database/prisma.module";
import { ExperiencesModule } from "./experiences/experiences.module";
import { HealthModule } from "./health/health.module";
import { MediaModule } from "./media/media.module";
import { ProjectsModule } from "./projects/projects.module";
import { PublicModule } from "./public/public.module";
import { PagesModule } from "./pages/pages.module";
import { SkillsModule } from "./skills/skills.module";
import { TestimonialsModule } from "./testimonials/testimonials.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    MediaModule,
    AuthModule,
    ProjectsModule,
    PublicModule,
    PagesModule,
    ExperiencesModule,
    SkillsModule,
    TestimonialsModule,
  ],
})
export class AppModule {}
