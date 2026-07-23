"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function RoleRouteGuard({ allowedRoles, children }: Props) {
  const router = useRouter();
  const activeRole = typeof window !== "undefined" ? sessionStorage.getItem("activeRole") || "" : "";
  const authorized = allowedRoles.includes(activeRole);

  useEffect(() => {
    if (!authorized) {
      router.replace("/webpage/dashboard");
    }
  }, [authorized, router]);

  if (!authorized) return null;

  return <>{children}</>;
}

