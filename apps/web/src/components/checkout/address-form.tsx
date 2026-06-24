'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AddressFormValues } from '@/components/checkout/address-form.utils';

interface AddressFormProps {
  values: AddressFormValues;
  onChange: (values: AddressFormValues) => void;
}

export function AddressForm({ values, onChange }: AddressFormProps) {
  function update<K extends keyof AddressFormValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección de envío</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipientName">Nombre completo</Label>
            <Input
              id="recipientName"
              required
              value={values.recipientName}
              onChange={(e) => update('recipientName', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="street">Dirección</Label>
            <Input
              id="street"
              required
              value={values.street}
              onChange={(e) => update('street', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                required
                value={values.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">Provincia</Label>
              <Input
                id="state"
                value={values.state}
                onChange={(e) => update('state', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">Código postal</Label>
              <Input
                id="zipCode"
                value={values.zipCode}
                onChange={(e) => update('zipCode', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                required
                value={values.country}
                onChange={(e) => update('country', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas del pedido</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
