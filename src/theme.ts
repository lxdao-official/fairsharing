import { createTheme, MantineColorsTuple } from '@mantine/core';

// 定义自定义色板
const primary: MantineColorsTuple = [
  '#e6e6e5',
  '#b8b8b5',
  '#8a8a85',
  '#5c5c55',
  '#2e2e25',
  '#1f1f1d',
  '#191917',
  '#131311',
  '#0d0d0b',
  '#070705',
];
const secondary: MantineColorsTuple = [
  '#fffbe6',
  '#fff3b8',
  '#ffeb8a',
  '#ffe35c',
  '#ffdb2e',
  '#ffdd44',
  '#e6c53d',
  '#ccad36',
  '#b3962f',
  '#997e28',
];
const third: MantineColorsTuple = [
  '#fffefa',
  '#fff7e1',
  '#fff1c9',
  '#feebb0',
  '#fee597',
  '#fef6c7',
  '#e6ddb3',
  '#ccc49f',
  '#b3ab8b',
  '#999277',
];

export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary,
    secondary,
    third,
  },
  fontFamily: 'var(--font-roboto), Arial, Helvetica, sans-serif',
  components: {
    Title: {
      styles: {
        root: {
          fontFamily: 'var(--font-lexend), Arial, Helvetica, sans-serif',
          fontWeight: '700',
        },
      },
    },
    Button: {
      defaultProps: {
        autoContrast: true,
      },
    },
  },
});
