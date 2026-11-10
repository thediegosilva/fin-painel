import type { ReactNode } from "react";

/** Layout de páginas de texto (privacidade, termos, como funciona). */
export function ProsePage({ title, lead, children }: { title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      {lead && <p className="mt-3 text-lg text-muted">{lead}</p>}
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-text/90 [&_a]:font-medium [&_a]:text-brand [&_a:hover]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
