"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WebpagePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/webpage/dashboard"); }, [router]);
  return null;
}