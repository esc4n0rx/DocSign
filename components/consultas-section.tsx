"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SharedLinkManager from "@/components/SharedLinkManager"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useDocuments } from "@/hooks/useDocuments"
import DocumentViewer from "@/components/DocumentViewer"
import DocumentUpload from "@/components/DocumentUpload"
import { Colaborador } from "@/types/colaborador"
import { Documento, DocumentoCategoria } from "@/types/documento"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  FileText,
  Download,
  Eye,
  Upload,
  Filter,
  Folder,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  File,
  Image,
  FileSpreadsheet,
  Loader2,
  UserCheck,
  Hash
} from "lucide-react"

const categorias: (DocumentoCategoria | "Todos")[] = [
  "Todos",
  "Contrato",
  "RG", 
  "CPF",
  "Comprovante de Residência",
  "Carteira de Trabalho",
  "Título de Eleitor",
  "Certificados",
  "Outros"
]

export function ConsultasSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [searchResults, setSearchResults] = useState<Colaborador[]>([])
  const [categoriaFilter, setCategoriaFilter] = useState<DocumentoCategoria | "Todos">("Todos")
  const [documentSearchTerm, setDocumentSearchTerm] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const colaboradorMatricula = params.get('colaborador')
    
    if (colaboradorMatricula) {
      setSearchTerm(colaboradorMatricula)
      searchColaboradores(colaboradorMatricula)
    }
  }, [])
  
  const { toast } = useToast()
  const { 
    documentos, 
    isLoading: documentsLoading, 
    fetchDocumentos, 
    deleteDocumento, 
    getViewUrl, 
    getDownloadUrl 
  } = useDocuments(selectedColaborador?.id)

  // Buscar colaboradores
  const searchColaboradores = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/colaboradores?search=${encodeURIComponent(term.trim())}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.colaboradores || [])
        if (data.colaboradores?.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Nenhum colaborador encontrado com este termo",
            variant: "default"
          })
        }
      } else {
        console.error('Erro ao buscar colaboradores:', data.error)
        toast({
          title: "Erro",
          description: "Falha na busca de colaboradores",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      toast({
        title: "Erro",
        description: "Erro de conexão durante a busca",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }, [toast])

  const handleSearch = () => {
    searchColaboradores(searchTerm)
  }

  const handleSelectColaborador = (colaborador: Colaborador) => {
    setSelectedColaborador(colaborador)
    setSearchResults([]) // Limpar resultados da busca
  }

  const clearSelection = () => {
    setSelectedColaborador(null)
    setDocumentSearchTerm("")
    setCategoriaFilter("Todos")
  }

  // Filtrar documentos
  const filteredDocumentos = documentos.filter(doc => {
    const matchesCategory = categoriaFilter === "Todos" || doc.categoria === categoriaFilter
    const matchesSearch = !documentSearchTerm || 
      doc.nome_original.toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
      (doc.categoria?.toLowerCase().includes(documentSearchTerm.toLowerCase()) || false)
    
    return matchesCategory && matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-4 w-4 text-blue-500" />
      case 'doc':
      case 'docx':
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'Contrato': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'RG': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'CPF': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Comprovante de Residência': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Carteira de Trabalho': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Título de Eleitor': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Certificados': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Outros': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
    return colors[categoria] || colors['Outros']
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Inativo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'Férias':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Licença Médica':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const handleView = (documento: Documento) => {
    window.open(getViewUrl(documento.id), '_blank')
  }

  const handleDownload = async (documento: Documento) => {
    const downloadUrl = getDownloadUrl(documento.id)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = documento.nome_original
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (documentoId: number) => {
    const success = await deleteDocumento(documentoId)
    if (success) {
      // Documentos já são recarregados automaticamente no hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Consulta de Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Busque e visualize documentos de colaboradores por matrícula ou nome
        </p>
      </div>

      {!selectedColaborador ? (
        <>
          {/* Campo de Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite a matrícula ou nome do colaborador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                    disabled={isSearching}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={!searchTerm.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados da Busca */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Resultados da Busca ({searchResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((colaborador) => (
                    <Card 
                      key={colaborador.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                      onClick={() => handleSelectColaborador(colaborador)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{colaborador.nome}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                <span>{colaborador.matricula}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(colaborador.status)}>
                            {colaborador.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{colaborador.cargo}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{colaborador.departamento}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{colaborador.email}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Colaborador Selecionado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedColaborador.nome}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span>Matrícula: {selectedColaborador.matricula}</span>
                      </div>
                      <Badge className={getStatusColor(selectedColaborador.status)}>
                        {selectedColaborador.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <SharedLinkManager colaborador={selectedColaborador} />
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={clearSelection}>
                    <Search className="h-4 w-4 mr-2" />
                    Nova Busca
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{selectedColaborador.cargo}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{selectedColaborador.departamento}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{selectedColaborador.email}</span>
                </div>
                {selectedColaborador.telefone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{selectedColaborador.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Admissão: {new Date(selectedColaborador.data_admissao).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pasta de Documentos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Pasta de Documentos ({documentos.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocumentos}
                    disabled={documentsLoading}
                  >
                    {documentsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="documents" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos ({filteredDocumentos.length})
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="mt-6">
                  {/* Filtros de Documentos */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar documentos..."
                        value={documentSearchTerm}
                        onChange={(e) => setDocumentSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoriaFilter} onValueChange={(value) => setCategoriaFilter(value as DocumentoCategoria | "Todos")}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de Documentos */}
                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Carregando documentos...</p>
                      </div>
                    </div>
                  ) : filteredDocumentos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {documentos.length === 0 ? 'Nenhum documento encontrado' : 'Nenhum resultado'}
                      </h3>
                      <p className="text-muted-foreground">
                        {documentos.length === 0 
                          ? 'Este colaborador ainda não possui documentos' 
                          : 'Tente ajustar os filtros de busca'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Enviado</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocumentos.map((documento) => (
                            <TableRow key={documento.id}>
                              <TableCell>
                                {getFileIcon(documento.tipo)}
                              </TableCell>
                              
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">{documento.nome_original}</p>
                                  <p className="text-sm text-muted-foreground uppercase">{documento.tipo}</p>
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={getCategoryColor(documento.categoria || 'Outros')}
                                >
                                  {documento.categoria || 'Outros'}
                                </Badge>
                              </TableCell>
                              
                              <TableCell className="text-muted-foreground">
                                {formatFileSize(documento.tamanho)}
                              </TableCell>
                              
                              <TableCell className="text-muted-foreground">
                                {formatDistanceToNow(new Date(documento.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  <DocumentViewer 
                                    documento={documento}
                                    trigger={
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(documento)}
                                    className="h-8 w-8 p-0"
                                    title="Baixar"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="mt-6">
                  <DocumentUpload
                    colaboradorId={selectedColaborador.id}
                    onUploadComplete={() => {
                      // Mudar para aba de documentos após upload
                      const documentsTab = document.querySelector('[value="documents"]') as HTMLElement
                      documentsTab?.click()
                    }}
                    className="border-0 shadow-none"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}