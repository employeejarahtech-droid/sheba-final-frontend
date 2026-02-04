import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category } from "@/types/types";

// Query hook to get all categories with pagination and search
export function useCategories({ page = 1, limit = 10, search = "" }: { page?: number; limit?: number; search?: string } = {}) {
    return useQuery({
        queryKey: ["categories", page, limit, search],
        queryFn: async () => {
            const result = await window.electron.invoke("categories:getAll", { page, limit, search });
            return result;
        },
    });
}

// Query hook to get all categories (for stats)
export function useAllCategories() {
    return useQuery({
        queryKey: ["categories", "all"],
        queryFn: async () => {
            const result = await window.electron.invoke("categories:getAll", { limit: 1000 });
            return result;
        },
    });
}

// Query hook to get a single category by ID
export function useCategory(id: number) {
    return useQuery({
        queryKey: ["categories", id],
        queryFn: async () => {
            const result = await window.electron.invoke("categories:getById", id);
            return result;
        },
        enabled: !!id,
    });
}

// Mutation hook to add a new category
export function useAddCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Category>) => {
            const result = await window.electron.invoke("categories:create", data);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

// Mutation hook to update a category
export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
            const result = await window.electron.invoke("categories:update", { id, data });
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

// Mutation hook to delete a category
export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const result = await window.electron.invoke("categories:delete", id);
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}
