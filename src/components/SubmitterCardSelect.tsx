import { IconLock } from '@tabler/icons-react';
import { CardSelect } from './CardSelect';

interface SubmitterCardSelectProps {
  value?: 'everyone' | 'restricted';
  onChange?: (value: 'everyone' | 'restricted') => void;
  error?: string;
}

function SubmitterCardSelect({
  value = 'everyone',
  onChange,
  error,
}: SubmitterCardSelectProps) {
  const options: {
    key: 'everyone' | 'restricted';
    icon: React.ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      key: 'everyone',
      icon: <IconLock size={28} />,
      title: 'Everyone',
      description: 'All people using FairSharing',
    },
    {
      key: 'restricted',
      icon: <IconLock size={28} />,
      title: 'Restricted',
      description: 'Only members invited to this project',
    },
  ];

  return (
    <CardSelect
      options={options}
      value={value}
      onChange={onChange as (v: 'everyone' | 'restricted') => void}
      error={error}
    />
  );
}

export { SubmitterCardSelect };
