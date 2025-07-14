import { Container, Stack } from '@mantine/core';
import { Layout } from '@/components/Layout';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { ProjectHeader } from '@/components/ProjectHeader';
import { ContributionsSection } from '@/components/ContributionsSection';
import { ContributorsSection } from '@/components/ContributorsSection';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProjectPageProps {
  params: Promise<{
    projectName: string;
  }>;
}

// Server-side data fetching function
async function getProjectData(projectKey: string) {
  try {
    const project = await db.project.findUnique({
      where: {
        key: projectKey,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            walletAddress: true,
            ensName: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
                ensName: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            contributions: {
              where: { deletedAt: null },
            },
            members: {
              where: { deletedAt: null },
            },
            followers: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return project;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

// Main page component with server-side rendering
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectName } = await params;
  const projectKey = decodeURIComponent(projectName);
  
  // Fetch project data on the server
  const project = await getProjectData(projectKey);
  
  // Return 404 if project not found
  if (!project) {
    notFound();
  }

  return (
    <Layout sidebar={<ProjectSidebar currentProject={projectKey} />}>
      <Container size="xl" style={{ maxWidth: 1200 }} pt={40} pb={60}>
        <Stack gap={64}>
          <ProjectHeader project={project} />
          <Suspense fallback={<LoadingSpinner />}>
            <ContributionsSection projectId={project.id} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <ContributorsSection />
          </Suspense>
        </Stack>
      </Container>
    </Layout>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: ProjectPageProps) {
  const { projectName } = await params;
  const projectKey = decodeURIComponent(projectName);
  const project = await getProjectData(projectKey);
  
  if (!project) {
    return {
      title: 'Project Not Found | FairSharing',
      description: 'The requested project could not be found.',
    };
  }

  return {
    title: `${project.name} | FairSharing`,
    description: project.description,
    openGraph: {
      title: project.name,
      description: project.description,
      images: project.logo ? [{ url: project.logo }] : [],
    },
  };
}
