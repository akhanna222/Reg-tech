import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { User, UserRole } from '../database/entities/user.entity';
import {
  Organization,
  EnrolmentStatus,
} from '../database/entities/organization.entity';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginResult {
  tokens: TokenPair;
  user: Omit<User, 'passwordHash' | 'totpSecret'>;
  requiresTwoFactor: boolean;
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  async login(
    user: User,
    totpCode?: string,
  ): Promise<LoginResult> {
    const hasTotpEnabled = !!user.totpSecret;

    if (hasTotpEnabled && !totpCode) {
      return {
        tokens: { accessToken: '', refreshToken: '', expiresIn: 0 },
        user: this.stripSensitive(user),
        requiresTwoFactor: true,
      };
    }

    if (hasTotpEnabled && totpCode) {
      const valid = authenticator.verify({
        token: totpCode,
        secret: user.totpSecret!,
      });
      if (!valid) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    const isTwoFactorAuthenticated = hasTotpEnabled;
    const tokens = await this.generateTokenPair(user, isTwoFactorAuthenticated);

    return {
      tokens,
      user: this.stripSensitive(user),
      requiresTwoFactor: false,
    };
  }

  async register(dto: RegisterDto): Promise<Omit<User, 'passwordHash' | 'totpSecret'>> {
    const org = await this.orgRepo.findOne({
      where: { id: dto.organizationId },
    });
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    if (org.enrolmentStatus !== EnrolmentStatus.APPROVED) {
      throw new ForbiddenException(
        'Organization enrolment must be approved before registering users',
      );
    }

    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      organizationId: dto.organizationId,
      role: UserRole.FI_USER,
      isActive: true,
    });

    const saved = await this.userRepo.save(user);
    return this.stripSensitive(saved);
  }

  async setupTwoFactor(
    userId: string,
  ): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (user.totpSecret) {
      throw new BadRequestException('2FA is already configured');
    }

    const secret = authenticator.generateSecret();
    const otpauthUri = authenticator.keyuri(user.email, 'RegTech', secret);

    // Store secret but do not enable until verified
    await this.userRepo.update(userId, { totpSecret: secret });

    return { secret, otpauthUri };
  }

  async verifyTwoFactor(userId: string, totpCode: string): Promise<boolean> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    if (!user.totpSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    const valid = authenticator.verify({
      token: totpCode,
      secret: user.totpSecret,
    });
    if (!valid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    return true;
  }

  async refreshToken(
    refreshTokenStr: string,
  ): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshTokenStr, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokenPair(
      user,
      payload.isTwoFactorAuthenticated,
    );
  }

  private async generateTokenPair(
    user: User,
    isTwoFactorAuthenticated: boolean,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      isTwoFactorAuthenticated,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private stripSensitive(
    user: User,
  ): Omit<User, 'passwordHash' | 'totpSecret'> {
    const { passwordHash, totpSecret, ...safe } = user;
    return safe;
  }
}
