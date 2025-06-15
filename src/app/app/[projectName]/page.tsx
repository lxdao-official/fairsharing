'use client';

import { Container } from '@mantine/core';
import { Layout } from '@/components/Layout';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { ProjectHeader } from '@/components/ProjectHeader';
import { useParams } from 'next/navigation';

export default function ProjectPage() {
  const params = useParams();
  const projectName = Array.isArray(params.projectName)
    ? params.projectName[0]
    : params.projectName || '';

  // Convert URL-friendly name to display name
  const displayName =
    projectName.charAt(0).toUpperCase() + projectName.slice(1);

  return (
    <Layout sidebar={<ProjectSidebar currentProject={projectName} />}>
      <Container size="xl" style={{ maxWidth: 1200 }} pt={40}>
        <ProjectHeader projectName={displayName} />
      </Container>
    </Layout>
  );
}
