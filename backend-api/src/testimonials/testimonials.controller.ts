import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CreateTestimonialDto, TestimonialFieldsDto } from "./dto/testimonial.dto";
import { TestimonialsService } from "./testimonials.service";

@Controller("admin/testimonials")
@UseGuards(SessionGuard)
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list() {
    return this.testimonials.list();
  }

  @Post()
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonials.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: TestimonialFieldsDto) {
    return this.testimonials.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.testimonials.remove(id);
  }
}
