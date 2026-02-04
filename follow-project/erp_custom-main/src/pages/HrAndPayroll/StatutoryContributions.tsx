import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StatutoryContributions() {
    return (
        <div className="max-w-6xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Statutory Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Configure EPF, SOCSO, EIS, and Tax rules.</p>
                </CardContent>
            </Card>
        </div>
    );
}
