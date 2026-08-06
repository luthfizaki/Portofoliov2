import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      return { success: true, data: { status: "ok" } };
    } catch {
      throw new ServiceUnavailableException({
        success: false,
        code: "DATABASE_UNAVAILABLE",
        message: "Database is unavailable.",
      });
    }
  }
}
