"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Colaborador, ColaboradorFormData } from "@/types/colaborador"
import DocumentUpload from "@/components/DocumentUpload"
import DocumentList from "@/components/DocumentList"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  FileText,
  Upload
} from "lucide-react"

// --- CONSTANTS ---
const departamentos = [
  "TI", "Recursos Humanos", "Comercial", "Design",
  "Financeiro", "Marketing", "Operações", "Administrativo"
]

const statusOptions: Array<Colaborador['status']> = [
  "Ativo", "Inativo", "Férias", "Licença Médica"
]

const initialFormData: ColaboradorFormData = {
  nome: "", matricula: "", cargo: "", departamento: "",
  status: "Ativo", email: "", telefone: "", data_admissao: "",
}

// --- SUB-COMPONENTS (within the same file) ---

interface ColaboradorFormProps {
  formData: ColaboradorFormData
  setFormData: React.Dispatch<React.SetStateAction<ColaboradorFormData>>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isSubmitting: boolean
  submitText: string
}

const ColaboradorFormComponent = ({
  formData, setFormData, onSubmit, onCancel, isSubmitting, submitText,
}: ColaboradorFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Digite o nome completo" disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="matricula">Matrícula</Label>
        <Input id="matricula" value={formData.matricula} onChange={(e) => setFormData({ ...formData, matricula: e.target.value.toUpperCase() })} placeholder="Digite a matrícula" disabled={isSubmitting} required />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="cargo">Cargo</Label>
        <Input id="cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} placeholder="Digite o cargo" disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="departamento">Departamento</Label>
        <Select value={formData.departamento} onValueChange={(value) => setFormData({ ...formData, departamento: value })} disabled={isSubmitting} required>
          <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
          <SelectContent>{departamentos.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Digite o email" disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" value={formData.telefone || ""} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} placeholder="Digite o telefone" disabled={isSubmitting} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="data_admissao">Data de Admissão</Label>
        <Input id="data_admissao" type="date" value={formData.data_admissao} onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })} disabled={isSubmitting} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: Colaborador['status']) => setFormData({ ...formData, status: value })} disabled={isSubmitting}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{statusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : submitText}</Button>
    </div>
  </form>
)

// --- MAIN COMPONENT ---

export default function ColaboradoresSection() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departamentoFilter, setDepartamentoFilter] = useState<string>("all")
  
  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'docs' | null
    data?: Colaborador
  }>({ type: null })

  const [formData, setFormData] = useState<ColaboradorFormData>(initialFormData)
  const [activeTab, setActiveTab] = useState('list');
  
  const { toast } = useToast()

  const fetchColaboradores = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/colaboradores')
      const data = await response.json()
      if (data.success) {
        setColaboradores(data.colaboradores)
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao carregar colaboradores", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchColaboradores()
  }, [])

  const filteredColaboradores = useMemo(() =>
    colaboradores.filter(colaborador => {
      const search = searchTerm.toLowerCase()
      const matchesSearch = colaborador.nome.toLowerCase().includes(search) ||
        colaborador.matricula.toLowerCase().includes(search) ||
        colaborador.email.toLowerCase().includes(search)
      
      const matchesStatus = statusFilter === "all" || colaborador.status === statusFilter
      const matchesDepartamento = departamentoFilter === "all" || colaborador.departamento === departamentoFilter
      
      return matchesSearch && matchesStatus && matchesDepartamento
    }), [colaboradores, searchTerm, statusFilter, departamentoFilter])

  const handleOpenModal = (type: 'create' | 'edit' | 'docs', data?: Colaborador) => {
    if (type === 'create') {
      setFormData(initialFormData);
    } else if (type === 'edit' && data) {
      setFormData({
        nome: data.nome, matricula: data.matricula, cargo: data.cargo,
        departamento: data.departamento, status: data.status, email: data.email,
        telefone: data.telefone || "", data_admissao: data.data_admissao,
      });
    } else if (type === 'docs') {
      setActiveTab('list'); // Reset tab on open
    }
    setModalState({ type, data });
  }
  
  const handleCloseModal = () => {
    setModalState({ type: null });
    setFormData(initialFormData); // Reset form data on any modal close
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const isEditing = modalState.type === 'edit'
    const url = '/api/colaboradores'
    const method = isEditing ? 'PUT' : 'POST'
    const body = isEditing ? JSON.stringify({ id: modalState.data?.id, ...formData }) : JSON.stringify(formData)
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const data = await response.json()

      if (data.success) {
        toast({ title: "Sucesso", description: `Colaborador ${isEditing ? 'atualizado' : 'criado'} com sucesso!` })
        handleCloseModal()
        fetchColaboradores()
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro Interno", description: "Tente novamente.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (colaborador: Colaborador) => {
    try {
      const response = await fetch(`/api/colaboradores/${colaborador.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        toast({ title: "Sucesso", description: "Colaborador removido com sucesso!" })
        fetchColaboradores()
      } else {
        toast({ title: "Erro", description: data.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Erro Interno", description: "Tente novamente.", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Inativo': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'Férias': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Licença Médica': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Colaboradores</h2>
          <p className="text-muted-foreground">Gerencie colaboradores e seus documentos</p>
        </div>
        <Button onClick={() => handleOpenModal('create')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, matrícula ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {statusOptions.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por departamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {departamentos.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredColaboradores.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {colaboradores.length === 0 ? 'Nenhum colaborador cadastrado' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {colaboradores.length === 0 ? 'Comece criando seu primeiro colaborador' : 'Tente ajustar os filtros de busca'}
            </p>
            {colaboradores.length === 0 && (
              <Button onClick={() => handleOpenModal('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Colaborador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColaboradores.map((colaborador) => (
            <Card key={colaborador.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-lg">{colaborador.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">{colaborador.matricula}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(colaborador.status)}>{colaborador.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /><span>{colaborador.cargo}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Building className="h-4 w-4" /><span>{colaborador.departamento}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /><span className="truncate">{colaborador.email}</span></div>
                  {colaborador.telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span>{colaborador.telefone}</span></div>}
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{new Date(colaborador.data_admissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal('docs', colaborador)} className="flex-1"><FileText className="h-4 w-4 mr-2" />Documentos</Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal('edit', colaborador)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir "{colaborador.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(colaborador)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
      <Dialog open={modalState.type === 'create' || modalState.type === 'edit'} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalState.type === 'edit' ? 'Editar Colaborador' : 'Criar Novo Colaborador'}</DialogTitle>
          </DialogHeader>
          <ColaboradorFormComponent
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isSubmitting={isSubmitting}
            submitText={modalState.type === 'edit' ? 'Salvar Alterações' : 'Criar Colaborador'}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={modalState.type === 'docs'} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Documentos de {modalState.data?.nome}</DialogTitle>
          </DialogHeader>
          {modalState.data && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list"><FileText className="h-4 w-4 mr-2" />Documentos</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" />Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="list" className="flex-1 overflow-auto mt-4">
                <DocumentList colaboradorId={modalState.data.id} className="border-0 shadow-none p-0" />
              </TabsContent>
              <TabsContent value="upload" className="flex-1 overflow-auto mt-4">
                <DocumentUpload colaboradorId={modalState.data.id} onUploadComplete={() => setActiveTab('list')} className="border-0 shadow-none p-0" />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}