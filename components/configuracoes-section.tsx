"use client"

import { ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface ImportSummary {
  colaboradoresCriados: number
  documentosImportados: number
  erros: string[]
}

interface ConfiguracaoSistema {
  tema: string
  idioma: string
  timezone: string
  formatoData: string
  notificacoes: boolean
  backupAutomatico: boolean
  timeoutSessao: string
  politicaSenha: string
  logAuditoria: boolean
  manutencaoAutomatica: boolean
}

export function ConfiguracoesSection() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSistema>({
    tema: "dark",
    idioma: "pt-BR",
    timezone: "America/Sao_Paulo",
    formatoData: "DD/MM/YYYY",
    notificacoes: true,
    backupAutomatico: true,
    timeoutSessao: "30",
    politicaSenha: "media",
    logAuditoria: true,
    manutencaoAutomatica: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImportData = async (file: File) => {
    setSelectedFileName(file.name)
    setImportSummary(null)
    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/colaboradores/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Falha ao importar dados")
      }

      setImportSummary(data.summary || null)

      toast({
        title: "Importação concluída",
        description:
          data.summary
            ? `${data.summary.colaboradoresCriados} colaborador(es) e ${data.summary.documentosImportados} documento(s) importados.`
            : "Dados importados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Não foi possível importar o arquivo.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void handleImportData(file)
      event.target.value = ""
    }
  }

  const handleSaveConfiguracoes = async () => {
    setIsLoading(true)
    // Simulação de salvamento
    setTimeout(() => {
      setIsLoading(false)
      console.log("Configurações salvas:", configuracoes)
    }, 1000)
  }

  const handleResetConfiguracoes = () => {
    setConfiguracoes({
      tema: "dark",
      idioma: "pt-BR",
      timezone: "America/Sao_Paulo",
      formatoData: "DD/MM/YYYY",
      notificacoes: true,
      backupAutomatico: true,
      timeoutSessao: "30",
      politicaSenha: "media",
      logAuditoria: true,
      manutencaoAutomatica: false,
    })
  }

  const updateConfiguracao = (key: keyof ConfiguracaoSistema, value: any) => {
    setConfiguracoes((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground text-balance">Configurações</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Ajustes e configurações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetConfiguracoes}>
            Restaurar Padrões
          </Button>
          <Button onClick={handleSaveConfiguracoes} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Importação em massa de dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12l2.586-2.586a2 2 0 012.828 0L12 12m0 0l2.586-2.586a2 2 0 012.828 0L20 12m-8 0v8"
              />
            </svg>
            Importar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Faça o upload de um arquivo <span className="font-medium text-foreground">.zip</span> contendo uma pasta raiz e
            subpastas com o nome de cada colaborador. Dentro de cada subpasta devem estar os documentos em PDF que serão
            importados automaticamente.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? "Importando..." : "Selecionar arquivo"}
            </Button>
            {selectedFileName && (
              <Badge variant="outline" className="max-w-xs truncate">
                {selectedFileName}
              </Badge>
            )}
          </div>

          {importSummary && (
            <div className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">Resumo da importação</span>
                <span className="text-muted-foreground">
                  {importSummary.colaboradoresCriados} colaborador(es) criado(s) e {importSummary.documentosImportados} documento(s)
                  importado(s).
                </span>
              </div>
              {importSummary.erros.length > 0 && (
                <div className="space-y-1">
                  <span className="font-medium text-destructive">Ocorreram alguns avisos:</span>
                  <ul className="list-disc space-y-1 pl-5 text-destructive">
                    {importSummary.erros.map((erro, index) => (
                      <li key={`${erro}-${index}`} className="text-xs sm:text-sm">
                        {erro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
              />
            </svg>
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tema">Tema do Sistema</Label>
              <Select value={configuracoes.tema} onValueChange={(value) => updateConfiguracao("tema", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idioma">Idioma</Label>
              <Select value={configuracoes.idioma} onValueChange={(value) => updateConfiguracao("idioma", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select value={configuracoes.timezone} onValueChange={(value) => updateConfiguracao("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formatoData">Formato de Data</Label>
              <Select
                value={configuracoes.formatoData}
                onValueChange={(value) => updateConfiguracao("formatoData", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações do Sistema</Label>
                <p className="text-sm text-muted-foreground">Receber notificações sobre eventos importantes</p>
              </div>
              <Switch
                checked={configuracoes.notificacoes}
                onCheckedChange={(checked) => updateConfiguracao("notificacoes", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Realizar backup automático dos dados diariamente</p>
              </div>
              <Switch
                checked={configuracoes.backupAutomatico}
                onCheckedChange={(checked) => updateConfiguracao("backupAutomatico", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeoutSessao">Timeout de Sessão (minutos)</Label>
              <Select
                value={configuracoes.timeoutSessao}
                onValueChange={(value) => updateConfiguracao("timeoutSessao", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="0">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="politicaSenha">Política de Senhas</Label>
              <Select
                value={configuracoes.politicaSenha}
                onValueChange={(value) => updateConfiguracao("politicaSenha", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">
                    <div className="flex flex-col">
                      <span>Baixa</span>
                      <span className="text-xs text-muted-foreground">Mínimo 6 caracteres</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="media">
                    <div className="flex flex-col">
                      <span>Média</span>
                      <span className="text-xs text-muted-foreground">8 caracteres, letras e números</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="alta">
                    <div className="flex flex-col">
                      <span>Alta</span>
                      <span className="text-xs text-muted-foreground">12 caracteres, letras, números e símbolos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Log de Auditoria</Label>
                <p className="text-sm text-muted-foreground">Registrar todas as ações dos usuários no sistema</p>
              </div>
              <Switch
                checked={configuracoes.logAuditoria}
                onCheckedChange={(checked) => updateConfiguracao("logAuditoria", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Manutenção Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Executar tarefas de manutenção automaticamente durante a madrugada
                </p>
              </div>
              <Switch
                checked={configuracoes.manutencaoAutomatica}
                onCheckedChange={(checked) => updateConfiguracao("manutencaoAutomatica", checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Exportar Dados</h4>
                  <p className="text-sm text-muted-foreground">Baixar backup completo</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Relatórios</h4>
                  <p className="text-sm text-muted-foreground">Gerar relatórios do sistema</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="default" className="gap-1">
                <div className="h-2 w-2 bg-current rounded-full"></div>
                Online
              </Badge>
              <span className="text-sm text-muted-foreground">Sistema operacional</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <div className="h-2 w-2 bg-current rounded-full"></div>
                v2.1.0
              </Badge>
              <span className="text-sm text-muted-foreground">Versão atual</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 bg-current rounded-full"></div>
                99.9%
              </Badge>
              <span className="text-sm text-muted-foreground">Uptime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
