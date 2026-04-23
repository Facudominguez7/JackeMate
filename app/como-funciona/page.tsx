import Link from "next/link";
import { CheckCircle2, MapPin, MessageSquareText, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "1. Detectás un problema",
    description: "Puede ser un bache, un semáforo roto, falta de luz o cualquier problema urbano visible en Posadas.",
    icon: ShieldAlert,
  },
  {
    title: "2. Cargás el reporte",
    description: "Escribís qué pasa, marcás la ubicación y, si podés, agregás una foto para que quede más claro.",
    icon: MapPin,
  },
  {
    title: "3. La comunidad lo ve",
    description: "Otras personas pueden revisar el reporte, comentar y seguir el estado del problema.",
    icon: MessageSquareText,
  },
  {
    title: "4. Se hace seguimiento",
    description: "El reporte queda visible para que no se pierda y para entender mejor qué está pasando en la ciudad.",
    icon: CheckCircle2,
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="page-shell">
      <div className="page-container max-w-5xl space-y-8 py-6 md:space-y-10 md:py-8 lg:space-y-12 lg:py-10">
        <section className="rounded-[var(--radius-xl)] border border-[var(--semantic-success-border)] bg-[color-mix(in_oklab,var(--primary)_12%,white)] p-6 md:p-8 lg:p-10">
          <div className="max-w-3xl space-y-4">
            <span className="section-eyebrow">Cómo funciona</span>
            <h1 className="section-title text-balance md:text-4xl lg:text-5xl">
              Una guía simple para entender JackeMate.
            </h1>
            <p className="section-copy max-w-2xl text-base md:text-lg">
              Esta plataforma sirve para visibilizar problemas urbanos de Posadas de una forma clara, ordenada y pública.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:gap-5">
          {steps.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-border bg-card">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:gap-5 md:p-6">
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border bg-card p-6 md:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <span className="section-eyebrow">Importante</span>
              <h2 className="section-title text-balance">JackeMate no arregla el problema por sí solo.</h2>
              <p className="section-copy max-w-3xl">
                Lo que hace es ayudar a que el problema quede visible, bien ubicado y con seguimiento. Mientras más claro esté el reporte, más útil es para todos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild>
                <Link href="/reportes/nuevo">Crear reporte</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/mapa">Ver mapa</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
