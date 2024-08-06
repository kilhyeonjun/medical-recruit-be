import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      this.logger.warn('API key is missing in the request headers');
      throw new UnauthorizedException('API Key is required');
    }

    try {
      if (!this.validateApiKey(apiKey)) {
        this.logger.warn('Invalid API key provided');
        throw new UnauthorizedException('Invalid API Key');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating API key: ${error.message}`);
      throw new InternalServerErrorException('Error processing API key');
    }

    return true;
  }

  private validateApiKey(apiKey: string): boolean {
    const storedHashedKey = this.configService.get<string>('HASHED_API_KEY');
    if (!storedHashedKey) {
      this.logger.error(
        'HASHED_API_KEY is not defined in environment variables',
      );
      throw new InternalServerErrorException('Server configuration error');
    }

    const hashedProvidedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hashedProvidedKey),
      Buffer.from(storedHashedKey),
    );
  }
}
