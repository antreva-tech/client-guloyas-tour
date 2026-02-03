import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { requireAdminOrSupport, applyRateLimit } from "@/lib/apiAuth";

/**
 * Allowed image MIME types for upload validation.
 */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Magic byte signatures for file type verification.
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/jpg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
};

/**
 * Maximum file size in bytes (5MB).
 */
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Verifies file content matches expected magic bytes for the MIME type.
 * @param buffer - File content buffer.
 * @param mimeType - Claimed MIME type.
 * @returns True if magic bytes match, false otherwise.
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((signature) => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Generates a unique filename with timestamp and random string.
 * @param originalName - The original filename.
 * @param prefix - Optional folder prefix (e.g. "hotel-offers"); defaults to "products".
 * @returns A unique filename path.
 */
function generateUniqueFilename(originalName: string, prefix?: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const folder = prefix && /^[a-z0-9-]+$/.test(prefix) ? prefix : "products";
  return `${folder}/${timestamp}-${random}.${ext}`;
}

/**
 * POST /api/upload
 * Handles image file uploads for products using Vercel Blob storage.
 * Requires admin authentication.
 * @param request - The incoming request with FormData.
 * @returns JSON with the uploaded file URL.
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting for uploads (10 per minute)
  const { error: rateLimitError } = await applyRateLimit("/api/upload", "upload");
  if (rateLimitError) return rateLimitError;

  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prefix = (formData.get("prefix") as string)?.trim();

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (MIME from header)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Read file content into buffer for magic byte verification
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify magic bytes match claimed MIME type
    if (!verifyMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }

    // Generate unique filename for blob storage (optional prefix: hotel-offers, etc.)
    const pathname = generateUniqueFilename(file.name, prefix);

    // Upload to Vercel Blob
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false, // We already add our own unique suffix
    });

    // Return the public URL
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Deletes an image from Vercel Blob storage.
 * Requires admin authentication.
 * @param request - The incoming request with URL to delete.
 * @returns Empty response on success.
 */
export async function DELETE(request: NextRequest) {
  // Require admin authentication
  const authError = await requireAdminOrSupport();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const urlToDelete = searchParams.get("url");

    if (!urlToDelete) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    await del(urlToDelete);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
