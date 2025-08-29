'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
} from '@/components/ui/alert-dialog'
import {
  File,
  Download,
  Eye,
  Trash2,
  Search,
  FileText,
  Image,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'
import { Documento } from '@/types/documento'
import { useDocuments } from '@/hooks/useDocuments'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DocumentListProps {
  colaboradorId?: number
  showColaborador?: boolean
  className?: string
}

export default function DocumentList({ 
  colaboradorId, 
  showColaborador = false,
  className 
}: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { documentos, isLoading, deleteDocumento, getViewUrl, getDownloadUrl } = useDocuments(colaboradorId)

  const filteredDocumentos = documentos.filter(doc =>
    doc.nome_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (showColaborador && doc.colaborador?.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

  const handleView = (documento: Documento) => {
    const viewUrl = getViewUrl(documento.id)
    window.open(viewUrl, '_blank')
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
    await deleteDocumento(documentoId)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando documentos...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Documentos ({documentos.length})
          </CardTitle>
          
          {/* Busca */}
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredDocumentos.length === 0 ? (
          <div className="text-center py-8">
            <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {documentos.length === 0 ? 'Nenhum documento encontrado' : 'Nenhum resultado'}
            </h3>
            <p className="text-muted-foreground">
              {documentos.length === 0 
                ? 'Faça upload dos primeiros documentos' 
                : 'Tente ajustar os termos de busca'
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
                  {showColaborador && <TableHead>Colaborador</TableHead>}
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
                    
                    {showColaborador && (
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{documento.colaborador?.nome}</p>
                          <p className="text-sm text-muted-foreground">{documento.colaborador?.matricula}</p>
                        </div>
                      </TableCell>
                    )}
                    
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(documento)}
                          className="h-8 w-8 p-0"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(documento)}
                          className="h-8 w-8 p-0"
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o documento "{documento.nome_original}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(documento.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
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