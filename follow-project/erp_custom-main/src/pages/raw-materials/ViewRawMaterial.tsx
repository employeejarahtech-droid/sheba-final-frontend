import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Loader } from "lucide-react";
import { Link, useParams } from "react-router";
import { useGetRawMaterialByIdQuery } from "@/store/features/admin/rawMaterialApiService";
import { BackButton } from "@/components/BackButton";

const ViewRawMaterial = () => {
  const { id } = useParams();
  const materialId = id ? parseInt(id, 10) : null;

  const { data: materialData, isLoading } = useGetRawMaterialByIdQuery(
    materialId || 0,
    { skip: !materialId }
  );

  const material = materialData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="max-w-4xl mx-auto">
        <BackButton />
        <div className="mt-10 text-center">
          <p className="text-lg text-gray-500">Raw material not found</p>
        </div>
      </div>
    );
  }

  const infoRows = [
    { label: "Material Name", value: material.name },
    { label: "Category", value: material.category?.name || "-" },
    { label: "Supplier", value: material.supplier || "-" },
    { label: "Unit", value: typeof material.unit === "string" ? material.unit : ((material.unit as unknown) as Record<string, string>)?.name || "-" },
    { label: "Cost Price", value: `$${material.cost.toFixed(2)}` },
    { label: "Initial Stock", value: material.initial_stock },
    { label: "Min Stock", value: material.min_stock },
    { label: "Status", value: material.is_active ? "Active" : "Inactive" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold">Raw Material Details</h1>
        </div>
        <Link to={`/dashboard/raw-materials/edit/${material.id}`}>
          <Button className="bg-blue-600 hover:bg-blue-500">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{material.name}</CardTitle>
            <Badge variant={material.is_active ? "default" : "secondary"}>
              {material.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {infoRows.map((row, index) => (
              <div key={index} className="border-b pb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {row.label}
                </p>
                <p className="text-lg font-semibold">{row.value}</p>
              </div>
            ))}
          </div>

          {material.description && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm font-medium text-gray-500 mb-2">
                Description
              </p>
              <p className="text-base whitespace-pre-wrap">{material.description}</p>
            </div>
          )}

          {material.created_at && (
            <div className="mt-6 text-xs text-gray-400">
              <p>Created: {new Date(material.created_at).toLocaleString()}</p>
              {material.updated_at && (
                <p>Last Updated: {new Date(material.updated_at).toLocaleString()}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewRawMaterial;
