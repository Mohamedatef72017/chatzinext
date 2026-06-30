import crypto from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type TenantObjectInput = {
  tenantId: string;
  scope: string;
  fileName: string;
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string | number | boolean | undefined | null>;
};

export type StoredObject = {
  storageProvider: "cloudflare-r2";
  bucket: string;
  objectKey: string;
  publicUrl?: string;
  signedUrl?: string;
  url?: string;
  fileSizeBytes: number;
  mimeType?: string;
};

let cachedClient: S3Client | null = null;

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function getR2Config() {
  return {
    accountId: firstEnv("R2_ACCOUNT_ID", "CLOUDFLARE_R2_ACCOUNT_ID"),
    accessKeyId: firstEnv("R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: firstEnv("R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    bucketName: firstEnv("R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET"),
    publicBaseUrl: firstEnv("R2_PUBLIC_BASE_URL", "CLOUDFLARE_R2_PUBLIC_BASE_URL").replace(/\/$/, ""),
    signedUrlTtlSeconds: Number(firstEnv("R2_SIGNED_URL_TTL_SECONDS", "R2_SIGNED_URL_EXPIRES_SECONDS") || 3600)
  };
}

export function isR2Configured() {
  const config = getR2Config();
  return Boolean(config.accountId && config.accessKeyId && config.secretAccessKey && config.bucketName);
}

function getClient() {
  const config = getR2Config();
  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("إعدادات Cloudflare R2 غير مكتملة.");
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }

  return cachedClient;
}

export function getR2BucketName() {
  const bucket = getR2Config().bucketName;
  if (!bucket) throw new Error("R2_BUCKET_NAME غير مضبوط.");
  return bucket;
}

export function sanitizeObjectSegment(value: string, fallback = "file") {
  return String(value || fallback)
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || fallback;
}

export function buildTenantObjectKey(input: { tenantId: string; scope: string; fileName: string }) {
  const scope = input.scope
    .split("/")
    .map((segment) => sanitizeObjectSegment(segment, "scope"))
    .filter(Boolean)
    .join("/");
  const safeName = sanitizeObjectSegment(input.fileName, "file");
  return [
    "tenants",
    sanitizeObjectSegment(input.tenantId, "tenant"),
    scope,
    `${Date.now()}-${crypto.randomUUID()}-${safeName}`
  ].filter(Boolean).join("/");
}

function normalizeMetadata(metadata?: TenantObjectInput["metadata"]) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    if (value === undefined || value === null) continue;
    normalized[sanitizeObjectSegment(key, "meta").slice(0, 40)] = String(value)
      .replace(/[^\x20-\x7E]/g, "?")
      .slice(0, 1024);
  }
  return normalized;
}

export function getPublicObjectUrl(objectKey: string) {
  const baseUrl = getR2Config().publicBaseUrl;
  return baseUrl ? `${baseUrl}/${objectKey}` : "";
}

export async function getSignedObjectUrl(objectKey: string, expiresIn?: number) {
  const config = getR2Config();
  const ttl = Number.isFinite(expiresIn)
    ? Number(expiresIn)
    : Number.isFinite(config.signedUrlTtlSeconds) && config.signedUrlTtlSeconds > 0
      ? config.signedUrlTtlSeconds
      : 3600;

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey
    }),
    { expiresIn: ttl }
  );
}

export async function getObjectAccessUrl(objectKey?: string, fallbackUrl?: string) {
  if (!objectKey) return fallbackUrl || "";
  const publicUrl = getPublicObjectUrl(objectKey);
  if (publicUrl) return publicUrl;
  return getSignedObjectUrl(objectKey).catch(() => fallbackUrl || "");
}

export async function putTenantObject(input: TenantObjectInput): Promise<StoredObject> {
  const objectKey = buildTenantObjectKey({
    tenantId: input.tenantId,
    scope: input.scope,
    fileName: input.fileName
  });
  const bucket = getR2BucketName();
  const body = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: input.contentType || "application/octet-stream",
      ContentLength: body.length,
      Metadata: normalizeMetadata({
        tenantId: input.tenantId,
        originalName: input.fileName,
        ...input.metadata
      })
    })
  );

  const publicUrl = getPublicObjectUrl(objectKey) || undefined;
  const signedUrl = publicUrl ? undefined : await getSignedObjectUrl(objectKey).catch(() => undefined);

  return {
    storageProvider: "cloudflare-r2",
    bucket,
    objectKey,
    publicUrl,
    signedUrl,
    url: publicUrl || signedUrl,
    fileSizeBytes: body.length,
    mimeType: input.contentType
  };
}

export async function deleteTenantObject(objectKey?: string) {
  if (!objectKey) return;
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: objectKey
    })
  );
}
