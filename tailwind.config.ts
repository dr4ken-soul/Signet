import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F1F4F3',
          secondary: '#E6ECE9',
          surface: '#F9FBFA',
          elevated: '#FCFDFC',
        },
        accent: {
          DEFAULT: '#0F6B5C',
          hover: '#0B584B',
        },
        ink: {
          primary: '#17211D',
          secondary: '#45524C',
          muted: '#5B6862',
        },
        success: '#26734F',
        warning: '#8D5400',
        error: '#B13934',
        info: '#2B5C85',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      transitionDuration: {
        fast: '140ms',
        normal: '220ms',
        slow: '360ms',
      },
      maxWidth: {
        page: '1180px',
      },
    },
  },
  plugins: [],
};

export default config;
