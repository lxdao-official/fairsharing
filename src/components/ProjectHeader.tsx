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
import { useState } from 'react';
import { ProjectEditModal } from './ProjectEditModal';

interface ProjectData {
  id: string;
  key: string;
  name: string;
  description: string;
  logo?: string | null;
  tokenSymbol?: string | null;
  links?: any;
  owner: {
    id: string;
    walletAddress: string;
    ensName?: string | null;
    name?: string | null;
    avatar?: string | null;
  };
  _count: {
    contributions: number;
    members: number;
    followers: number;
  };
}

interface ProjectHeaderProps {
  project: ProjectData;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Parse social links from project.links
  const links = project.links?.otherLinks || [];
  
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
        title: project.name,
        text: project.description,
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
          src={project.logo || '/homepage/step2-icon.png'} 
          size={82} 
          radius="100%" 
        />
        <Group justify="space-between" gap={16}>
          <Group>
            <Title order={1} size={48} fw={700}>
              {project.name}
            </Title>
            {project.tokenSymbol && (
              <Text size="lg" c="gray.6" fw={500}>
                (${project.tokenSymbol})
              </Text>
            )}
          </Group>
          <Group>
            <Button 
              variant="light" 
              size="sm" 
              p="8px 12px"
              onClick={() => setIsEditModalOpen(true)}
            >
              <IconEdit size={16} />
            </Button>
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
              {project.description}
            </Text>
            <Group mt={20} gap={24}>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Contributions
                </Text>
                <Text size="md" fw={700}>
                  {project._count.contributions.toLocaleString()}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Pie Bakers
                </Text>
                <Text size="md" fw={700}>
                  {project._count.members.toLocaleString()}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Followers
                </Text>
                <Text size="md" fw={700}>
                  {project._count.followers.toLocaleString()}
                </Text>
              </Stack>
            </Group>
            {links.length > 0 && (
              <Group mt={24} gap={24}>
                {links.map((link: any, index: number) => (
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
          <Box style={{ flex: 1 }}>
            <ContributionForm projectId={project.id} />
          </Box>
        </Group>
      </Stack>
      
      {/* Edit Project Modal */}
      <ProjectEditModal
        project={project}
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </Box>
  );
}
