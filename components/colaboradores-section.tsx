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
import { Colaborador, ColaboradorFormData } from "@/types/colaborador"

const departamentos = [
  "TI",
  "Recursos Humanos", 
  "Comercial",
  "Design",
  "Financeiro",
  "Marketing",
  "Operações",
  "Administrativo"
]

const statusOptions: Array<Colaborador['status']> = [
  "Ativo",
  "Inativo",
  "Férias", 
  "Licença Médica"
]

const initialFormData: ColaboradorFormData = {
  nome: "",
  matricula: "",
  cargo: "",
  departamento: "",
  status: "Ativo",
  email: "",
  telefone: "",
  data_admissao: "",
}

interface ColaboradorFormProps {
  formData: ColaboradorFormData
  setFormData: React.Dispatch<React.SetStateAction<ColaboradorFormData>>
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
  submitText: string
  isEdit?: boolean
}

const ColaboradorFormComponent = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitText,
  isEdit,
}: ColaboradorFormProps) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Digite o nome completo"
          disabled={isSubmitting}
          required
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
          required
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
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="departamento">Departamento</Label>
        <Select
          value={formData.departamento}
          onValueChange={(value) => setFormData({ ...formData, departamento: value })}
          disabled={isSubmitting}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o departamento" />
          </SelectTrigger>
          <SelectContent>
            {departamentos.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
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
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          value={formData.telefone || ""}
          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          placeholder="(11) 99999-9999"
          disabled={isSubmitting}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="dataAdmissao">Data de Admissão</Label>
        <Input
          id="dataAdmissao"
          type="date"
          value={formData.data_admissao}
          onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value: Colaborador['status']) => setFormData({ ...formData, status: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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

export function ColaboradoresSection() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ColaboradorFormData>(initialFormData)

  const filteredColaboradores = colaboradores.filter(
    (colaborador) =>
      colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const loadColaboradores = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/colaboradores')
      const data = await response.json()
      
      if (data.success) {
        setColaboradores(data.colaboradores)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao carregar colaboradores",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar colaboradores",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadColaboradores()
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const validateForm = () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.matricula.trim()) {
      toast({
        title: "Erro",
        description: "Matrícula é obrigatória",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.cargo.trim()) {
      toast({
        title: "Erro",
        description: "Cargo é obrigatório",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.departamento) {
      toast({
        title: "Erro",
        description: "Departamento é obrigatório",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.data_admissao) {
      toast({
        title: "Erro",
        description: "Data de admissão é obrigatória",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleAddColaborador = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/colaboradores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Colaborador criado com sucesso${data.cloudinaryResult?.success ? ' e pasta no Cloudinary criada' : ''}`,
        })
        resetForm()
        setIsAddDialogOpen(false)
        loadColaboradores()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar colaborador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao criar colaborador:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditColaborador = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador)
    setFormData({
      nome: colaborador.nome,
      matricula: colaborador.matricula,
      cargo: colaborador.cargo,
      departamento: colaborador.departamento,
      status: colaborador.status,
      email: colaborador.email,
      telefone: colaborador.telefone || "",
      data_admissao: colaborador.data_admissao,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateColaborador = async () => {
    if (!editingColaborador || !validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/colaboradores', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: editingColaborador.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Colaborador atualizado com sucesso",
        })
        setIsEditDialogOpen(false)
        setEditingColaborador(null)
        resetForm()
        loadColaboradores()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar colaborador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveColaborador = async (colaborador: Colaborador) => {
    try {
      const response = await fetch(`/api/colaboradores/${colaborador.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Colaborador removido com sucesso",
        })
        loadColaboradores()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao remover colaborador",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao remover colaborador:', error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    }
  }

  const handleViewDocuments = (colaborador: Colaborador) => {
    // TODO: Navegar para seção de consultas com colaborador selecionado
    console.log(`Visualizar documentos de: ${colaborador.nome}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const getStatusVariant = (status: Colaborador['status']) => {
    switch (status) {
      case 'Ativo':
        return 'default' as const
      case 'Férias':
        return 'secondary' as const
      case 'Licença Médica':
        return 'outline' as const
      case 'Inativo':
        return 'destructive' as const
      default:
        return 'outline' as const
    }
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
      setEditingColaborador(null)
      resetForm()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground text-balance">Colaboradores</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie todos os colaboradores do sistema</p>
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
          <h1 className="text-3xl font-semibold text-foreground text-balance">Colaboradores</h1>
          <p className="text-muted-foreground mt-2 text-pretty">Gerencie todos os colaboradores do sistema</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleCloseAddDialog}>
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
            <ColaboradorFormComponent
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAddColaborador}
              onCancel={() => handleCloseAddDialog(false)}
              isSubmitting={isSubmitting}
              submitText="Adicionar Colaborador"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por nome, matrícula, cargo, departamento ou email..."
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
                      <Badge variant={getStatusVariant(colaborador.status)}>
                        {colaborador.status}
                      </Badge>
                      {colaborador.cloudinary_folder && (
                        <Badge variant="outline" className="text-xs">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 10l4 4 4-4" />
                          </svg>
                          Pasta Criada
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Matrícula: {colaborador.matricula}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{colaborador.cargo}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{colaborador.departamento}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{colaborador.email}</span>
                      <span className="hidden md:inline">•</span>
                      <span>Admissão: {formatDate(colaborador.data_admissao)}</span>
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
                          desfeita e todos os documentos associados no Banco de Dados também serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveColaborador(colaborador)}
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

          {filteredColaboradores.length === 0 && !isLoading && (
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
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          <ColaboradorFormComponent
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateColaborador}
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