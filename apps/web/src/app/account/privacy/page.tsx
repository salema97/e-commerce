'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';

export default function AccountPrivacyPage() {
  const api = useApiClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function exportData() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const bundle = await api.privacy.exportMine();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Exportación descargada correctamente.');
    } catch {
      setError('No se pudo exportar tus datos.');
    } finally {
      setPending(false);
    }
  }

  async function deleteData() {
    if (!window.confirm('¿Anonimizar tus datos personales? Esta acción no se puede deshacer.')) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await api.privacy.deleteMine();
      setMessage(result.message);
    } catch {
      setError('No se pudo procesar la eliminación.');
    } finally {
      setPending(false);
    }
  }

  async function toggleCcpa(optOut: boolean) {
    setPending(true);
    setError(null);
    try {
      await api.privacy.ccpaOptOut(optOut);
      setMessage(optOut ? 'Preferencia CCPA: no vender/compartir activada.' : 'Preferencia CCPA actualizada.');
    } catch {
      setError('No se pudo guardar la preferencia.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Privacidad y datos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Exportar mis datos (GDPR)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Descarga un archivo JSON con tu perfil, pedidos recientes y preferencias.
          </p>
          <Button type="button" onClick={() => void exportData()} disabled={pending}>
            Descargar exportación
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CCPA — No vender ni compartir</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => void toggleCcpa(true)}>
            Activar opt-out
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => void toggleCcpa(false)}>
            Desactivar opt-out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eliminar / anonimizar cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Anonimiza tu información personal. Los pedidos se conservan por obligaciones fiscales.
          </p>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => void deleteData()}>
            Solicitar eliminación
          </Button>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
