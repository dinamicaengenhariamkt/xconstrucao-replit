'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmpreiteiroLayout } from '@features/empreiteiro/components/EmpreiteiroLayout';
import { EmailVerificationBanner } from '@features/auth/components/EmailVerificationBanner';
import { AuthSessionGuard } from '@features/auth/components/AuthSessionGuard';

export default function EmpreiteiroLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = user?.role === 'empreiteiro' || user?.role === 'superadmin';

  useEffect(() => {
    if (!isLoading && (!user || !allowed)) {
      router.push('/login');
    }
  }, [isLoading, user, allowed, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!user || !allowed) {
    return null;
  }

  return (
    <AuthSessionGuard>
      <EmpreiteiroLayout>
        <EmailVerificationBanner />
        {children}
      </EmpreiteiroLayout>
    </AuthSessionGuard>
  );
}
