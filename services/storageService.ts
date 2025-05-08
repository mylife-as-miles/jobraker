import { supabase } from '../utils/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Bucket name for resumes
const RESUME_BUCKET = 'resumes';

// Upload a resume file to Supabase Storage
export const uploadResume = async (userId: string, uri: string, fileName: string): Promise<string | null> => {
  try {
    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Read file content as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer (required by Supabase)
    const arrayBuffer = decode(base64);

    // File name with userId to ensure uniqueness
    const path = `${userId}/${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(path, arrayBuffer, {
        contentType: getContentType(fileName),
        upsert: true,
      });

    if (error) throw error;

    // Return the full path that can be stored in the database
    return path;
  } catch (error) {
    console.error('Error uploading resume:', error);
    return null;
  }
};

// Get download URL for a stored resume
export const getResumeUrl = async (filePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(filePath, 3600); // URL valid for 1 hour

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting resume URL:', error);
    return null;
  }
};

// Delete a stored resume
export const deleteResume = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(RESUME_BUCKET)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting resume:', error);
    return false;
  }
};

// Helper to determine content type based on file extension
const getContentType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
};