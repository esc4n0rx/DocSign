import { DashboardLayout } from "@/components/dashboard-layout"
import { PermissionGuard } from "@/components/permission-guard"
import { UsuariosSection } from "@/components/usuarios-section"

export default function UsuariosPage() {
  return (
    <DashboardLayout>
      <PermissionGuard
        allowedPermissions={["Admin", "Editor"]}
        fallbackDescription="Somente usuários com permissão de Admin ou Editor podem administrar outras contas de usuário."
      >
        <UsuariosSection />
      </PermissionGuard>
    </DashboardLayout>
  )
}
