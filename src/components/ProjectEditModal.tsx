'use client';

import { Modal, Text } from '@mantine/core';

interface ProjectEditModalProps {
  project: any;
  opened: boolean;
  onClose: () => void;
}

export function ProjectEditModal({ project, opened, onClose }: ProjectEditModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Project"
      size="lg"
      centered
    >
      <Text>Project editing functionality will be implemented here.</Text>
      <Text size="sm" c="gray.6" mt={8}>
        Project: {project.name}
      </Text>
    </Modal>
  );
}