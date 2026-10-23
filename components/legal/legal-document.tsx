import type { ReactNode } from "react"

import { PageTitleBar } from "@/components/page-title-bar"
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from "@/lib/legal/info"

export type LegalSection = {
  id: string
  title: string
  content: ReactNode
}

type LegalDocumentProps = {
  icon: ReactNode
  title: string
  description: string
  summary: ReactNode
  sections: LegalSection[]
}

/** Mail link to the contact address, used inside the legal texts. */
export function ContactEmail() {
  return (
    <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
      {LEGAL_CONTACT_EMAIL}
    </a>
  )
}

/**
 * Long-form legal page: a short summary first, then numbered sections with an index that links to
 * each one. The index sits beside the text on wide screens and above it on phones.
 */
export function LegalDocument({ icon, title, description, summary, sections }: LegalDocumentProps) {
  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <PageTitleBar icon={icon} title={title} description={description} />

        {/* Phones read the summary first, then the index; wide screens keep the index in its own column. */}
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8">
          <div className="max-w-3xl rounded-[var(--radius)] border border-primary/25 bg-accent/60 p-4 text-sm leading-6 text-foreground md:p-5 md:text-base md:leading-7 lg:col-start-2 lg:row-start-1">
            <p className="page-meta-label text-primary">En pocas palabras</p>
            <div className="mt-2 [&_p+p]:mt-2">{summary}</div>
          </div>

          <nav
            aria-label="Secciones"
            className="lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start"
          >
            <p className="page-meta-label">Contenido</p>
            <ol className="mt-3 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="w-5 shrink-0 font-semibold tabular-nums text-primary">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-3xl lg:col-start-2 lg:row-start-2">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="scroll-mt-28">
                  <h2 id={`${section.id}-titulo`} className="flex items-baseline gap-3 text-lg font-semibold tracking-tight md:text-xl">
                    <span className="font-semibold tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground md:text-base [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-primary">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-12 border-t pt-4 text-xs text-muted-foreground">
              Última actualización: {LEGAL_UPDATED_AT}. ¿Dudas? Escribinos a <ContactEmail />.
            </p>
          </article>
        </div>
      </div>
    </div>
  )
}
