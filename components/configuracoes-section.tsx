"use client"

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface ImportSummaryDetail {
  nome: string
  matricula?: string
  documentos: number
  mensagens: string[]
  sucesso: boolean
}

interface ImportSummary {
  colaboradoresCriados: number
  documentosImportados: number
  erros: string[]
  detalhes: ImportSummaryDetail[]
}

interface ImportPreview {
  totalColaboradores: number
  totalDocumentos: number
  colaboradores: {
    nome: string
    arquivos: string[]
  }[]
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
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<ImportPreview | null>(null)
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([])
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const appendLogs = useCallback((...entries: string[]) => {
    setLogs((previous) => [...previous, ...entries.filter(Boolean)])
  }, [])

  const formatFileSize = useCallback((size: number) => {
    if (!size) return "0 B"
    const units = ["B", "KB", "MB", "GB"]
    let value = size
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }

    const formatted = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)
    return `${formatted.replace(".0", "")} ${units[unitIndex]}`
  }, [])

  const resetModalState = useCallback(() => {
    setSelectedFile(null)
    setSelectedFileName(null)
    setPreviewData(null)
    setPreviewWarnings([])
    setIsAnalyzingFile(false)
    setIsImporting(false)
    setProgress(0)
    setLogs([])
  }, [])

  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      setIsImportModalOpen(open)
      if (!open) {
        resetModalState()
      }
    },
    [resetModalState],
  )

  const parseApiResponse = useCallback(async (response: Response) => {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      return response.json()
    }

    const rawPayload = (await response.text()).trim()

    if (!rawPayload) {
      return {}
    }

    try {
      return JSON.parse(rawPayload)
    } catch (error) {
      throw new Error(rawPayload || `Falha ao processar a resposta (status ${response.status}).`)
    }
  }, [])

  const handleAnalyzeFile = useCallback(
    async (file: File) => {
      setIsAnalyzingFile(true)
      setPreviewData(null)
      setPreviewWarnings([])
      setProgress(15)
      appendLogs(`Arquivo ${file.name} selecionado.`, "Iniciando análise do arquivo...")

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("mode", "preview")

        const response = await fetch("/api/colaboradores/import", {
          method: "POST",
          body: formData,
        })

        const data = await parseApiResponse(response)

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Falha ao analisar o arquivo para importação.")
        }

        if (data.preview) {
          setPreviewData(data.preview as ImportPreview)
          setProgress(40)
          appendLogs(
            `Análise concluída: ${data.preview.totalColaboradores} colaborador(es) detectado(s) e ${data.preview.totalDocumentos} documento(s) encontrado(s).`,
          )
        }

        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          setPreviewWarnings(data.warnings as string[])
          appendLogs(...(data.warnings as string[]).map((warning) => `Aviso: ${warning}`))
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível analisar o arquivo."
        appendLogs(`Erro durante a análise: ${message}`)
        toast({
          title: "Erro na análise do arquivo",
          description: message,
          variant: "destructive",
        })
        setPreviewData(null)
        setProgress(0)
      } finally {
        setIsAnalyzingFile(false)
      }
    },
    [appendLogs, parseApiResponse, toast],
  )

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (file) {
        setSelectedFile(file)
        setSelectedFileName(file.name)
        setImportSummary(null)
        setLogs([])
        setProgress(0)
        void handleAnalyzeFile(file)
      }

      event.target.value = ""
    },
    [handleAnalyzeFile],
  )

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleReanalyze = useCallback(() => {
    if (!selectedFile) {
      return
    }

    setLogs([])
    setProgress(0)
    void handleAnalyzeFile(selectedFile)
  }, [handleAnalyzeFile, selectedFile])

  const handleStartImport = useCallback(async () => {
    if (!selectedFile) {
      return
    }

    setIsImporting(true)
    setProgress((current) => (current < 60 ? 60 : current))
    appendLogs("Iniciando importação dos colaboradores...")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("mode", "import")

      const response = await fetch("/api/colaboradores/import", {
        method: "POST",
        body: formData,
      })

      const data = await parseApiResponse(response)

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Falha ao importar dados.")
      }

      if (data.summary) {
        const summary = data.summary as ImportSummary
        setImportSummary(summary)

        appendLogs(
          `Importação concluída com ${summary.colaboradoresCriados} colaborador(es) criado(s) e ${summary.documentosImportados} documento(s) enviados.`,
        )

        if (Array.isArray(summary.detalhes) && summary.detalhes.length > 0) {
          appendLogs(
            ...summary.detalhes.map((detail) => {
              const documentosLabel =
                detail.documentos === 1 ? "1 documento" : `${detail.documentos} documentos`
              const matriculaInfo = detail.matricula ? ` [${detail.matricula}]` : ""
              const mensagens = detail.mensagens.length > 0 ? ` - ${detail.mensagens.join(" | ")}` : ""
              const statusIcon = detail.sucesso ? "✔️" : "⚠️"
              return `${statusIcon} ${detail.nome}${matriculaInfo}: ${documentosLabel}${mensagens}`
            }),
          )
        }

        if (Array.isArray(summary.erros) && summary.erros.length > 0) {
          appendLogs(...summary.erros.map((erro) => `Aviso: ${erro}`))
        }

        setProgress(100)

        toast({
          title: "Importação concluída",
          description: `${summary.colaboradoresCriados} colaborador(es) e ${summary.documentosImportados} documento(s) processados.`,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível importar os dados."
      appendLogs(`Erro durante a importação: ${message}`)
      toast({
        title: "Erro na importação",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }, [appendLogs, parseApiResponse, selectedFile, toast])

  const selectedFileSize = useMemo(() => {
    return selectedFile ? formatFileSize(selectedFile.size) : null
  }, [formatFileSize, selectedFile])

  const logEntries = useMemo(() => {
    return logs.length > 0 ? logs : ["Aguardando seleção do arquivo..."]
  }, [logs])

  const getLogTone = useCallback((entry: string) => {
    const normalized = entry.toLowerCase()
    if (normalized.includes("erro")) {
      return "text-destructive"
    }
    if (normalized.includes("aviso") || normalized.includes("⚠️")) {
      return "text-yellow-600 dark:text-yellow-400"
    }
    if (normalized.includes("✔️") || normalized.includes("concluída")) {
      return "text-emerald-600 dark:text-emerald-400"
    }
    return "text-foreground"
  }, [])

  const canStartImport = useMemo(() => {
    return Boolean(selectedFile && previewData && !isAnalyzingFile && !isImporting && progress < 100)
  }, [isAnalyzingFile, isImporting, previewData, progress, selectedFile])

  const progressLabel = useMemo(() => {
    if (progress >= 100) {
      return "Importação concluída"
    }
    if (isImporting) {
      return "Importando colaboradores..."
    }
    if (isAnalyzingFile) {
      return "Analisando arquivo..."
    }
    if (progress > 0) {
      return "Aguardando confirmação da importação"
    }
    return null
  }, [isAnalyzingFile, isImporting, progress])

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
      <Dialog open={isImportModalOpen} onOpenChange={handleModalOpenChange}>
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

            <DialogTrigger asChild>
              <Button type="button">Abrir importador de colaboradores</Button>
            </DialogTrigger>

            {importSummary && (
              <div className="rounded-md border border-border bg-muted/50 p-4 text-sm space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">Resumo da última importação</span>
                  <span className="text-muted-foreground">
                    {importSummary.colaboradoresCriados} colaborador(es) criado(s) e {importSummary.documentosImportados}
                    documento(s) importado(s).
                  </span>
                </div>

                {importSummary.detalhes.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium text-foreground">Detalhes por colaborador</span>
                    <ScrollArea className="max-h-48 rounded-md border border-dashed bg-background/50">
                      <ul className="divide-y divide-border text-sm">
                        {importSummary.detalhes.map((detail, index) => (
                          <li key={`${detail.nome}-${detail.matricula ?? index}`} className="space-y-1 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-medium text-foreground">
                                {detail.nome}
                                {detail.matricula ? (
                                  <span className="text-muted-foreground font-normal"> • Matrícula {detail.matricula}</span>
                                ) : null}
                              </span>
                              <Badge variant={detail.sucesso ? "secondary" : "destructive"}>
                                {detail.documentos} PDF(s)
                              </Badge>
                            </div>
                            {detail.mensagens.length > 0 && (
                              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                {detail.mensagens.map((mensagem, mensagemIndex) => (
                                  <li key={`${mensagem}-${mensagemIndex}`}>{mensagem}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

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

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Importar colaboradores</DialogTitle>
            <DialogDescription>
              Envie um arquivo .zip com uma pasta raiz contendo subpastas com o nome de cada colaborador e os respectivos
              documentos em PDF.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="rounded-md border border-dashed border-border p-4">
              {selectedFileName ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-foreground">{selectedFileName}</p>
                    <p className="text-xs text-muted-foreground">{selectedFileSize}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectFile} disabled={isAnalyzingFile || isImporting}>
                      Trocar arquivo
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={handleReanalyze} disabled={isAnalyzingFile || isImporting || !selectedFile}>
                      Reanalisar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecione um arquivo .zip para visualizar os colaboradores detectados antes de importar.
                  </p>
                  <Button type="button" onClick={handleSelectFile} disabled={isAnalyzingFile || isImporting}>
                    Selecionar arquivo
                  </Button>
                </div>
              )}
            </div>

            {progress > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Progresso</Label>
                <Progress value={Math.min(progress, 100)} />
                {progressLabel && <p className="text-xs text-muted-foreground">{progressLabel}</p>}
              </div>
            )}

            {previewData && (
              <div className="space-y-3 rounded-md border border-border bg-muted/50 p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {previewData.totalColaboradores} colaborador(es) detectado(s)
                  </span>
                  <span className="text-muted-foreground">
                    {previewData.totalDocumentos} documento(s) PDF serão processados.
                  </span>
                </div>
                <ScrollArea className="max-h-48 rounded-md border border-dashed bg-background/50">
                  <ul className="divide-y divide-border text-sm">
                    {previewData.colaboradores.map((colaborador, index) => (
                      <li key={`${colaborador.nome}-${index}`} className="space-y-2 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{colaborador.nome}</span>
                          <Badge variant="outline">{colaborador.arquivos.length} PDF(s)</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {colaborador.arquivos.slice(0, 3).map((arquivo) => (
                            <Badge key={arquivo} variant="secondary" className="max-w-[12rem] truncate">
                              {arquivo}
                            </Badge>
                          ))}
                          {colaborador.arquivos.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{colaborador.arquivos.length - 3} arquivo(s)
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {previewWarnings.length > 0 && (
              <div className="rounded-md border border-yellow-500/60 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-200">
                <span className="font-medium text-sm">Avisos detectados durante a análise:</span>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {previewWarnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Logs da importação</Label>
              <ScrollArea className="h-40 rounded-md border border-dashed bg-background/50">
                <ul className="space-y-1 p-3 text-xs font-mono">
                  {logEntries.map((entry, index) => (
                    <li key={`${entry}-${index}`} className={`${getLogTone(entry)} leading-relaxed`}>
                      {entry}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleModalOpenChange(false)} disabled={isImporting}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleStartImport} disabled={!canStartImport}>
              {isImporting
                ? "Importando..."
                : previewData
                  ? `Importar ${previewData.totalColaboradores} colaborador(es)`
                  : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
