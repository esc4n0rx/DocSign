// components/SharedLinkManager.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useSharedLinks } from "@/hooks/useSharedLinks"
import { Colaborador } from "@/types/colaborador"
import { getDaysUntilExpiration, formatSharedLinkUrl } from "@/lib/shared-link"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Share2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  Users,
  Link as LinkIcon,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"

interface SharedLinkManagerProps {
  colaborador: Colaborador
}

export default function SharedLinkManager({ colaborador }: SharedLinkManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState("7")
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  const { toast } = useToast()
  const {
    sharedLinks,
    isLoading,
    createSharedLink,
    toggleSharedLink,
    deleteSharedLink
  } = useSharedLinks(colaborador.id)

  const handleCreateLink = async () => {
    const days = parseInt(expiresInDays)
    if (isNaN(days) || days < 1 || days > 365) {
      toast({
        title: "Erro",
        description: "Período de expiração deve ser entre 1 e 365 dias",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createSharedLink({
        colaborador_id: colaborador.id,
        expires_in_days: days
      })

      if (result.success && result.url) {
        // Copiar automaticamente para clipboard
        await navigator.clipboard.writeText(result.url)
        toast({
          title: "Link copiado!",
          description: "O link foi criado e copiado para a área de transferência",
          variant: "default"
        })
        setIsDialogOpen(false)
        setExpiresInDays("7")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async (token: string) => {
    try {
      const url = formatSharedLinkUrl(token)
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência",
        variant: "default"
      })

      // Limpar estado de "copiado" após 2 segundos
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar link",
        variant: "destructive"
      })
    }
  }

  const handleToggleLink = async (sharedLinkId: number, currentStatus: boolean) => {
    await toggleSharedLink(sharedLinkId, !currentStatus)
  }

  const handleDeleteLink = async (sharedLinkId: number) => {
    await deleteSharedLink(sharedLinkId)
  }

  const getStatusBadge = (sharedLink: any) => {
    const daysRemaining = getDaysUntilExpiration(sharedLink.expires_at)
    const isExpired = daysRemaining === 0
    const isActive = sharedLink.is_active

    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Expirado
        </Badge>
      )
    }

    if (!isActive) {
      return (
        <Badge variant="secondary" className="gap-1">
          <EyeOff className="h-3 w-3" />
          Inativo
        </Badge>
      )
    }

    if (daysRemaining <= 1) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Expira hoje
        </Badge>
      )
    }

    if (daysRemaining <= 3) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining} dias
        </Badge>
      )
    }

    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        {daysRemaining} dias
      </Badge>
    )
  }

  const activeLinksCount = sharedLinks.filter(link => 
    link.is_active && getDaysUntilExpiration(link.expires_at) > 0
  ).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Links Compartilhados
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Link Compartilhado</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{colaborador.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Matrícula: {colaborador.matricula}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_in_days">Período de validade (dias)</Label>
                  <Input
                    id="expires_in_days"
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    placeholder="Ex: 7"
                  />
                  <p className="text-xs text-muted-foreground">
                    O link será válido por {expiresInDays} dia(s) após a criação
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Informações de Segurança:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• O link permite visualização e download de documentos</li>
                      <li>• Apenas um link pode estar ativo por vez</li>
                      <li>• Todos os acessos são registrados para auditoria</li>
                      <li>• Links expirados não podem ser reativados</li>
                    </ul>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateLink}
                  disabled={isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Criar Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {activeLinksCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {activeLinksCount} link(s) ativo(s) para {colaborador.nome}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando links...</span>
          </div>
        ) : sharedLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum link compartilhado criado ainda</p>
            <p className="text-sm">Crie um link para compartilhar os documentos deste colaborador</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Acessos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      {getStatusBadge(link)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(link.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(link.expires_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{link.access_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(link.token)}
                          className="gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedToken === link.token ? 'Copiado!' : 'Copiar'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLink(link.id, link.is_active)}
                          disabled={getDaysUntilExpiration(link.expires_at) === 0}
                          className="gap-1"
                        >
                          {link.is_active ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Ativar
                            </>
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O link compartilhado será 
                                permanentemente removido e não poderá mais ser acessado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteLink(link.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Remover Link
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}