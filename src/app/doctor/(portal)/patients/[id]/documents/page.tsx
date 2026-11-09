'use client';
import { useParams } from 'next/navigation';
import { Download, Paperclip } from 'lucide-react';
import { doctorApi } from '@/lib/api/services';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import { CategoryGate, usePatientData } from '@/components/features/doctor';
import { openSignedUrl } from '@/components/features/Records';
import { fmtDate, titleCase } from '@/lib/utils';

interface HR {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  record_date: string | null;
  provider_name: string | null;
  has_document: boolean;
  mime_type: string | null;
}

export default function PatientDocuments() {
  const { id } = useParams<{ id: string }>();
  const q = usePatientData(id, 'medical_records');
  return (
    <Card>
      <CardHeader
        title="Medical records"
        subtitle="Documents open through links that expire within minutes. Each opening is logged."
      />
      <CategoryGate q={q} category="medical_records">
        {(d) => {
          const rows = (d.health_records ?? []) as unknown as HR[];
          if (!rows.length) return <EmptyState title="No records shared" />;
          return (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border border-bronze bg-graphite-deep p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ivory">{r.title}</p>
                      <Badge>{titleCase(r.record_type)}</Badge>
                      {r.has_document && (
                        <Badge tone="gold">
                          <Paperclip className="h-3 w-3" />
                          File
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone">
                      {r.record_date ? fmtDate(r.record_date) : 'No date'}
                      {r.provider_name ? ` · ${r.provider_name}` : ''}
                    </p>
                    {r.description && <p className="mt-1 text-sm text-stone">{r.description}</p>}
                  </div>
                  {r.has_document && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Download className="h-3.5 w-3.5" />}
                      onClick={() => openSignedUrl(() => doctorApi.documentUrl(r.id))}
                    >
                      Open document
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          );
        }}
      </CategoryGate>
    </Card>
  );
}
