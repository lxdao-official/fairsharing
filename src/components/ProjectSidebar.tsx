import { Box, Stack } from '@mantine/core';
import { SidebarIcon } from '@/components/SidebarIcon';
import { IconHome } from '@tabler/icons-react';

interface Project {
  id: string;
  name: string;
  avatar: string;
}

const mockProjects: Project[] = [
  {
    id: 'lxdao',
    name: 'LXDAO Working Group',
    avatar: '/homepage/step2-icon.png',
  },
  {
    id: 'project2',
    name: 'Another Project',
    avatar: '/homepage/step1-icon.png',
  },
  { id: 'project3', name: 'Third Project', avatar: '/homepage/step3-icon.png' },
];

interface ProjectSidebarProps {
  currentProject?: string;
}

export function ProjectSidebar({ currentProject }: ProjectSidebarProps) {
  return (
    <Box
      style={{
        width: 80,
        backgroundColor: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        minHeight: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        alignSelf: 'flex-start',
      }}
    >
      {/* Home Button */}
      <Box style={{ marginBottom: '12px' }}>
        <SidebarIcon href="/">
          <IconHome size={24} color="#000000" />
        </SidebarIcon>
      </Box>

      {/* Projects */}
      <Stack gap={12} align="center">
        {mockProjects.map((project) => {
          const isActive = currentProject === project.id;
          return (
            <SidebarIcon
              key={project.id}
              href={`/app/${project.id}`}
              avatar={project.avatar}
              isActive={isActive}
            />
          );
        })}
      </Stack>
    </Box>
  );
}
