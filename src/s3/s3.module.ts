import { Module } from '@nestjs/common';
import { S3CertificatesService } from './s3-certificates.service';

@Module({
  providers: [S3CertificatesService],
  exports: [S3CertificatesService],
})
export class S3Module {}
