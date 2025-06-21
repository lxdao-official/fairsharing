import React from 'react';
import {
  Box,
  Group,
  Text,
  TextInput,
  Checkbox,
  Tooltip,
  Button,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { AddressInput } from './AddressInput';

// External member interface for form data
export interface Member {
  address: string;
  isValidator: boolean;
  isContributor: boolean;
  isAdmin: boolean;
}

interface MemberManagementProps {
  value?: Member[];
  onChange?: (members: Member[]) => void;
}

function MemberManagement({ value = [], onChange }: MemberManagementProps) {
  // Ensure we always have at least one member
  const members =
    value.length > 0
      ? value
      : [
          {
            address: '',
            isValidator: false,
            isContributor: false,
            isAdmin: false,
          },
        ];

  const addMember = () => {
    const newMember: Member = {
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    };
    onChange?.([...members, newMember]);
  };

  const updateMember = (
    index: number,
    field: keyof Member,
    newValue: string | boolean,
  ) => {
    const updatedMembers = members.map((member, i) =>
      i === index ? { ...member, [field]: newValue } : member,
    );
    onChange?.(updatedMembers);
  };

  const removeMember = (index: number) => {
    // Keep at least one member row
    if (members.length > 1) {
      const filteredMembers = members.filter((_, i) => i !== index);
      onChange?.(filteredMembers);
    }
  };

  return (
    <Box>
      <Group align="center" mb={16} display="flex">
        <Text style={{ fontWeight: 700, fontSize: 16, width: 320 }}>
          Member (Wallet address or ENS)
        </Text>
        <Group gap={48} ml="auto" style={{ paddingRight: 16 }}>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Validator</Text>
            <Tooltip
              label="The person can vote to validate contributions."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Contributor</Text>
            <Tooltip
              label="The person can submit contributions."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
          <Group align="center" gap={8}>
            <Text style={{ fontWeight: 600, fontSize: 14 }}>Admin</Text>
            <Tooltip
              label="The person can manage project settings."
              position="top"
              withArrow
              styles={{
                tooltip: {
                  backgroundColor: '#FEF6C7',
                  color: '#000',
                  border: '1px solid #FFDD44',
                  fontSize: 12,
                  padding: '8px 12px',
                },
              }}
            >
              <IconInfoCircle size={16} color="#6B7280" />
            </Tooltip>
          </Group>
        </Group>
      </Group>

      {members.map((member, index) => (
        <Group key={`member-${index}`} align="center" mb={12}>
          <Box style={{ width: 320 }}>
            <AddressInput
              value={member.address}
              onChange={(newAddress) =>
                updateMember(index, 'address', newAddress)
              }
              placeholder="0x... or name.eth"
            />
          </Box>
          <Group gap={48} ml="auto">
            <Box
              style={{ width: 80, display: 'flex', justifyContent: 'center' }}
            >
              <Checkbox
                checked={member.isValidator}
                onChange={(event) =>
                  updateMember(
                    index,
                    'isValidator',
                    event.currentTarget.checked,
                  )
                }
              />
            </Box>
            <Box
              style={{ width: 80, display: 'flex', justifyContent: 'center' }}
            >
              <Checkbox
                checked={member.isContributor}
                onChange={(event) =>
                  updateMember(
                    index,
                    'isContributor',
                    event.currentTarget.checked,
                  )
                }
              />
            </Box>
            <Box
              style={{ width: 80, display: 'flex', justifyContent: 'center' }}
            >
              <Checkbox
                checked={member.isAdmin}
                onChange={(event) =>
                  updateMember(index, 'isAdmin', event.currentTarget.checked)
                }
              />
            </Box>
          </Group>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => removeMember(index)}
            disabled={members.length === 1}
            style={{ marginLeft: 8 }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        leftSection={<IconPlus size={16} />}
        variant="light"
        onClick={addMember}
        mt={12}
        style={{
          backgroundColor: '#F3F4F6',
          color: '#374151',
          border: 'none',
        }}
      >
        Add Member
      </Button>
    </Box>
  );
}

export default MemberManagement;
