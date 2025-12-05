'use client';

import { Box, Group, Stack, Text, Title, Avatar, Button } from '@mantine/core';
import {
  IconEdit,
  IconShare,
  IconBrandTelegram,
  IconBrandDiscord,
  IconBrandX,
  IconBrandGithub,
  IconWorld,
} from '@tabler/icons-react';
import { ContributionForm } from './ContributionForm';
import { VotingEligibilityPanel } from './VotingEligibilityPanel';
import { useEffect, useMemo, useState } from 'react';
import { ProjectEditModal } from './ProjectEditModal';
import { useAuth } from '@/hooks/useAuth';
import type { ProjectDetails, ProjectLinkInput } from '@/types/project';

interface ProjectHeaderProps {
  project: ProjectDetails;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectData, setProjectData] = useState<ProjectDetails>(project);
  const { session } = useAuth();
  const currentUserId = session?.user.id;

  const links =
    (projectData.links?.otherLinks as ProjectLinkInput[] | undefined) || [];

  const canEdit = useMemo(() => {
    if (!currentUserId) return false;
    return projectData.members.some(
      (member) =>
        member.user.id === currentUserId &&
        member.role.includes('ADMIN'),
    );
  }, [currentUserId, projectData.members]);
  
  const handleProjectUpdated = (updatedProject: ProjectDetails) => {
    setProjectData(updatedProject);
  };

  useEffect(() => {
    setProjectData(project);
  }, [project]);
  
  // Helper function to get icon for link type
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'twitter':
        return <IconBrandX size={32} />;
      case 'telegram':
        return <IconBrandTelegram size={32} />;
      case 'discord':
        return <IconBrandDiscord size={32} />;
      case 'github':
        return <IconBrandGithub size={32} />;
      case 'website':
      case 'custom':
      default:
        return <IconWorld size={32} />;
    }
  };
  
  // Helper function to share project
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: projectData.name,
        text: projectData.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Box>
      <Stack>
        <Avatar 
          src={projectData.logo || '/homepage/step2-icon.png'} 
          size={82} 
          radius="100%" 
        />
        <Group justify="space-between" gap={16}>
          <Group>
            <Title order={1} size={48} fw={700}>
              {projectData.name}
            </Title>
            {projectData.tokenSymbol && (
              <Text size="lg" c="gray.6" fw={500}>
                (${projectData.tokenSymbol})
              </Text>
            )}
          </Group>
          <Group>
            {canEdit && (
              <Button 
                variant="light" 
                size="sm" 
                p="8px 12px"
                onClick={() => setIsEditModalOpen(true)}
              >
                <IconEdit size={16} />
              </Button>
            )}
            <Button 
              variant="light" 
              size="sm" 
              p="8px 12px"
              onClick={handleShare}
            >
              <IconShare size={16} />
            </Button>
          </Group>
        </Group>
        <Group display="flex" gap={16} align="flex-start">
          <Stack style={{ width: 340, flexShrink: 0 }}>
            <Text size="md" style={{ maxWidth: 600 }}>
              {projectData.description}
            </Text>
            <Group mt={20} gap={24}>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Contributions
                </Text>
                <Text size="md" fw={700}>
                  {projectData._count.contributions.toLocaleString()}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Pie Bakers
                </Text>
                <Text size="md" fw={700}>
                  {projectData._count.members.toLocaleString()}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Followers
                </Text>
                <Text size="md" fw={700}>
                  {projectData._count.followers.toLocaleString()}
                </Text>
              </Stack>
            </Group>
            {links.length > 0 && (
              <Group mt={24} gap={24}>
                {links.map((link, index) => (
                  <Button 
                    key={index}
                    variant="subtle" 
                    color="gray" 
                    p="0"
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getLinkIcon(link.type)}
                  </Button>
                ))}
              </Group>
            )}
          </Stack>
          <Stack gap={24} style={{ flex: 1 }}>
            <ContributionForm projectId={projectData.id} />
            <VotingEligibilityPanel project={projectData} />
          </Stack>
        </Group>
      </Stack>
      
      {/* Edit Project Modal */}
      {canEdit && (
        <ProjectEditModal
          project={projectData}
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </Box>
  );
}
