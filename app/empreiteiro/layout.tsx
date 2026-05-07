'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmpreiteiroLayout } from '@features/empreiteiro/components/EmpreiteiroLayout';
import { EmailVerificationBanner } from '@features/auth/components/EmailVerificationBanner';

export default function EmpreiteiroLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'empreiteiro')) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  // Não autorizado
  if (!user || user.role !== 'empreiteiro') {
    return null;
  }

  return (
    <EmpreiteiroLayout>
      <EmailVerificationBanner />
      {children}
    </EmpreiteiroLayout>
  );
}
