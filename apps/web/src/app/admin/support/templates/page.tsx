import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { WhatsAppTemplatesView } from './whatsapp-templates-view';
import { buttonVariants } from '@/components/ui/button-variants';

export default async function WhatsAppTemplatesPage() {
  const api = await getServerApiClient();
  const templates = await api.whatsapp.listQuickRepliesAdmin().catch(() => []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex justify-end">
        <Link
          href="/admin/support"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Volver a soporte
        </Link>
      </div>
      <WhatsAppTemplatesView initialTemplates={templates} />
    </div>
  );
}
