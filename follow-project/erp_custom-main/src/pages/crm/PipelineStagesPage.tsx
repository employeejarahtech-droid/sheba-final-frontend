import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Opportunity {
  name: string;
  value: number;
  owner: string;
}

interface Stage {
  name: string;
  probability: string;
  opportunities: Opportunity[];
}

export default function PipelineStagesPage() {
  // Mock Data
  const stages: Stage[] = [
    {
      name: "New",
      probability: "10%",
      opportunities: [
        { name: "Resident Stylist – Onboarding", value: 5000, owner: "Abdullah" },
        { name: "GymnExcel – Trial", value: 3000, owner: "Team A" },
      ],
    },
    {
      name: "Qualified",
      probability: "30%",
      opportunities: [
        { name: "Seyon Tradeworld – ERP", value: 15000, owner: "Abdullah" },
      ],
    },
    {
      name: "Proposal",
      probability: "60%",
      opportunities: [
        { name: "Speedex Express – CRM", value: 35000, owner: "Abdullah" },
      ],
    },
    {
      name: "Negotiation",
      probability: "80%",
      opportunities: [
        { name: "BBEA – Event Portal", value: 20000, owner: "Team B" },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <Card className="rounded-sm border border-gray-300 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Pipeline & Stages
          </CardTitle>
          <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-sm">
            + New Pipeline
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex space-x-4 overflow-x-auto">
            {stages.map((stage) => (
              <div
                key={stage.name}
                className="min-w-[250px] bg-gray-50 dark:bg-gray-900 rounded-sm p-4 flex-shrink-0"
              >
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {stage.name} ({stage.probability})
                </h3>

                <div className="space-y-2">
                  {stage.opportunities.map((opp, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {opp.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Value: ${opp.value.toLocaleString()} · Owner: {opp.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-xs mt-4">
            Pipelines are stored in <code>crm_pipelines</code>, stages in{" "}
            <code>crm_pipeline_stages</code>, and card data from{" "}
            <code>crm_opportunities</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
