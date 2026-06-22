import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Support Inbox</h1>
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Support inbox integration placeholder. This module will list
            WhatsApp conversations, messages, and agent assignment controls once
            the Evolution API integration is wired in Phase 6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
