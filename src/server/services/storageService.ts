/**
 * Supabase Storage Service
 * 
 * Manages uploading, reading, and generating signed URLs for analytical report artifacts.
 * Storage structure: reports/{ventureId}/{reportType}/{fileName}.pdf
 */

import { getSupabaseAdmin, isSupabaseConfigured } from '../db/supabase';

export interface StorageUploadResult {
  storageBucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  signedUrl?: string;
  publicUrl?: string;
}

export class StorageService {
  private bucketName = 'reports';

  /**
   * Uploads a report file into Supabase Storage under `reports/{ventureId}/{reportType}/{fileName}`
   */
  async uploadReportFile(
    ventureId: string,
    reportType: 'research' | 'business' | 'red_team' | 'judge' | 'decision',
    fileName: string,
    fileBuffer: Buffer | Uint8Array | string,
    mimeType: string = 'application/pdf'
  ): Promise<StorageUploadResult> {
    const formattedType = reportType.replace('_', '-');
    const storagePath = `${ventureId}/${formattedType}/${fileName}`;
    const fileSize = typeof fileBuffer === 'string' ? Buffer.byteLength(fileBuffer) : fileBuffer.byteLength;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.warn(`[Supabase Storage] Failed upload to ${storagePath}: ${error.message}. Returning metadata record.`);
      }

      // Generate a 1-hour signed URL for secure download
      let signedUrl: string | undefined;
      try {
        const { data: signedData } = await supabase.storage
          .from(this.bucketName)
          .createSignedUrl(storagePath, 3600);
        signedUrl = signedData?.signedUrl;
      } catch (err) {
        // Non-critical
      }

      return {
        storageBucket: this.bucketName,
        storagePath: data?.path || storagePath,
        fileName,
        mimeType,
        fileSize,
        signedUrl,
      };
    }

    // Local / In-memory fallback
    return {
      storageBucket: this.bucketName,
      storagePath,
      fileName,
      mimeType,
      fileSize,
      signedUrl: `/api/reports/download/${ventureId}/${formattedType}/${fileName}`,
    };
  }

  /**
   * Creates a signed download URL for an existing stored report
   */
  async getReportSignedUrl(storagePath: string, expiresInSeconds: number = 3600): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresInSeconds);
      
      if (error) {
        console.error(`[Supabase Storage] Error creating signed URL for ${storagePath}:`, error.message);
        return null;
      }
      return data?.signedUrl || null;
    }

    return `/api/reports/download/${storagePath}`;
  }

  /**
   * Deletes a report file from Supabase Storage
   */
  async deleteReportFile(storagePath: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error } = await supabase.storage.from(this.bucketName).remove([storagePath]);
      return !error;
    }
    return true;
  }
}

export const storageService = new StorageService();
