import { useState } from 'react';
import { IconUser } from '@tabler/icons-react';
import { CardSelect } from './CardSelect';

function ValidateCardSelect() {
  const [value, setValue] = useState<'specific' | 'all'>('specific');
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
      onChange={setValue as (v: 'specific' | 'all') => void}
    />
  );
}

export { ValidateCardSelect };
