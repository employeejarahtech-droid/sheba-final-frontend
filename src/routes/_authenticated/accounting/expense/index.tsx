"use client";

import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/accounting/expense/')({
    component: () => <Navigate to="/accounting/expenses" />
});
