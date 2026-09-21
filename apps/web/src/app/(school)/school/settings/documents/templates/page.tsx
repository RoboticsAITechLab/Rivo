'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Printer, 
  Award, 
  CreditCard, 
  CalendarCheck, 
  ScrollText,
  BadgeCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StandardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  format: string;
  icon: React.ElementType;
}

const standardTemplates: StandardTemplate[] = [
  {
    id: 'tpl-report-card',
    name: 'Official Student Report Card',
    category: 'Examinations & Evaluation',
    description: 'Bilingual term progress report with letter grades, percentage bar, attendance summary, and principal endorsement seal.',
    format: 'A4 Portrait • Multi-subject grid',
    icon: Award,
  },
  {
    id: 'tpl-admit-card',
    name: 'Examination Admit Card (Hall Ticket)',
    category: 'Examinations & Scheduling',
    description: 'Official hall ticket containing candidate photo, roll number, scheduled paper dates, timings, and allotted venue hall.',
    format: 'A4 Portrait (2 per page) • QR verifiable',
    icon: BadgeCheck,
  },
  {
    id: 'tpl-attendance-sheet',
    name: 'Class Attendance Register Ledger',
    category: 'Student Operations',
    description: 'Monthly student presence matrix for manual roll calls, offline verification audits, and state compliance archiving.',
    format: 'A4 Landscape • 31-day column matrix',
    icon: CalendarCheck,
  },
  {
    id: 'tpl-fee-receipt',
    name: 'Tuition & Fee Payment Voucher',
    category: 'Accounts & Finance',
    description: 'Double-entry institutional receipt with itemized fee heads, transaction reference, and cashier authorization block.',
    format: 'A5 Portrait / A4 Half • Receipt stub',
    icon: CreditCard,
  },
  {
    id: 'tpl-transfer-cert',
    name: 'Student Transfer Certificate (TC)',
    category: 'Admissions & Records',
    description: 'Standardized institutional leaving certificate recording conduct, attendance duration, and board registration code.',
    format: 'A4 Portrait • Secure border layout',
    icon: ScrollText,
  },
];

export default function DocumentTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Document & Certificate Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standard institutional print layouts for report cards, hall tickets, attendance ledgers, and formal certificates.
          </p>
        </div>
        <Link href="/school/settings/documents/print">
          <Button variant="outline" size="sm" className="gap-2 shrink-0 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Page & Margin Settings
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standardTemplates.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <Card key={tpl.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{tpl.name}</CardTitle>
                      <div className="text-[11px] text-muted-foreground font-medium">{tpl.category}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal">
                    Standard
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {tpl.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                  <span className="text-muted-foreground font-mono text-[11px]">{tpl.format}</span>
                  <Link href="/school/settings/branding">
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary">
                      Edit Brand Elements
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
