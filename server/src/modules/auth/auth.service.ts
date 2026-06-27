import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { hash, verify } from 'argon2';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { setAuthCookie } from '../../common/utils/auth-cookie.util';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { Role, PlanType } from '@generated/prisma/client';
import AppleSignIn from 'apple-signin-auth';
import { Resend } from 'resend';
import * as crypto from 'crypto';

interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
}

interface UserForToken {
  id?: string;
  userId?: string;
  email: string;
  fullName: string;
  role: string;
  planType: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get resend() {
  return new Resend(this.configService.get<string>('RESEND_API_KEY'));
}

  async register(registerDto: RegisterDto): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hash(registerDto.password);

    const firstUser = await this.prisma.user.findFirst({
      select: { id: true },
    });

    const role = firstUser ? Role.USER : Role.ADMIN;

    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: hashedPassword,
        role,
        planType: PlanType.FREE,
        provider: 'email',
      },
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      planType: user.planType,
    };
  }

  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    const user = await this.validateLocalUser(
      loginDto.email,
      loginDto.password,
    );
    return this.generateTokenAndSetCookie(user, res);
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<UserForToken> {
    try {
      const user = await this.userService.findUserByEmail(email);

      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatched = await verify(user.password, password);
      if (!passwordMatched) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        planType: user.planType,
      };
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateJwtUser(userId: string): Promise<JwtUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    return {
      userId: user.id,
      role: user.role,
    };
  }

  async generateToken(userId: string): Promise<string> {
    const payload = {
      sub: {
        userId,
      },
    };
    return await this.jwtService.signAsync(payload);
  }

  async generateTokenAndSetCookie(
    user: UserForToken,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
    token?: string;
  }> {
    const userId = (user.id || user.userId) as string;
    const token = await this.generateToken(userId);
    setAuthCookie(res, token, this.configService);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    return {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      planType: user.planType,
      // Include token in response for Safari/iOS fallback (when cookies are blocked)
      // Only in production where cross-domain cookies may be blocked
      ...(isProduction && { token }),
    };
  }

  async handleGoogleAuth(
    profile: GoogleProfile,
    res: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
    token?: string;
  }> {
    let user = await this.userService.findUserByGoogleId(profile.googleId);

    if (!user) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: profile.googleId,
            provider: existingUser.provider === 'email' ? 'email' : 'google',
            avatar: profile.avatar || existingUser.avatar,
          },
        });
      } else {
        const firstUser = await this.prisma.user.findFirst({
          select: { id: true },
        });

        const role = firstUser ? Role.USER : Role.ADMIN;

        user = await this.prisma.user.create({
          data: {
            fullName: profile.fullName,
            email: profile.email,
            googleId: profile.googleId,
            provider: 'google',
            role,
            planType: PlanType.FREE,
            avatar: profile.avatar || '',
          },
        });
      }
    }

    return this.generateTokenAndSetCookie(user, res);
  }

  async handleAppleAuth(
    identityToken: string,
    fullName?: string,
    res?: Response,
  ): Promise<{
    userId: string;
    email: string;
    fullName: string;
    role: string;
    planType: string;
  }> {
    try {
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');

      const appleUser = await AppleSignIn.verifyIdToken(identityToken, {
        audience: clientId,
      });

      const appleId = appleUser.sub;
      const email = appleUser.email;

      if (!email) {
        throw new UnauthorizedException('Email not provided by Apple');
      }

      let user = await this.userService.findUserByAppleId(appleId);

      if (!user) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          user = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              appleId,
              provider: existingUser.provider === 'email' ? 'email' : 'apple',
            },
          });
        } else {
          const firstUser = await this.prisma.user.findFirst({
            select: { id: true },
          });

          const role = firstUser ? Role.USER : Role.ADMIN;

          user = await this.prisma.user.create({
            data: {
              fullName: fullName || 'Apple User',
              email,
              appleId,
              provider: 'apple',
              role,
              planType: PlanType.FREE,
            },
          });
        }
      }

      if (res) {
        return this.generateTokenAndSetCookie(user, res);
      }

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        planType: user.planType,
      };
    } catch {
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  async getCurrentUser(userId: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        planType: true,
        avatar: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async forgotPassword(email: string){
    
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
    });

   if (!user) return;

  //user who signed via google or apple login
   if (user.provider !== 'email') return;
    
   const plainToken = crypto.randomBytes(32).toString('hex');
  
    const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');

   const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiresAt,
      },
    });
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${plainToken}`;

    await this.resend.emails.send({
      from: 'Edikit <no-reply@mail.edikit.net>',
      to: user.email,
      subject: 'Reset your Edikit password',
      html: this.buildResetEmailHtml(user.email, resetUrl),
    });
  }

 async resetPassword(token: string, newPassword: string): Promise<void> {
  // Hash incoming token to compare against DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

     console.log('Token received:', token);
  console.log('Token length:', token.length);
  console.log('Hashed token:', hashedToken);

  const user = await this.prisma.user.findFirst({
    where: { resetPasswordToken: hashedToken },
  });

  console.log('User found:', user ? user.email : 'NOT FOUND');

  if (!user) {
    throw new BadRequestException('Invalid or expired reset link.');
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    // Clean up expired token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: null, resetPasswordExpires: null },
    });
    throw new BadRequestException('Reset link has expired. Please request a new one.');
  }

  // Hash new password with argon2 (matching your existing auth)
  const hashedPassword = await hash(newPassword);

  // Update password and clear reset token
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
}
 
private buildResetEmailHtml(email: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Inter',system-ui,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:12px;padding:40px;border:1px solid #e4e4e7;">

              <tr><td align="center" style="padding-bottom:32px;">
                <span style="font-size:22px;font-weight:700;color:#1A73E8;">Edikit</span>
                <img src="/logo.png" alt="Edikit Logo" width="40" height="40" style="display:block;margin-top:8px;">
              </td></tr>

              <tr><td style="padding-bottom:12px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#0B1220;">
                  Reset your password
                </h1>
              </td></tr>

              <tr><td style="padding-bottom:28px;color:#5A6475;font-size:15px;line-height:1.6;">
                We received a request to reset the password for <strong>${email}</strong>.
                This link expires in <strong>1 hour</strong>.
              </td></tr>

              <tr><td align="center" style="padding-bottom:28px;">
                <a href="${resetUrl}"
                  style="display:inline-block;padding:14px 32px;
                         background:linear-gradient(105deg,#1A73E8,#5EB5FC);
                         color:#fff;text-decoration:none;border-radius:999px;
                         font-weight:600;font-size:15px;">
                  Reset Password
                </a>
              </td></tr>

              <tr><td style="padding-bottom:28px;color:#5A6475;font-size:13px;line-height:1.6;">
                If the button doesn't work, paste this into your browser:<br/>
                <a href="${resetUrl}" style="color:#1A73E8;word-break:break-all;">${resetUrl}</a>
              </td></tr>

              <tr><td style="color:#a1a1aa;font-size:13px;border-top:1px solid #f4f4f5;padding-top:20px;">
                If you didn't request this, you can safely ignore this email.
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;
}
}
