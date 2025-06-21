import { useState, useEffect } from 'react';
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
import { generateId } from '@/utils/generateId';

// Internal member interface with ID for component state
interface InternalMember {
  id: string;
  address: string;
  isValidator: boolean;
  isContributor: boolean;
  isAdmin: boolean;
}

// External member interface without ID for form data
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
  // Convert external members to internal members with IDs
  const [internalMembers, setInternalMembers] = useState<InternalMember[]>(
    () => {
      if (value.length > 0) {
        return value.map((member) => ({
          id: generateId(),
          ...member,
        }));
      }
      return [
        {
          id: generateId(),
          address: '',
          isValidator: false,
          isContributor: false,
          isAdmin: false,
        },
      ];
    },
  );

  // Update internal state when external value changes
  useEffect(() => {
    if (value.length > 0) {
      setInternalMembers(
        value.map((member) => ({
          id: generateId(),
          ...member,
        })),
      );
    }
  }, [value]);

  const addMember = () => {
    const newMember: InternalMember = {
      id: generateId(),
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    };
    const updatedMembers = [...internalMembers, newMember];
    setInternalMembers(updatedMembers);

    // Transform data to remove id before sending to parent
    const transformedMembers = updatedMembers.map(({ id, ...rest }) => rest);
    onChange?.(transformedMembers);
  };

  const updateMember = (
    id: string,
    field: keyof InternalMember,
    value: string | boolean,
  ) => {
    const updatedMembers = internalMembers.map((member) =>
      member.id === id ? { ...member, [field]: value } : member,
    );
    setInternalMembers(updatedMembers);

    // Transform data to remove id before sending to parent
    const transformedMembers = updatedMembers.map(({ id, ...rest }) => rest);
    onChange?.(transformedMembers);
  };

  const removeMember = (id: string) => {
    // Keep at least one member row
    if (internalMembers.length > 1) {
      const filteredMembers = internalMembers.filter(
        (member) => member.id !== id,
      );
      setInternalMembers(filteredMembers);

      // Transform data to remove id before sending to parent
      const transformedMembers = filteredMembers.map(({ id, ...rest }) => rest);
      onChange?.(transformedMembers);
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

      {internalMembers.map((member) => (
        <Group key={member.id} align="center" mb={12} gap={16} display="flex">
          <AddressInput
            placeholder="0x123456... or username.eth"
            value={member.address}
            onChange={(value) => updateMember(member.id, 'address', value)}
            style={{ width: 320 }}
            radius="sm"
            size="sm"
          />
          <Group gap={48} ml="auto" style={{ paddingRight: 16 }}>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isValidator}
                onChange={(e) =>
                  updateMember(member.id, 'isValidator', e.target.checked)
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isContributor}
                onChange={(e) =>
                  updateMember(member.id, 'isContributor', e.target.checked)
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
            <Box
              style={{ display: 'flex', justifyContent: 'center', width: 80 }}
            >
              <Checkbox
                checked={member.isAdmin}
                onChange={(e) =>
                  updateMember(member.id, 'isAdmin', e.target.checked)
                }
                styles={{
                  input: {
                    width: 20,
                    height: 20,
                    '&:checked': {
                      backgroundColor: '#FFDD44',
                      borderColor: '#FFDD44',
                    },
                  },
                }}
              />
            </Box>
            <Box
              style={{ width: 40, display: 'flex', justifyContent: 'center' }}
            >
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => removeMember(member.id)}
                disabled={internalMembers.length === 1}
                style={{ opacity: internalMembers.length === 1 ? 0.3 : 1 }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Box>
          </Group>
        </Group>
      ))}

      <Button
        rightSection={<IconPlus size={16} />}
        onClick={addMember}
        variant="filled"
        color="primary"
        radius="md"
        size="sm"
        mt={8}
      >
        Add
      </Button>
    </Box>
  );
}

export { MemberManagement };
