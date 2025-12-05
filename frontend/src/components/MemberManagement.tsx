import React, { useState } from 'react';
import {
  Box,
  Group,
  Text,
  Checkbox,
  Tooltip,
  Button,
  ActionIcon,
} from '@mantine/core';
import { IconPlus, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { AddressInput } from './AddressInput';
import type { ProjectMemberInput } from '@/types/project';

export type Member = ProjectMemberInput;

interface MemberManagementProps {
  value?: ProjectMemberInput[];
  onChange?: (members: ProjectMemberInput[]) => void;
  ownerAddress: string;
}

function MemberManagement({
  value = [],
  onChange,
  ownerAddress,
}: MemberManagementProps) {
  const [memberError, setMemberError] = useState<string | null>(null);
  const normalizedOwner = ownerAddress.toLowerCase();
  const normalizeAddress = (address: string) => address.trim().toLowerCase();
  // Ensure we always have at least one member
  const ensureOwnerPresent = (membersList: ProjectMemberInput[]) => {
    const hasOwner = membersList.some(
      (member) => member.address.toLowerCase() === normalizedOwner,
    );

    if (!hasOwner) {
      return [
        {
          address: ownerAddress,
          isAdmin: true,
          isValidator: true,
          isContributor: true,
        },
        ...membersList,
      ];
    }

    return membersList.map((member) =>
      member.address.toLowerCase() === normalizedOwner
        ? {
            ...member,
            address: ownerAddress,
            isAdmin: true,
            isValidator: true,
            isContributor: true,
          }
        : member,
    );
  };

  const members = ensureOwnerPresent(
    value.length > 0
      ? value
      : [
          {
            address: '',
            isValidator: false,
            isContributor: false,
            isAdmin: false,
          },
        ],
  );

  const hasDuplicateAddress = (address: string, indexToSkip?: number) => {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) return false;
    return members.some(
      (member, i) =>
        i !== indexToSkip &&
        normalizeAddress(member.address) === normalizedAddress,
    );
  };

  const addMember = () => {
    const hasEmptyRow = members.some((member) => member.address.trim() === '');
    if (hasEmptyRow) return;
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
    if (members[index].address.toLowerCase() === normalizedOwner) {
      return;
    }
    if (field === 'address' && typeof newValue === 'string') {
      if (hasDuplicateAddress(newValue, index)) {
        setMemberError('Member addresses must be unique');
        return;
      }
    }

    const updatedMembers = members.map((member, i) =>
      i === index ? { ...member, [field]: newValue } : member,
    );
    onChange?.(updatedMembers);
    setMemberError(null);
  };

  const removeMember = (index: number) => {
    if (
      members[index].address.toLowerCase() === normalizedOwner ||
      members.length <= 1
    ) {
      return;
    }
    const filteredMembers = members.filter((_, i) => i !== index);
    onChange?.(filteredMembers);
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

      {memberError && (
        <Text size="sm" c="red" mb={12}>
          {memberError}
        </Text>
      )}

      {members.map((member, index) => (
        <Group key={`member-${index}`} align="center" mb={12}>
          <Box style={{ width: 320 }}>
            <AddressInput
              value={member.address}
              onChange={(newAddress) =>
                updateMember(index, 'address', newAddress)
              }
              placeholder="0x... or name.eth"
              disabled={member.address.toLowerCase() === normalizedOwner}
            />
            {member.address.toLowerCase() === normalizedOwner && (
              <Text size="xs" c="gray.6" mt={4}>
                Owner (read-only)
              </Text>
            )}
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
                disabled={member.address.toLowerCase() === normalizedOwner}
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
                disabled={member.address.toLowerCase() === normalizedOwner}
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
                disabled={member.address.toLowerCase() === normalizedOwner}
              />
            </Box>
          </Group>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => removeMember(index)}
            disabled={
              members.length === 1 ||
              member.address.toLowerCase() === normalizedOwner
            }
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
