import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminFinancePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Finance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Financial Module</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Finance dashboard placeholder. Income, expenses, suppliers, and
            cash-flow reports will be implemented in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
