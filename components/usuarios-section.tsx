"use client"

import { useState } from "react"
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

// Mock data para demonstração
const mockUsuarios = [
  {
    id: 1,
    nome: "Admin Sistema",
    email: "admin@docmanager.com",
    permissao: "Admin",
    status: "Ativo",
    ultimoAcesso: "2024-01-28",
    dataCriacao: "2023-01-01",
  },
  {
    id: 2,
    nome: "Carlos Mendes",
    email: "carlos.mendes@docmanager.com",
    permissao: "Editor",
    status: "Ativo",
    ultimoAcesso: "2024-01-27",
    dataCriacao: "2023-06-15",
  },
  {
    id: 3,
    nome: "Fernanda Lima",
    email: "fernanda.lima@docmanager.com",
    permissao: "Visualizador",
    status: "Ativo",
    ultimoAcesso: "2024-01-26",
    dataCriacao: "2023-08-20",
  },
  {
    id: 4,
    nome: "Roberto Silva",
    email: "roberto.silva@docmanager.com",
    permissao: "Editor",
    status: "Inativo",
    ultimoAcesso: "2024-01-15",
    dataCriacao: "2023-03-10",
  },
]

interface Usuario {
  id?: number
  nome: string
  email: string
  permissao: string
  status: string
  ultimoAcesso?: string
  dataCriacao?: string
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

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState(mockUsuarios)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<Usuario>({
    nome: "",
    email: "",
    permissao: "Visualizador",
    status: "Ativo",
    senha: "",
  })

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.permissao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUsuario = () => {
    const newUsuario = {
      ...formData,
      id: Math.max(...usuarios.map((u) => u.id)) + 1,
      ultimoAcesso: "Nunca",
      dataCriacao: new Date().toISOString().split("T")[0],
    }
    setUsuarios([...usuarios, newUsuario])
    setFormData({
      nome: "",
      email: "",
      permissao: "Visualizador",
      status: "Ativo",
      senha: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleEditUsuario = (usuario: (typeof mockUsuarios)[0]) => {
    setEditingUsuario(usuario)
    setFormData({ ...usuario, senha: "" })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUsuario = () => {
    if (editingUsuario) {
      setUsuarios(
        usuarios.map((u) =>
          u.id === editingUsuario.id ? { ...formData, id: editingUsuario.id, dataCriacao: u.dataCriacao } : u,
        ),
      )
      setIsEditDialogOpen(false)
      setEditingUsuario(null)
      setFormData({
        nome: "",
        email: "",
        permissao: "Visualizador",
        status: "Ativo",
        senha: "",
      })
    }
  }

  const handleRemoveUsuario = (id: number) => {
    setUsuarios(usuarios.filter((u) => u.id !== id))
  }

  const getPermissaoInfo = (permissao: string) => {
    return permissoes.find((p) => p.value === permissao) || permissoes[2]
  }

  const UsuarioForm = ({
    onSubmit,
    submitText,
    isEdit,
  }: { onSubmit: () => void; submitText: string; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Digite o nome completo"
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
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="permissao">Permissão</Label>
          <Select value={formData.permissao} onValueChange={(value) => setFormData({ ...formData, permissao: value })}>
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
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
          }}
        >
          Cancelar
        </Button>
        <Button onClick={onSubmit}>{submitText}</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground text-balance">Usuários</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie administradores do sistema</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
            <UsuarioForm onSubmit={handleAddUsuario} submitText="Adicionar Usuário" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, email ou permissão..."
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
                        <Badge variant={usuario.status === "Ativo" ? "default" : "destructive"}>{usuario.status}</Badge>
                        <Badge variant={permissaoInfo.color}>{permissaoInfo.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{usuario.email}</span>
                        <span>•</span>
                        <span>Último acesso: {usuario.ultimoAcesso}</span>
                        <span>•</span>
                        <span>Criado em: {usuario.dataCriacao}</span>
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
                    {usuario.id !== 1 && ( // Não permitir remover o admin principal
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
                              onClick={() => handleRemoveUsuario(usuario.id)}
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

          {filteredUsuarios.length === 0 && (
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
                  : "Adicione o primeiro usuário ao sistema"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <UsuarioForm onSubmit={handleUpdateUsuario} submitText="Salvar Alterações" isEdit />
        </DialogContent>
      </Dialog>
    </div>
  )
}
