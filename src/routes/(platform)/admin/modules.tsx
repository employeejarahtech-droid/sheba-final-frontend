import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Trash2, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModules, useDeleteModule } from "@/hooks/usePlatformAdmin";
import { CreateModuleForm } from "@/features/platform/modules/components/CreateModuleForm";

export const Route = createFileRoute("/(platform)/admin/modules")({
  component: ModulesPage,
});

function ModulesPage() {
  const [search, setSearch] = useState("");
  const { data: modules, isLoading } = useModules({ search });
  const deleteModule = useDeleteModule();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;
    await deleteModule.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Landing Page Modules
          </h1>
          <p className="text-muted-foreground">
            Manage modules displayed on the landing page.
          </p>
        </div>
        <CreateModuleForm />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!modules?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No modules found.
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">
                      {module.name}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                        {module.slug}
                      </code>
                    </TableCell>
                    <TableCell>{module.category || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          module.status === "active" ? "default" : "secondary"
                        }
                      >
                        {module.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{module.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(module.id)}
                        disabled={deleteModule.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
