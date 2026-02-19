"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";

export default function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    hydrate();
    fetchProfile();
  }, [hydrate, fetchProfile]);

  return null;
}
