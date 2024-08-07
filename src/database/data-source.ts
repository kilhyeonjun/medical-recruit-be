import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { S3 } from 'aws-sdk';

const NODE_ENV = process.env.NODE_ENV || 'production';

config({
  path: [
    '.env',
    `.env.${NODE_ENV}`,
    `.env.${NODE_ENV}.local`,
    `.env.${NODE_ENV}.migration`,
  ],
});

const isProduction = NODE_ENV === 'production';

const getCertificateFromS3 = async (
  bucket: string | undefined,
  key: string | undefined,
): Promise<string> => {
  if (!bucket || !key) {
    throw new Error('S3 bucket or key is not provided');
  }

  const s3 = new S3({
    region: process.env.AWS_REGION,
  });

  try {
    const data = await s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

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
};

const createDataSource = async (): Promise<DataSource> => {
  let sslCa: string | undefined;

  if (isProduction) {
    try {
      sslCa = await getCertificateFromS3(
        process.env.SSL_CERTIFICATE_S3_BUCKET,
        process.env.SSL_CERTIFICATE_S3_KEY,
      );
    } catch (error) {
      console.error('Error retrieving SSL certificate:', error);
      // 여기서 에러를 던지거나 기본 동작을 결정해야 합니다.
      // throw error; // 에러를 던져서 애플리케이션 시작을 중단하거나
      // SSL 없이 계속 진행하려면 아래 주석을 해제하세요
      // sslCa = undefined;
    }
  }

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.ADMIN_DATABASE_USER,
    password: process.env.ADMIN_DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: false,
    logging: true,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/database/migrations/**/*{.ts,.js}'],
    subscribers: [],
    ...(isProduction &&
      sslCa && {
        ssl: {
          ca: sslCa,
          rejectUnauthorized: true,
        },
      }),
  };

  return new DataSource(dataSourceOptions);
};

// 사용할 때 비동기로 초기화해야 함
export const initializeDataSource = createDataSource;

// TypeORM CLI 호환성을 위한 기본 내보내기
export default createDataSource();
