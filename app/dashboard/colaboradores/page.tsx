import { DashboardLayout } from "@/components/dashboard-layout"
import ColaboradoresSection from "@/components/colaboradores-section"
import { PermissionGuard } from "@/components/permission-guard"

export default function ColaboradoresPage() {
  return (
    <DashboardLayout>
      <PermissionGuard
        allowedPermissions={["Admin", "Editor"]}
        fallbackDescription="Somente usuários com permissão de Admin ou Editor podem visualizar e gerenciar colaboradores."
      >
        <ColaboradoresSection />
      </PermissionGuard>
    </DashboardLayout>
  )
}
