import { Injectable, Inject } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3CertificatesService {
  private s3: S3;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.s3 = new S3({
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async getCertificateFromS3(bucket: string, key: string): Promise<string> {
    try {
      const params = {
        Bucket: bucket,
        Key: key,
      };

      const data = await this.s3.getObject(params).promise();

      if (!data.Body) {
        throw new Error('S3 object body is empty');
      }

      return data.Body.toString('utf-8');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to retrieve certificate from S3: ${error.message}`,
        );
      }
      throw new Error(
        'An unknown error occurred while retrieving the certificate from S3',
      );
    }
  }
}
