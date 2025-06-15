import { Group, Box, Text } from '@mantine/core';

function CardSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {
    key: T;
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Group gap={8}>
      {options.map((opt) => (
        <CardOption
          key={opt.key}
          icon={opt.icon}
          title={opt.title}
          description={opt.description}
          active={value === opt.key}
          onClick={() => onChange(opt.key)}
        />
      ))}
    </Group>
  );
}

function CardOption({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      style={{
        flex: 1,
        cursor: 'pointer',
        border: active ? '1px solid #FFDD44' : '1px solid #e5e7eb',
        background: active ? '#FEF6C7' : '#fff',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 260,
        maxWidth: 320,
        transition: 'all 0.2s',
      }}
    >
      <Box style={{ marginRight: 12 }}>{icon}</Box>
      <Box style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Text style={{ fontWeight: 700, fontSize: 14 }}>{title}</Text>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>{description}</Text>
      </Box>
    </Box>
  );
}

export { CardSelect, CardOption };
