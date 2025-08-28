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
const mockColaboradores = [
  {
    id: 1,
    nome: "João Silva Santos",
    matricula: "12345",
    cargo: "Desenvolvedor Senior",
    departamento: "TI",
    status: "Ativo",
    email: "joao.silva@empresa.com",
    telefone: "(11) 99999-9999",
    dataAdmissao: "2023-01-15",
    documentosCount: 3,
  },
  {
    id: 2,
    nome: "Maria Santos Oliveira",
    matricula: "67890",
    cargo: "Analista de RH",
    departamento: "Recursos Humanos",
    status: "Ativo",
    email: "maria.santos@empresa.com",
    telefone: "(11) 88888-8888",
    dataAdmissao: "2023-02-01",
    documentosCount: 2,
  },
  {
    id: 3,
    nome: "Pedro Costa Lima",
    matricula: "11111",
    cargo: "Gerente de Vendas",
    departamento: "Comercial",
    status: "Inativo",
    email: "pedro.costa@empresa.com",
    telefone: "(11) 77777-7777",
    dataAdmissao: "2022-06-10",
    documentosCount: 5,
  },
  {
    id: 4,
    nome: "Ana Paula Ferreira",
    matricula: "22222",
    cargo: "Designer UX/UI",
    departamento: "Design",
    status: "Ativo",
    email: "ana.ferreira@empresa.com",
    telefone: "(11) 66666-6666",
    dataAdmissao: "2023-03-20",
    documentosCount: 4,
  },
]

interface Colaborador {
  id?: number
  nome: string
  matricula: string
  cargo: string
  departamento: string
  status: string
  email: string
  telefone: string
  dataAdmissao: string
  documentosCount?: number
}

export function ColaboradoresSection() {
  const [colaboradores, setColaboradores] = useState(mockColaboradores)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [formData, setFormData] = useState<Colaborador>({
    nome: "",
    matricula: "",
    cargo: "",
    departamento: "",
    status: "Ativo",
    email: "",
    telefone: "",
    dataAdmissao: "",
  })

  const filteredColaboradores = colaboradores.filter(
    (colaborador) =>
      colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.matricula.includes(searchTerm) ||
      colaborador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddColaborador = () => {
    const newColaborador = {
      ...formData,
      id: Math.max(...colaboradores.map((c) => c.id)) + 1,
      documentosCount: 0,
    }
    setColaboradores([...colaboradores, newColaborador])
    setFormData({
      nome: "",
      matricula: "",
      cargo: "",
      departamento: "",
      status: "Ativo",
      email: "",
      telefone: "",
      dataAdmissao: "",
    })
    setIsAddDialogOpen(false)
  }

  const handleEditColaborador = (colaborador: (typeof mockColaboradores)[0]) => {
    setEditingColaborador(colaborador)
    setFormData(colaborador)
    setIsEditDialogOpen(true)
  }

  const handleUpdateColaborador = () => {
    if (editingColaborador) {
      setColaboradores(
        colaboradores.map((c) => (c.id === editingColaborador.id ? { ...formData, id: editingColaborador.id } : c)),
      )
      setIsEditDialogOpen(false)
      setEditingColaborador(null)
      setFormData({
        nome: "",
        matricula: "",
        cargo: "",
        departamento: "",
        status: "Ativo",
        email: "",
        telefone: "",
        dataAdmissao: "",
      })
    }
  }

  const handleRemoveColaborador = (id: number) => {
    setColaboradores(colaboradores.filter((c) => c.id !== id))
  }

  const handleViewDocuments = (colaborador: (typeof mockColaboradores)[0]) => {
    // Redirecionar para a seção de consultas com o colaborador selecionado
    console.log(`Visualizar documentos de: ${colaborador.nome}`)
  }

  const ColaboradorForm = ({ onSubmit, submitText }: { onSubmit: () => void; submitText: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            value={formData.matricula}
            onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
            placeholder="Digite a matrícula"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo</Label>
          <Input
            id="cargo"
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            placeholder="Digite o cargo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="departamento">Departamento</Label>
          <Select
            value={formData.departamento}
            onValueChange={(value) => setFormData({ ...formData, departamento: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TI">TI</SelectItem>
              <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Financeiro">Financeiro</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataAdmissao">Data de Admissão</Label>
          <Input
            id="dataAdmissao"
            type="date"
            value={formData.dataAdmissao}
            onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
          />
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
          <h1 className="text-3xl font-semibold text-foreground text-balance">Colaboradores</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie todos os colaboradores do sistema</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
            </DialogHeader>
            <ColaboradorForm onSubmit={handleAddColaborador} submitText="Adicionar Colaborador" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, matrícula, cargo ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredColaboradores.length} colaborador(es)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Colaboradores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredColaboradores.map((colaborador) => (
              <div
                key={colaborador.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {colaborador.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-foreground">{colaborador.nome}</h3>
                      <Badge variant={colaborador.status === "Ativo" ? "default" : "destructive"}>
                        {colaborador.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Matrícula: {colaborador.matricula}</span>
                      <span>•</span>
                      <span>{colaborador.cargo}</span>
                      <span>•</span>
                      <span>{colaborador.departamento}</span>
                      <span>•</span>
                      <span>{colaborador.documentosCount} documento(s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocuments(colaborador)}
                    className="gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Documentos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditColaborador(colaborador)}
                    className="gap-2"
                  >
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
                          Tem certeza que deseja remover o colaborador "{colaborador.nome}"? Esta ação não pode ser
                          desfeita e todos os documentos associados serão perdidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveColaborador(colaborador.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {filteredColaboradores.length === 0 && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum colaborador encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? `Não encontramos colaboradores com o termo "${searchTerm}"`
                  : "Adicione o primeiro colaborador ao sistema"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          <ColaboradorForm onSubmit={handleUpdateColaborador} submitText="Salvar Alterações" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
