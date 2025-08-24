import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface RequireRoleProps {
  roles: string[];
  children: React.ReactNode;
}

export default function RequireRole({ roles, children }: RequireRoleProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const userRole = data.session?.user?.user_metadata?.role as string | undefined;
      setAllowed(userRole ? roles.includes(userRole) : false);
    };
    check();
  }, [roles]);

  if (allowed === null) {
    return null;
  }

  if (!allowed) {
    return <p>Access denied</p>;
  }

  return <>{children}</>;
}
