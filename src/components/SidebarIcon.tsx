import { UnstyledButton, Avatar, Box } from '@mantine/core';
import { ReactNode } from 'react';
import Link from 'next/link';

interface SidebarIconProps {
  href?: string;
  isActive?: boolean;
  children?: ReactNode;
  avatar?: string;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

const ACTIVE_INDICATOR_STYLES = {
  width: 6,
  height: 32,
  backgroundColor: '#3B82F6',
  borderRadius: '0 4px 4px 0',
  position: 'absolute' as const,
  left: -13,
  top: '50%',
  transform: 'translateY(-50%)',
};

export function SidebarIcon({
  href,
  isActive = false,
  children,
  avatar,
  size = 56,
  onClick,
  ariaLabel,
}: SidebarIconProps) {
  const buttonContent = (
    <UnstyledButton
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#F8FAFC',
        border: '1px solid #CBD5E1',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isActive && <Box style={ACTIVE_INDICATOR_STYLES} />}

      {avatar ? <Avatar src={avatar} size={size - 2} radius="50%" /> : children}
    </UnstyledButton>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          textDecoration: 'none',
          display: 'block',
          height: size,
        }}
      >
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}
