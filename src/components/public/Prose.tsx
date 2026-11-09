import React from 'react';
export function Prose({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="label-eyebrow text-gold">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-stone">Last updated {updated}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-stone [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ivory [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
