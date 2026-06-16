import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useBillingOverview,
  useBillingTransactions,
} from "@/hooks/usePlatformAdmin";

export const Route = createFileRoute("/(platform)/admin/billing")({
  component: BillingPage,
});

function BillingPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: overview, isLoading: overviewLoading } = useBillingOverview();
  const { data: transactions, isLoading: txLoading } = useBillingTransactions({
    page,
    limit,
  });

  const statCards = [
    {
      title: "Total Revenue",
      value: overview?.total_revenue ?? 0,
      icon: DollarSign,
      format: "currency",
    },
    {
      title: "Monthly Revenue",
      value: overview?.monthly_revenue ?? 0,
      icon: TrendingUp,
      format: "currency",
    },
    {
      title: "Active Subscriptions",
      value: overview?.active_subscriptions ?? 0,
      icon: Users,
      format: "number",
    },
    {
      title: "Pending Invoices",
      value: overview?.pending_invoices ?? 0,
      icon: FileText,
      format: "number",
    },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "refunded":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing Overview</h1>
        <p className="text-muted-foreground">
          Revenue and billing statistics across all tenants.
        </p>
      </div>

      {overviewLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(card.value, card.format)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!transactions?.data?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.company_name}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(tx.status)}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {transactions?.total_pages > 1 && (
              <div className="flex items-center justify-end gap-2 p-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {transactions.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= transactions.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
