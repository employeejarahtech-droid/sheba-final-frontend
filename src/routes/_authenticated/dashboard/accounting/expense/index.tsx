"use client";

import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard/accounting/expense/')({
    component: () => <Navigate to="/dashboard/expenses" />
});
