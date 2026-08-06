import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  accessTokenTtlMs() {
    return this.durationToMs(this.config.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m");
  }

  refreshTokenTtlMs() {
    return this.durationToMs(this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "30d");
  }

  createAccessToken(payload: Omit<AccessTokenPayload, "exp" | "iat">) {
    const now = Math.floor(Date.now() / 1000);
    return this.sign({
      ...payload,
      iat: now,
      exp: now + Math.floor(this.accessTokenTtlMs() / 1000),
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const expected = this.signature(`${encodedHeader}.${encodedPayload}`);
    if (expected.length !== signature.length) return null;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AccessTokenPayload;
      if (!payload.sub || !payload.email || !payload.role || payload.exp <= Date.now() / 1000) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private sign(payload: AccessTokenPayload) {
    const encodedHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${encodedHeader}.${encodedPayload}.${this.signature(`${encodedHeader}.${encodedPayload}`)}`;
  }

  private signature(value: string) {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (!secret || secret === "replace-before-enabling-auth") {
      throw new Error("JWT_ACCESS_SECRET is not configured.");
    }
    return createHmac("sha256", secret).update(value).digest("base64url");
  }

  private durationToMs(value: string) {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);
    if (!match) throw new Error(`Invalid duration: ${value}`);
    const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
    return Number(match[1]) * unit;
  }
}
