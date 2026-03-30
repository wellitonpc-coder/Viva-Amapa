import React, { useState } from "react"
import { supabase } from "@/api/supabaseClient"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"

/**
 * Componente admin-only para upload no bucket "place-media"
 * Retorna URL pública via onUploaded(url, path)
 */
export default function AdminUploadPlacePhoto({
  folder = "places",
  onUploaded,
  label = "Upload de foto (admin)",
}) {
  const { isAdmin } = useAuth()
  const [uploading, setUploading] = useState(false)

  if (!isAdmin) return null

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const ext = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${ext}`
      const path = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("place-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("place-media").getPublicUrl(path)
      const publicUrl = data?.publicUrl

      if (!publicUrl) throw new Error("Não foi possível obter URL pública do arquivo.")

      onUploaded?.(publicUrl, path)

      // limpa o input pra permitir enviar o mesmo arquivo novamente (se quiser)
      e.target.value = ""
    } catch (err) {
      console.error(err)
      alert(err?.message || "Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">
            Envie uma imagem para o bucket <b>place-media</b>.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="relative overflow-hidden"
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Escolher arquivo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>
    </div>
  )
}
