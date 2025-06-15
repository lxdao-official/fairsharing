import { useState } from 'react';
import { IconLock } from '@tabler/icons-react';
import { CardSelect } from './CardSelect';

function SubmitterCardSelect() {
  const [value, setValue] = useState<'everyone' | 'restricted'>('everyone');
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
      onChange={setValue as (v: 'everyone' | 'restricted') => void}
    />
  );
}

export { SubmitterCardSelect };
