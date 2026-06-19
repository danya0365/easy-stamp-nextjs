import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";

import type {
  ISlipStorage,
  SaveObjectInput,
  SaveSlipInput,
} from "@/src/application/services/ISlipStorage";
import {
  contentTypeForKey,
  extFor,
  slipKey,
} from "@/src/infrastructure/services/slip-media";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Optional endpoint override; defaults to the account's R2 endpoint. */
  endpoint?: string;
}

/** Reads R2 settings from env; returns null when not fully configured. */
export function r2ConfigFromEnv(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: process.env.R2_ENDPOINT,
  };
}

/** Stores slips in a private Cloudflare R2 (S3-compatible) bucket. */
export class R2SlipStorage implements ISlipStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint:
        config.endpoint ??
        `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async save(input: SaveSlipInput): Promise<{ url: string }> {
    // Storage key (same format as local); served via /api/slips/[paymentId].
    return this.saveObject({
      key: slipKey(input.paymentId, extFor(input)),
      contentType: input.contentType,
      bytes: input.bytes,
    });
  }

  async saveObject(input: SaveObjectInput): Promise<{ url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.bytes,
        ContentType: input.contentType,
      }),
    );
    return { url: input.key };
  }

  async read(
    url: string,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: url }),
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return {
        bytes,
        contentType: res.ContentType ?? contentTypeForKey(url),
      };
    } catch (e) {
      if (e instanceof NoSuchKey) return null;
      throw e;
    }
  }
}
