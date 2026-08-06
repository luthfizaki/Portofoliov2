import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { TokenService } from "./token.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly tokens: TokenService,
  ) {}

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto.email, dto.password, this.requestMetadata(request));
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { success: true, message: "Signed in.", data: { user: session.user } };
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.refresh(request.cookies?.portfolio_refresh_token, this.requestMetadata(request));
    this.setSessionCookies(response, session.accessToken, session.refreshToken);
    return { success: true, data: { user: session.user } };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.portfolio_refresh_token);
    this.clearSessionCookies(response);
    return { success: true, message: "Signed out.", data: null };
  }

  @Get("me")
  async me(@Req() request: Request) {
    const token = this.accessTokenFrom(request);
    return { success: true, data: { user: await this.auth.getCurrentUser(token) } };
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string) {
    const secure = this.config.get<string>("COOKIE_SECURE") === "true";
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    const base = { httpOnly: true, secure, sameSite: "lax" as const, ...(domain && domain !== "localhost" ? { domain } : {}) };
    response.cookie("portfolio_access_token", accessToken, { ...base, maxAge: this.tokens.accessTokenTtlMs() });
    response.cookie("portfolio_refresh_token", refreshToken, { ...base, maxAge: this.tokens.refreshTokenTtlMs() });
  }

  private clearSessionCookies(response: Response) {
    const domain = this.config.get<string>("COOKIE_DOMAIN");
    const options = domain && domain !== "localhost" ? { domain } : {};
    response.clearCookie("portfolio_access_token", options);
    response.clearCookie("portfolio_refresh_token", options);
  }

  private accessTokenFrom(request: Request) {
    const authorization = request.headers.authorization;
    if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
    return request.cookies?.portfolio_access_token as string | undefined;
  }

  private requestMetadata(request: Request) {
    return {
      userAgent: request.get("user-agent") ?? undefined,
      ipAddress: request.ip ?? undefined,
    };
  }
}
