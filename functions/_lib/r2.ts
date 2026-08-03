import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Client(env: Env) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function createPrivateDownloadUrl(env: Env, key: string, expiresIn = 900) {
  const s3 = getR2Client(env);
  
  // Verify object exists before signing URL
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  } catch (err: any) {
    console.error(`[R2 Error] Object missing or inaccessible: ${env.R2_BUCKET_NAME}/${key}`, err.message);
    throw new Error(`File not available: ${key}`);
  }

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${key.split("/").pop() || "download.zip"}"`,
    }),
    { expiresIn }
  );
}
