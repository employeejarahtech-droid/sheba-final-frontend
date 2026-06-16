import { useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loader2, Pencil, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAllSettings,
  useUpdateSettings,
} from "@/hooks/usePlatformAdmin";

export const Route = createFileRoute("/(platform)/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isLoading } = useAllSettings();
  const updateSettings = useUpdateSettings();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const settings = data?.data ?? {};

  // Get category keys for tabs
  const categories = Object.keys(settings);

  function startEditing(category: string) {
    const categorySettings = settings[category] ?? {};
    // Flatten settings to string values for the form
    const flattened: Record<string, string> = {};
    for (const [key, value] of Object.entries(categorySettings)) {
      flattened[key] =
        typeof value === "object" ? JSON.stringify(value) : String(value);
    }
    setEditForm(flattened);
    setEditingCategory(category);
  }

  function cancelEditing() {
    setEditingCategory(null);
    setEditForm({});
  }

  function handleSave(category: string) {
    // Parse values back to their original types where possible
    const parsed: Record<string, any> = {};
    const originalSettings = settings[category] ?? {};

    for (const [key, value] of Object.entries(editForm)) {
      const originalValue = originalSettings[key];
      if (typeof originalValue === "boolean") {
        parsed[key] = value === "true";
      } else if (typeof originalValue === "number") {
        parsed[key] = Number(value);
      } else if (
        typeof originalValue === "object" &&
        originalValue !== null
      ) {
        try {
          parsed[key] = JSON.parse(value);
        } catch {
          parsed[key] = value;
        }
      } else {
        parsed[key] = value;
      }
    }

    updateSettings.mutate(
      { category, data: parsed },
      {
        onSuccess: () => {
          setEditingCategory(null);
          setEditForm({});
        },
      }
    );
  }

  function handleFieldChange(key: string, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            No settings found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage platform configuration settings grouped by category.
        </p>
      </div>

      <Tabs defaultValue={categories[0]} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category.replace(/_/g, " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categorySettings = settings[category] ?? {};
          const isEditing = editingCategory === category;

          return (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="capitalize text-xl">
                    {category.replace(/_/g, " ")} Settings
                  </CardTitle>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(category)}
                        disabled={updateSettings.isPending}
                      >
                        {updateSettings.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(category)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(categorySettings).map(([key, value]) => {
                      const displayValue =
                        typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : String(value);

                      return (
                        <div
                          key={key}
                          className="grid grid-cols-3 gap-4 items-start"
                        >
                          <div className="flex items-center">
                            <Label className="text-sm font-medium text-muted-foreground">
                              {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Label>
                          </div>
                          {isEditing ? (
                            <div className="col-span-2">
                              <Input
                                value={editForm[key] ?? ""}
                                onChange={(e) =>
                                  handleFieldChange(key, e.target.value)
                                }
                                placeholder={`Enter ${key.replace(/_/g, " ")}`}
                              />
                            </div>
                          ) : (
                            <div className="col-span-2">
                              <p className="text-sm break-all">{displayValue}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Outlet />
    </div>
  );
}
