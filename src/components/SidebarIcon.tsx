import { UnstyledButton, Avatar, Image } from '@mantine/core';
import { ReactNode } from 'react';
import Link from 'next/link';

interface SidebarIconProps {
  href?: string;
  isActive?: boolean;
  children?: ReactNode;
  avatar?: string;
  size?: number;
  onClick?: () => void;
}

export function SidebarIcon({
  href,
  isActive = false,
  children,
  avatar,
  size = 56,
  onClick,
}: SidebarIconProps) {
  const buttonContent = (
    <UnstyledButton
      onClick={onClick}
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
      {isActive && (
        <Image
          src="/icons/active-icon.png"
          style={{
            width: 6,
            height: 32,
            position: 'absolute',
            left: -13,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      )}

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
