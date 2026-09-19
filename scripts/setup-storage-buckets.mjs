/**
 * Repeatable storage bucket configuration (defense in depth next to the
 * `is_allowed_upload` policy check on storage.objects).
 *
 * The migration runner rejects any INSERT/UPDATE on `storage.buckets`, so the
 * allowed MIME types and size limits are applied through the Storage Admin API
 * instead. This script is idempotent — running it again just re-applies the
 * same configuration.
 *
 * Usage (never commit the key):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun scripts/setup-storage-buckets.mjs
 */

const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const CHAT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/aac",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MB = 1024 * 1024;

const BUCKETS = [
  { name: "avatars", public: false, file_size_limit: 5 * MB, allowed_mime_types: IMAGES },
  { name: "credentials", public: false, file_size_limit: 10 * MB, allowed_mime_types: DOCS },
  { name: "facility-docs", public: false, file_size_limit: 10 * MB, allowed_mime_types: DOCS },
  { name: "chat-attachments", public: false, file_size_limit: 10 * MB, allowed_mime_types: CHAT },
];

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

for (const bucket of BUCKETS) {
  const res = await fetch(`${url}/storage/v1/bucket/${bucket.name}`, {
    method: "PUT",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(bucket),
  });
  const body = await res.text();
  console.log(`${bucket.name}: ${res.status} ${body}`);
  if (!res.ok) process.exitCode = 1;
}
