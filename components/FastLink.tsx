"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, startTransition } from "react";

interface FastLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

export function FastLink({ href, children, className, onClick, prefetch = true }: FastLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }

    // Use startTransition for better performance
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}