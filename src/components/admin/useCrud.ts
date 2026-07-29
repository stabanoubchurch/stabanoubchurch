import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

type TableName = "priests" | "events" | "services" | "service_times" | "spotlight_posts";

export function useRows<T>(table: TableName, select: string, order: { column: string; ascending?: boolean }[]) {
  return useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      let query = supabase.from(table).select(select);
      for (const o of order) query = query.order(o.column, { ascending: o.ascending ?? true });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSaveRow(table: TableName, invalidate: TableName[] = []) {
  const queryClient = useQueryClient();
  const keys = [table, ...invalidate];
  return useMutation({
    mutationFn: async (row: Record<string, unknown> & { id?: string }) => {
      if (row.id) {
        const { id, ...rest } = row;
        const { error } = await supabase.from(table).update(rest as never).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(row as never);
        if (error) throw error;
      }
    },
    onSuccess: () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: ["admin", k] })),
  });
}

export function useDeleteRow(table: TableName, invalidate: TableName[] = []) {
  const queryClient = useQueryClient();
  const keys = [table, ...invalidate];
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: ["admin", k] })),
  });
}