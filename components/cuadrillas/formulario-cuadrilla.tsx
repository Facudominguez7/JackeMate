"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { esquemaCuadrilla, type DatosCuadrillaInput } from "@/app/dashboard/cuadrillas/esquemas"

type ValorInicialFormulario = {
  nombre: string
  descripcion?: string | null
  telefono?: string | null
}

type FormularioCuadrillaProps = {
  valorInicial?: ValorInicialFormulario
  enviando: boolean
  onEnviar: (datos: DatosCuadrillaInput) => void
}

/**
 * Formulario de alta/edición de una cuadrilla del catálogo. Usa React Hook Form con el mismo
 * esquema Zod (`esquemaCuadrilla`) que valida la Server Action, para que los mensajes de error
 * mostrados en el cliente sean exactamente los que el servidor volvería a validar.
 */
export function FormularioCuadrilla({ valorInicial, enviando, onEnviar }: FormularioCuadrillaProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DatosCuadrillaInput>({
    resolver: zodResolver(esquemaCuadrilla),
    mode: "onChange",
    defaultValues: {
      nombre: valorInicial?.nombre ?? "",
      descripcion: valorInicial?.descripcion ?? null,
      telefono: valorInicial?.telefono ?? null,
    },
  })

  return (
    <form onSubmit={handleSubmit(onEnviar)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre-cuadrilla">Nombre</Label>
        <Input id="nombre-cuadrilla" placeholder="Ej: Cuadrilla Norte" disabled={enviando} {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion-cuadrilla">Descripción (opcional)</Label>
        <Textarea
          id="descripcion-cuadrilla"
          placeholder="Ej: Cubre bacheo y alumbrado en la zona norte"
          disabled={enviando}
          {...register("descripcion")}
        />
        {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono-cuadrilla">Teléfono (opcional)</Label>
        <Input id="telefono-cuadrilla" placeholder="Ej: 11-5555-5555" disabled={enviando} {...register("telefono")} />
        {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
      </div>

      <Button type="submit" disabled={enviando || !isValid} className="w-full">
        {enviando ? "Guardando..." : "Guardar cuadrilla"}
      </Button>
    </form>
  )
}
