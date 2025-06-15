import { useState } from 'react';
import {
  Box,
  Group,
  Text,
  TextInput,
  Checkbox,
  Tooltip,
  Button,
} from '@mantine/core';
import { IconPlus, IconInfoCircle } from '@tabler/icons-react';

interface Member {
  address: string;
  isValidator: boolean;
  isContributor: boolean;
  isAdmin: boolean;
}

function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([
    {
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    },
  ]);

  const addMember = () => {
    const newMember: Member = {
      address: '',
      isValidator: false,
      isContributor: false,
      isAdmin: false,
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (address: string, field: keyof Member, value: any) => {
    setMembers(
      members.map((member) =>
        member.address === address ? { ...member, [field]: value } : member,
      ),
    );
  };

  const removeMember = (address: string) => {
    setMembers(members.filter((member) => member.address !== address));
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

      {members.map((member) => (
        <Group
          key={member.address}
          align="center"
          mb={12}
          gap={16}
          display="flex"
        >
          <TextInput
            placeholder="0x123456"
            value={member.address}
            onChange={(e) =>
              updateMember(member.address, 'address', e.target.value)
            }
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
                  updateMember(member.address, 'isValidator', e.target.checked)
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
                  updateMember(
                    member.address,
                    'isContributor',
                    e.target.checked,
                  )
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
                  updateMember(member.address, 'isAdmin', e.target.checked)
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
