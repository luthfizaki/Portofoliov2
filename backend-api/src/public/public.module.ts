import { Module } from "@nestjs/common";
import { ExperiencesModule } from "../experiences/experiences.module";
import { SkillsModule } from "../skills/skills.module";
import { TestimonialsModule } from "../testimonials/testimonials.module";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";

@Module({ imports: [ExperiencesModule, SkillsModule, TestimonialsModule], controllers: [PublicController], providers: [PublicService] })
export class PublicModule {}
