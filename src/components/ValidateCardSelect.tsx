import { IconUser } from '@tabler/icons-react';
import { CardSelect } from './CardSelect';

interface ValidateCardSelectProps {
  value?: 'specific' | 'all';
  onChange?: (value: 'specific' | 'all') => void;
  error?: string;
}

function ValidateCardSelect({
  value = 'specific',
  onChange,
  error,
}: ValidateCardSelectProps) {
  const options: {
    key: 'specific' | 'all';
    icon: React.ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      key: 'specific',
      icon: <IconUser size={32} />,
      title: 'Specific Members',
      description: "Only members added as 'validator'",
    },
    {
      key: 'all',
      icon: <IconUser size={32} />,
      title: 'Every Contributor',
      description: 'Anyone contributed to this project',
    },
  ];

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={onChange as (v: 'specific' | 'all') => void}
      error={error}
    />
  );
}

export { ValidateCardSelect };
