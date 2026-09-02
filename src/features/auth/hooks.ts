"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SignInInput } from "@/core/data/contracts";
import { dataSource } from "@/core/data/provider";
import { queryKeys } from "@/core/data/query-keys";

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => dataSource.auth.getSession(),
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignInInput) => dataSource.auth.signIn(input),
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataSource.auth.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.session, null);
      queryClient.clear();
    },
  });
}
