import { Box, Group, Stack, Text, Title, Avatar, Button } from '@mantine/core';
import {
  IconEdit,
  IconShare,
  IconBrandTelegram,
  IconBrandDiscord,
  IconBrandX,
} from '@tabler/icons-react';
import { ContributionForm } from './ContributionForm';

interface ProjectHeaderProps {
  projectName: string;
}

export function ProjectHeader({ projectName }: ProjectHeaderProps) {
  return (
    <Box>
      <Stack>
        <Avatar src="/homepage/step2-icon.png" size={82} radius="100%" />
        <Group justify="space-between" gap={16}>
          <Group>
            <Title order={1} size={48} fw={700}>
              {projectName}
            </Title>
          </Group>
          <Group>
            <Button variant="light" size="sm" p="8px 12px">
              <IconEdit size={16} />
            </Button>
            <Button variant="light" size="sm" p="8px 12px">
              <IconShare size={16} />
            </Button>
          </Group>
        </Group>
        <Group>
          <Stack style={{ width: 340 }}>
            <Text size="md" style={{ maxWidth: 600 }}>
              LXDAO is an R&D-focused DAO dedicated to building an Infinite
              Cycle that supports valuable Public Goods and open-source
              projects.
            </Text>
            <Group mt={20} gap={24}>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Contributions
                </Text>
                <Text size="md" fw={700}>
                  1.2k
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Pie Bakers
                </Text>
                <Text size="md" fw={700}>
                  100
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm" fw={700} c="gray.6">
                  Followers
                </Text>
                <Text size="md" fw={700}>
                  100
                </Text>
              </Stack>
            </Group>
            <Group mt={24} gap={24}>
              <Button variant="subtle" color="gray" p="0">
                <IconBrandTelegram size={32} />
              </Button>
              <Button variant="subtle" color="gray" p="0">
                <IconBrandDiscord size={32} />
              </Button>
              <Button variant="subtle" color="gray" p="0">
                <IconBrandX size={32} />
              </Button>
            </Group>
          </Stack>
          <ContributionForm />
        </Group>
      </Stack>
    </Box>
  );
}
