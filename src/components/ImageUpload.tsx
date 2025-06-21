'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Text,
  Image,
  ActionIcon,
  Loader,
  Alert,
  Group,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconX, IconPhoto, IconEdit } from '@tabler/icons-react';
import { api } from '@/utils/trpc';

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  size?: number;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  size = 200,
  placeholder = 'Upload project logo',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropzoneRef = useRef<any>(null);

  const uploadMutation = api.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      onChange?.(data.url);
      setIsUploading(false);
      setError(null);
    },
    onError: (error) => {
      setIsUploading(false);
      setError(error.message || 'Upload failed');
    },
  });

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange?.(null);
    setError(null);
  };

  const openFileDialog = () => {
    dropzoneRef.current?.();
  };

  return (
    <Box>
      <Dropzone
        ref={dropzoneRef}
        onDrop={handleFileUpload}
        onReject={() => setError('Invalid file type or size')}
        maxSize={5 * 1024 * 1024} // 5MB
        accept={IMAGE_MIME_TYPE}
        disabled={isUploading}
        style={{
          width: size,
          height: size,
          border: value ? 'none' : '2px dashed #e9ecef',
          borderRadius: 12,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {value ? (
          <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={value}
              alt="Uploaded"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />

            {/* Overlay with edit and remove buttons */}
            <Box
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                borderRadius: 12,
              }}
              className="image-overlay"
            >
              <Group gap="sm">
                <ActionIcon
                  variant="filled"
                  color="white"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                >
                  <IconEdit size={18} />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  color="red"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <IconX size={18} />
                </ActionIcon>
              </Group>
            </Box>
          </Box>
        ) : (
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 20,
              textAlign: 'center',
            }}
          >
            {isUploading ? (
              <>
                <Loader size="md" mb="sm" />
                <Text size="sm" c="dimmed">
                  Uploading...
                </Text>
              </>
            ) : (
              <>
                <IconPhoto
                  size={40}
                  color="#adb5bd"
                  style={{ marginBottom: 8 }}
                />
                <Text size="sm" fw={500} mb={4}>
                  {placeholder}
                </Text>
                <Text size="xs" c="dimmed">
                  Drag & drop or click to select
                </Text>
                <Text size="xs" c="dimmed">
                  PNG, JPG up to 5MB
                </Text>
              </>
            )}
          </Box>
        )}
      </Dropzone>

      {error && (
        <Alert color="red" mt="sm" variant="light">
          {error}
        </Alert>
      )}

      <style jsx global>{`
        .image-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </Box>
  );
}
