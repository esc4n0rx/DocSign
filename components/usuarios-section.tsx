"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Usuario } from "@/types/auth"

// Tipos e constantes movidos para o escopo do módulo
interface UsuarioFormData extends Omit<Usuario, 'id' | 'created_at' | 'updated_at' | 'ultimo_acesso'> {
  id?: string
  senha?: string
}

const permissoes = [
  {
    value: "Admin",
    label: "Administrador",
    description: "Acesso total ao sistema",
    color: "default" as const,
  },
  {
    value: "Editor",
    label: "Editor",
    description: "Pode visualizar e editar dados",
    color: "secondary" as const,
  },
  {
    value: "Visualizador",
    label: "Visualizador",
    description: "Apenas visualização",
    color: "outline" as const,
  },
]

const initialFormData: UsuarioFormData = {
  nome: "",
  email: "",
  matricula: "",
  permissao: "Visualizador",
  status: "Ativo",
  senha: "",
}

// Props para o novo componente de formulário independente
interface UsuarioFormProps {
  formData: UsuarioFormData
  setFormData: React.Dispatch<React.SetStateAction<UsuarioFormData>>
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
  submitText: string
  isEdit?: boolean
}

// O componente do formulário agora é definido FORA do componente principal
const UsuarioFormComponent = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitText,
  isEdit,
}: UsuarioFormProps) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Digite o nome completo"
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Digite o email"
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="matricula">Matrícula</Label>
        <Input
          id="matricula"
          value={formData.matricula}
          onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })}
          placeholder="Digite a matrícula"
          disabled={isSubmitting}
          autoComplete="off"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="permissao">Permissão</Label>
        <Select
          value={formData.permissao}
          onValueChange={(value) => setFormData({ ...formData, permissao: value as any })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {permissoes.map((permissao) => (
              <SelectItem key={permissao.value} value={permissao.value}>
                <div className="flex flex-col">
                  <span>{permissao.label}</span>
                  <span className="text-xs text-muted-foreground">{permissao.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="senha">{isEdit ? "Nova Senha (deixe em branco para manter atual)" : "Senha"}</Label>
      <Input
        id="senha"
        type="password"
        value={formData.senha}
        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
        placeholder={isEdit ? "Digite nova senha (opcional)" : "Digite a senha"}
        disabled={isSubmitting}
        autoComplete="new-password"
      />
    </div>

    <div className="flex justify-end gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : submitText}
      </Button>
    </div>
  </form>
)

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<UsuarioFormData>(initialFormData)

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.permissao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const loadUsuarios = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.usuarios)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const handleAddUsuario = async () => {
    if (!formData.nome || !formData.email || !formData.matricula || !formData.senha) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso",
        })
        resetForm()
        setIsAddDialogOpen(false)
        loadUsuarios()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({ ...usuario, senha: "" })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUsuario = async () => {
    if (!editingUsuario || !formData.nome || !formData.email || !formData.matricula) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingUsuario.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        })
        setIsEditDialogOpen(false)
        setEditingUsuario(null)
        resetForm()
        loadUsuarios()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveUsuario = async (usuario: Usuario) => {
    try {
      const response = await fetch(`/api/auth/register?id=${usuario.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário removido com sucesso",
        })
        loadUsuarios()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao remover usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    }
  }

  const getPermissaoInfo = (permissao: string) => {
    return permissoes.find((p) => p.value === permissao) || permissoes[2]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleCloseAddDialog = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleCloseEditDialog = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setEditingUsuario(null)
      resetForm()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground text-balance">Usuários</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie administradores do sistema</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground text-balance">Usuários</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie administradores do sistema</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleCloseAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <UsuarioFormComponent
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddUsuario}
              onCancel={() => handleCloseAddDialog(false)}
              isSubmitting={isSubmitting}
              submitText="Adicionar Usuário"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, email, matrícula ou permissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredUsuarios.length} usuário(s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Níveis de Permissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissoes.map((permissao) => (
              <div key={permissao.value} className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={permissao.color}>{permissao.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{permissao.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsuarios.map((usuario) => {
              const permissaoInfo = getPermissaoInfo(usuario.permissao)
              const isMaster = usuario.matricula === 'MASTER001'

              return (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {usuario.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-foreground">{usuario.nome}</h3>
                        {isMaster && <Badge variant="secondary">Master</Badge>}
                        <Badge variant={usuario.status === "Ativo" ? "default" : "destructive"}>{usuario.status}</Badge>
                        <Badge variant={permissaoInfo.color}>{permissaoInfo.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{usuario.email}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Matrícula: {usuario.matricula}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Último acesso: {usuario.ultimo_acesso ? formatDate(usuario.ultimo_acesso) : 'Nunca'}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Criado em: {formatDate(usuario.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUsuario(usuario)} className="gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </Button>
                    {!isMaster && ( // Não permitir remover o usuário master
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover o usuário "{usuario.nome}"? Esta ação não pode ser desfeita
                              e o usuário perderá acesso ao sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveUsuario(usuario)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredUsuarios.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <svg
                className="h-12 w-12 mx-auto mb-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? `Não encontramos usuários com o termo "${searchTerm}"`
                  : "Nenhum usuário cadastrado no sistema"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <UsuarioFormComponent
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateUsuario}
            onCancel={() => handleCloseEditDialog(false)}
            isSubmitting={isSubmitting}
            submitText="Salvar Alterações"
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}