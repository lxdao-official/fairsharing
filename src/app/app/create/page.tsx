'use client';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import {
  Container,
  Title,
  Group,
  Text,
  TextInput,
  Stack,
  AppShell,
  Textarea,
  Box,
  Button,
} from '@mantine/core';
import { ValidateCardSelect } from '@/components/ValidateCardSelect';
import { SubmitterCardSelect } from '@/components/SubmitterCardSelect';
import { ValidationStrategySelect } from '@/components/ValidationStrategySelect';
import { MemberManagement } from '@/components/MemberManagement';
import { OtherLinksManagement } from '@/components/OtherLinksManagement';
import { ImageUpload } from '@/components/ImageUpload';
import { useState } from 'react';

export default function CreateProjectPage() {
  const [projectLogo, setProjectLogo] = useState<string | null>(null);

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl" pb={48} style={{ maxWidth: 1280 }}>
          <Title
            order={1}
            mt={56}
            mb={56}
            style={{
              fontSize: 48,
            }}
          >
            Create My Pie
          </Title>
          <Group align="flex-start" gap={48}>
            <Title order={2}>Project Information</Title>
            <Stack style={{ flex: 1, maxWidth: 785 }}>
              {/* Project Logo Upload */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }} mb={8}>
                  Project Logo
                </Text>
                <Text
                  style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}
                >
                  Upload a square logo for your project (recommended size:
                  200x200px)
                </Text>
                <ImageUpload
                  value={projectLogo}
                  onChange={setProjectLogo}
                  size={200}
                  placeholder="Upload project logo"
                />
              </Box>

              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Project Name
                  </span>
                }
                required
                placeholder=""
                radius="sm"
              />

              <Textarea
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Description
                  </span>
                }
                required
                description={
                  <span style={{ color: '#6B7280', fontSize: 16 }}>
                    No more than 140 words
                  </span>
                }
                minRows={5}
                maxRows={8}
                radius="sm"
              />

              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Token Name
                  </span>
                }
                required
                description={
                  <span style={{ color: '#6B7280', fontSize: 16 }}>
                    Token representing contributions in your project
                    (doesn&apos;t have to be an on-chain token)
                  </span>
                }
                placeholder="TOKEN_NAME"
                radius="sm"
                styles={{
                  input: {
                    width: '160px',
                  },
                }}
              />

              {/* Who can validate contributions? */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Who can validate contributions?
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Text
                  style={{
                    color: '#6B7280',
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  In FairSharing, contributions must be validated before
                  they&apos;re recorded on-chain. Select who will have the
                  authority to validate contributions for your project.
                </Text>
                <ValidateCardSelect />
              </Box>

              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Validation Approval Strategy
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Text
                  style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                >
                  If you need furthur customization, please contact the
                  Fairsharing team.
                </Text>
                <ValidationStrategySelect />
              </Box>

              {/* Validation Period */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Validation Period
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <Group align="center" mt={8} mb={8}>
                  <TextInput
                    placeholder="5"
                    style={{ width: 100 }}
                    radius="sm"
                    size="sm"
                  />
                  <Text fw={800} style={{ color: '#6B7280' }}>
                    Days
                  </Text>
                </Group>
              </Box>

              {/* Who can submit contributions? */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }} mb={8}>
                  Who can submit contributions?
                  <span style={{ color: '#F43F5E', marginLeft: 4 }}>*</span>
                </Text>
                <SubmitterCardSelect />
              </Box>

              {/* Default Hourly Pay */}
              <Box>
                <Text style={{ fontWeight: 700, fontSize: 16 }}>
                  Default Hourly Pay
                </Text>
                <Text
                  style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}
                >
                  Used to calculate contribution value as &apos;hours worked ×
                  hourly rate&apos;. You can later set custom rates for each
                  contributor. If left blank or set to 0, contributors can claim
                  tokens freely.
                </Text>
                <Group align="center" mt={8}>
                  <TextInput
                    placeholder="0"
                    style={{ width: 120 }}
                    radius="sm"
                    size="sm"
                  />
                  <Text style={{ color: '#6B7280', fontWeight: 800 }}>
                    TOKEN_NAME/hour
                  </Text>
                </Group>
              </Box>
            </Stack>
          </Group>
          {/* Team Member Section */}
          <Group align="flex-start" gap={48} mt={56}>
            <Box style={{ minWidth: 260 }}>
              <Title order={2}>Team Member</Title>
              <Text c="#6B7280" style={{ fontSize: 14 }}>
                This part is optional.
                <br />
                You can edit it later in the project page.
              </Text>
            </Box>
            <Box style={{ flex: 1, maxWidth: 785 }}>
              <TextInput
                label={
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    Project Owner (Wallet address or ENS)
                  </span>
                }
                description={
                  <span style={{ color: '#6B7280', fontSize: 14 }}>
                    Defaults to the project creator.
                  </span>
                }
                placeholder="0x123456"
                radius="sm"
                size="md"
              />

              {/* Member Management */}
              <Box mt={24}>
                <MemberManagement />
              </Box>
            </Box>
          </Group>

          {/* Other Links Section */}
          <Group align="flex-start" gap={48} mt={56}>
            <Box style={{ minWidth: 260 }}>
              <Title order={2}>Other Links</Title>
              <Text c="#6B7280" style={{ fontSize: 14 }}>
                This part is optional.
                <br />
                You can edit it later in the project page.
              </Text>
            </Box>
            <Box style={{ flex: 1, maxWidth: 785 }}>
              <OtherLinksManagement />
            </Box>
          </Group>

          <Group justify="flex-end" gap={48} mt={24}>
            <Box style={{ minWidth: 260 }}></Box>
            <Box style={{ flex: 1 }}>
              <Button size="md" radius="md" color="secondary">
                Create My Pie
              </Button>
            </Box>
          </Group>
        </Container>
      </AppShell.Main>

      <AppShell.Footer style={{ position: 'static' }}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
