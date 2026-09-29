'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Receipt,
  IndianRupee,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function FeeSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const [form, setForm] = React.useState({
    currency: 'INR',
    currencySymbol: '₹',
    defaultPaymentMethods: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'],
    lateFeeGraceDays: 7,
    receiptPrefix: 'REC',
    receiptFooterNote: 'This is a computer generated official fee receipt. Signature not required.',
    allowOnlinePayments: true,
    autoIssueReceipt: true,
  });

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=fees');
      const json = await res.json();
      if (res.ok && json.data) {
        setForm(json.data);
      }
    } catch (err) {
      console.error('Failed to load fee settings:', err);
      toast.error('Failed to load fee configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'fees',
          value: form,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save fee settings');
      }
      setSaveSuccess(true);
      toast.success('Fee settings saved and enforced globally.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fee settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Page Header */}
      <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Fee & Finance Configuration
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure institutional currency standards, official receipt numbering, and payment collection policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/school/fees">
            <Button variant="outline" size="sm" type="button" className="text-xs gap-1.5">
              Open Fee Manager
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button type="submit" disabled={saving || loading} size="sm" className="text-xs gap-1.5">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* 2. Success Banner */}
      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Fee configuration successfully persisted and active across all fee modules.</span>
        </div>
      )}

      {/* 3. Main Configuration Card */}
      <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-7 space-y-8 shadow-2xs">
        
        {/* Section A: Currency & Accounting Standards */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Institutional Currency & Denomination
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Applied on student fee obligations, payment records, ledgers, and official printed receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs font-medium">
                Currency Code (ISO)
              </Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                placeholder="INR"
                className="font-mono uppercase text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Standard 3-letter currency code (e.g. INR, USD, AED, GBP).</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currencySymbol" className="text-xs font-medium">
                Currency Symbol
              </Label>
              <Input
                id="currencySymbol"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                placeholder="₹"
                className="text-xs font-semibold"
              />
              <p className="text-[11px] text-muted-foreground">Prefix symbol displayed in UI and receipts (e.g. ₹, $, £, €).</p>
            </div>
          </div>
        </div>

        {/* Section B: Official Receipt Customization */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Receipt Generation & Numbering Format
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Legal formatting rules applied on every issued institutional fee receipt and PDF download.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="receiptPrefix" className="text-xs font-medium">
                Receipt Number Prefix
              </Label>
              <Input
                id="receiptPrefix"
                value={form.receiptPrefix}
                onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value.toUpperCase() })}
                placeholder="REC"
                className="font-mono uppercase text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Applied before sequential receipt numbers (e.g. REC-2026-0001).</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lateFeeGraceDays" className="text-xs font-medium">
                Late Fee Grace Window (Days)
              </Label>
              <Input
                id="lateFeeGraceDays"
                type="number"
                min={0}
                max={90}
                value={form.lateFeeGraceDays}
                onChange={(e) => setForm({ ...form, lateFeeGraceDays: parseInt(e.target.value) || 0 })}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Grace period before installment overdue alerts are dispatched.</p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="receiptFooterNote" className="text-xs font-medium">
                Official Receipt Footer Note / Legal Disclaimer
              </Label>
              <Input
                id="receiptFooterNote"
                value={form.receiptFooterNote}
                onChange={(e) => setForm({ ...form, receiptFooterNote: e.target.value })}
                placeholder="This is a computer generated official fee receipt. Signature not required."
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Printed at the bottom of all downloaded PDF fee receipts.</p>
            </div>
          </div>
        </div>

        {/* Section C: Policy Toggles */}
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Collection & Issuance Policy
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3.5 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-foreground">Automatic Instant Receipt Generation</div>
                <div className="text-[11px] text-muted-foreground">
                  Automatically issue official immutable receipt with PDF generation upon payment recording.
                </div>
              </div>
              <Switch
                checked={form.autoIssueReceipt}
                onCheckedChange={(checked) => setForm({ ...form, autoIssueReceipt: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3.5 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-foreground">Online Payment Gateway Enablement</div>
                <div className="text-[11px] text-muted-foreground">
                  Allow students and parents to settle dues directly through digital collection portals.
                </div>
              </div>
              <Switch
                checked={form.allowOnlinePayments}
                onCheckedChange={(checked) => setForm({ ...form, allowOnlinePayments: checked })}
              />
            </div>
          </div>
        </div>

        {/* Financial Immutability Notice */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="font-semibold text-foreground">Financial Ledger Immutability Protection</div>
            Changing global fee preferences does not rewrite or alter historical payment ledgers, published plan versions, or issued receipts. All previous transactions retain their original audit trail.
          </div>
        </div>

      </div>
    </form>
  );
}
