import { CheckCircle2, Clock3, FileText, Medal, Users } from "lucide-react"

import { getComunidadPageData } from "@/database/queries/comunidad"
import { getUserInitials } from "@/lib/identity/display"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const rankingVariants = ["oro", "plata", "bronce"] as const

export default async function ComunidadPage() {
  const data = await getComunidadPageData()

  const summary = [
    { label: "Miembros", description: "Personas registradas", value: data.members, icon: Users },
    { label: "Reportes totales", description: "Reportes públicos", value: data.totalReports, icon: FileText },
    { label: "Resueltos", description: "Casos solucionados", value: data.solvedReports, icon: CheckCircle2 },
    { label: "Pendientes", description: "Casos por atender", value: data.pendingReports, icon: Clock3 },
    { label: "En seguimiento", description: "Casos en progreso", value: data.followUpReports, icon: Medal },
  ]

  const topContributors = data.contributors.slice(0, 3)
  const remainingContributors = data.contributors.slice(3)

  return (
    <div className="page-shell">
      <div className="page-container page-stack">
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-2 pt-2">
            <section aria-labelledby="ranking-destacado">
              <Card className="gap-0">
                <CardHeader><CardTitle id="ranking-destacado">Personas que más reportan</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {topContributors.length === 0 ? (
                    <div className="rounded-[var(--radius)] border border-dashed p-8 text-center">
                      <p className="font-semibold">Todavía no hay colaboradores para mostrar.</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Sé la primera persona en sumar un reporte público a la comunidad.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 px-5 py-3 sm:gap-2">
                      {topContributors.map((contributor, index) => {
                        const rank = index + 1
                        return (
                          <div key={contributor.id} className="flex min-w-0 flex-col items-center gap-1 px-1 py-1 text-center sm:px-2">
                            <Badge variant={rankingVariants[index]} className="size-8 justify-center text-sm" aria-label={`Puesto ${rank}`}>{rank}</Badge>
                            <p className="w-full truncate text-sm font-semibold">{contributor.username}</p>
                            <p className="text-xs font-semibold">{contributor.points} puntos</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {remainingContributors.length > 0 && (
              <section aria-labelledby="ranking-completo">
                <Card className="gap-0">
                  <CardHeader><CardTitle id="ranking-completo">Ranking completo</CardTitle></CardHeader>
                  <CardContent className="divide-y p-0">
                    {remainingContributors.map((contributor, index) => {
                      const rank = index + 4
                      return (
                        <div key={contributor.id} className="flex items-center gap-3 px-5 py-3">
                          <span className="flex size-8 shrink-0 items-center justify-center text-sm font-semibold text-muted-foreground" aria-label={`Puesto ${rank}`}>{rank}</span>
                          <Avatar className="size-10 border border-border">
                            <AvatarFallback>{getUserInitials(contributor.username)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{contributor.username}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{contributor.points}</p>
                            <p className="text-xs text-muted-foreground">puntos</p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </section>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 pt-2" aria-labelledby="resumen-comunidad">
            <h2 id="resumen-comunidad" className="sr-only">Resumen de reportes de la comunidad</h2>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {summary.map(({ label, description, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3">
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <p className="text-lg font-semibold tracking-tight">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
