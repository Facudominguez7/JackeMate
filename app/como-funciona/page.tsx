import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "1. Detectás un problema",
    description: "Puede ser un bache, un semáforo roto, falta de luz o cualquier problema urbano visible en Posadas.",
  },
  {
    title: "2. Cargás el reporte",
    description: "Escribís qué pasa, marcás la ubicación y, si podés, agregás una foto para que quede más claro.",
  },
  {
    title: "3. La comunidad lo ve",
    description: "Otras personas pueden revisar el reporte, comentar y seguir el estado del problema.",
  },
  {
    title: "4. Se hace seguimiento",
    description: "El reporte queda visible para que no se pierda y para entender mejor qué está pasando en la ciudad.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <Card className="border-primary bg-primary text-primary-foreground">
          <CardContent className="max-w-3xl space-y-4 p-6 md:p-8">
            <h1 className="section-title text-balance md:text-4xl lg:text-5xl">
              Una guía simple para entender Reporty.
            </h1>
            <p className="section-copy max-w-2xl text-base text-primary-foreground/90 md:text-lg">
              Esta plataforma sirve para visibilizar problemas urbanos de Posadas de una forma clara, ordenada y pública.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-4" aria-label="Pasos para usar Reporty">
          {steps.map(({ title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-2 p-5 md:p-6">
                <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardContent className="grid gap-5 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <h2 className="section-title text-balance">Reporty no arregla el problema por sí solo.</h2>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
