import { Radio, Text } from '@mantine/core';

interface ValidationStrategySelectProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

function ValidationStrategySelect({
  value = 'simple',
  onChange,
  error,
}: ValidationStrategySelectProps) {
  const options = [
    {
      key: 'simple',
      label: 'Simple Majority',
      desc: 'If ore than 50% of the votes go to "Approve"',
    },
    {
      key: 'quorum',
      label: 'Quorum + Majority',
      desc: 'If the total number of votes reaches a preset quorum (e.g. 100 tokens or 20 voters) AND the majority votes for "Approve".',
    },
    {
      key: 'absolute',
      label: 'Absolute Threshold',
      desc: 'If the "Approve" votes reach a fixed number or percentage, regardless of total turnout. E.g.: 1,000 votes for "Approve" minimum, or at least 60% Yes votes.',
    },
    {
      key: 'relative',
      label: 'Relative Majority',
      desc: "Whichever option has the most votes wins — even if it's less than 50%.",
    },
  ];

  return (
    <div>
      <Radio.Group value={value} onChange={onChange}>
        {options.map((opt) => (
          <Radio
            key={opt.key}
            value={opt.key}
            label={
              <span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  {opt.label}:
                </span>
                <span style={{ color: '#222', fontSize: 16, marginLeft: 4 }}>
                  {opt.desc}
                </span>
              </span>
            }
            mb={8}
            color="secondary"
          />
        ))}
      </Radio.Group>
      {error && (
        <Text c="red" size="sm" mt={4}>
          {error}
        </Text>
      )}
    </div>
  );
}

export { ValidationStrategySelect };
