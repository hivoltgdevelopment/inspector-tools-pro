import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useInRouterContext, Navigate } from 'react-router-dom';

interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
  // Optional: custom UI to show when access is denied
  fallback?: React.ReactNode;
  // Optional: path to redirect to when access is denied
  redirectTo?: string;
}

export default function RequireRole({ roles, children, fallback, redirectTo }: RequireRoleProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const inRouter = useInRouterContext();

  // Dev bypass: allow all roles when enabled
  const skipRbacEnv = import.meta.env.VITE_SKIP_RBAC === 'true';
  // Allow bypass in any environment for testing: query param or localStorage
  let skipRbac = skipRbacEnv;
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('rbac');
    if (qp === 'off') skipRbac = true;
    const ls = localStorage.getItem('rbac_off');
    if (ls === 'true') skipRbac = true;
  } catch (_e) {
    // ignore non-browser contexts
  }

  useEffect(() => {
    let mounted = true;
    const evaluate = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userRole = data.session?.user?.user_metadata?.role as string | undefined;
        const ok = !!userRole && roles.includes(userRole);
        if (mounted) setAllowed(skipRbac ? true : ok);
      } catch (_e) {
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    evaluate();
    // Re-evaluate on auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      evaluate();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [roles, skipRbac]);

  if (checking || allowed === null) {
    return null;
  }

  if (!allowed) {
    if (redirectTo && inRouter) {
      return <Navigate to={redirectTo} replace />;
    }
    return <>{fallback ?? <p>Access denied</p>}</>;
  }

  return <>{children}</>;
}
