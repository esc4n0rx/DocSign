import { DashboardLayout } from "@/components/dashboard-layout"
import { ConfiguracoesSection } from "@/components/configuracoes-section"
import { PermissionGuard } from "@/components/permission-guard"

export default function ConfiguracoesPage() {
  return (
    <DashboardLayout>
      <PermissionGuard
        allowedPermissions={["Admin"]}
        fallbackDescription="Somente usuários com permissão de Admin podem alterar as configurações do sistema."
      >
        <ConfiguracoesSection />
      </PermissionGuard>
    </DashboardLayout>
  )
}
