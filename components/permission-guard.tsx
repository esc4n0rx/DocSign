"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"
import { Loader2, Lock } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import type { Usuario } from "@/types/auth"

interface PermissionGuardProps {
  allowedPermissions: Array<Usuario["permissao"]>
  children: ReactNode
  fallbackTitle?: string
  fallbackDescription?: string
  fallbackActions?: ReactNode
}

export function PermissionGuard({
  allowedPermissions,
  children,
  fallbackTitle = "Acesso restrito",
  fallbackDescription = "Você não tem permissão para acessar esta seção. Entre em contato com um administrador caso precise de acesso.",
  fallbackActions,
}: PermissionGuardProps) {
  const { user, loading } = useAuth()

  const userPermission = user?.usuario?.permissao
  const hasPermission = useMemo(
    () => (userPermission ? allowedPermissions.includes(userPermission) : false),
    [allowedPermissions, userPermission],
  )

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Verificando permissões...</p>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{fallbackTitle}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {fallbackDescription}
          </p>
          {userPermission && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
              Permissão atual: {userPermission}
            </p>
          )}
          <p className="text-xs text-muted-foreground/80">
            Permissões necessárias: {allowedPermissions.join(" • ")}
          </p>
        </div>

        {fallbackActions}
      </div>
    )
  }

  return <>{children}</>
}
