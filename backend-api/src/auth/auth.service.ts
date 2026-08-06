import { Injectable, UnauthorizedException } from "@nestjs/common";
import { User } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { TokenService } from "./token.service";

type SessionUser = Pick<User, "id" | "name" | "email" | "role">;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async login(email: string, password: string, metadata: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException({ success: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password." });
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.createSession(user, metadata);
  }

  async refresh(refreshToken: string | undefined, metadata: { userAgent?: string; ipAddress?: string }) {
    const [id, secret] = refreshToken?.split(".") ?? [];
    if (!id || !secret) throw this.invalidSession();

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date() || !stored.user.isActive) throw this.invalidSession();
    if (!(await argon2.verify(stored.tokenHash, secret))) throw this.invalidSession();

    await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
    return this.createSession(stored.user, metadata);
  }

  async getCurrentUser(accessToken: string | undefined): Promise<SessionUser> {
    if (!accessToken) throw this.invalidSession();
    const payload = this.tokens.verifyAccessToken(accessToken);
    if (!payload) throw this.invalidSession();

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw this.invalidSession();
    return this.toSessionUser(user);
  }

  async logout(refreshToken: string | undefined) {
    const [id] = refreshToken?.split(".") ?? [];
    if (id) {
      await this.prisma.refreshToken.updateMany({
        where: { id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  private async createSession(user: User, metadata: { userAgent?: string; ipAddress?: string }) {
    const secret = randomBytes(48).toString("base64url");
    const refreshToken = await this.prisma.refreshToken.create({
      data: {
        tokenHash: await argon2.hash(secret, { type: argon2.argon2id }),
        userId: user.id,
        expiresAt: new Date(Date.now() + this.tokens.refreshTokenTtlMs()),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
      },
    });

    return {
      accessToken: this.tokens.createAccessToken({ sub: user.id, email: user.email, role: user.role }),
      refreshToken: `${refreshToken.id}.${secret}`,
      user: this.toSessionUser(user),
    };
  }

  private toSessionUser(user: User): SessionUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private invalidSession() {
    return new UnauthorizedException({ success: false, code: "UNAUTHORIZED", message: "Authentication is required." });
  }
}
