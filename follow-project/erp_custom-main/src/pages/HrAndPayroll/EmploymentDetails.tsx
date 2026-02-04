import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EmploymentDetails() {
    return (
        <div className="max-w-6xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Manage employment types, grades, and contracts here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
