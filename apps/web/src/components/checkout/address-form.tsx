'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderAddress } from '@repo/shared-types';

export interface AddressFormValues {
  email: string;
  phone: string;
  recipientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
}

export const EMPTY_ADDRESS: AddressFormValues = {
  email: '',
  phone: '',
  recipientName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Ecuador',
  notes: '',
};

export function isAddressValid(values: AddressFormValues): boolean {
  return Boolean(values.email && values.recipientName && values.street && values.city && values.country);
}

export function toOrderAddress(values: AddressFormValues): OrderAddress {
  return {
    recipientName: values.recipientName,
    street: values.street,
    city: values.city,
    state: values.state || undefined,
    country: values.country,
    zipCode: values.zipCode || undefined,
    phone: values.phone || undefined,
  };
}

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
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
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
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipientName">Full name</Label>
            <Input
              id="recipientName"
              required
              value={values.recipientName}
              onChange={(e) => update('recipientName', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="street">Address</Label>
            <Input
              id="street"
              required
              value={values.street}
              onChange={(e) => update('street', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={values.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                value={values.state}
                onChange={(e) => update('state', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode">Postal code</Label>
              <Input
                id="zipCode"
                value={values.zipCode}
                onChange={(e) => update('zipCode', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                required
                value={values.country}
                onChange={(e) => update('country', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Order notes</Label>
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
