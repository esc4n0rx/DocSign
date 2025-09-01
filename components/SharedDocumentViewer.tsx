// components/SharedDocumentViewer.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SharedAccessData } from "@/types/shared-link"
import { getDaysUntilExpiration } from "@/lib/shared-link"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User,
  Mail,
  Hash,
  Building,
  Briefcase,
  Calendar,
  FileText,
  Download,
  Eye,
  Search,
  File,
  Image,
  FileSpreadsheet,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"

interface SharedDocumentViewerProps {
  token: string
  initialData?: SharedAccessData
}

export default function SharedDocumentViewer({ token, initialData }: SharedDocumentViewerProps) {
  const [data, setData] = useState<SharedAccessData | null>(initialData || null)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [token, initialData])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/shared-access/${token}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDocument = (documentId: number) => {
    window.open(`/api/shared-access/${token}/document/${documentId}`, '_blank')
  }

  const handleDownloadDocument = (documentId: number, fileName: string) => {
    const link = document.createElement('a')
    link.href = `/api/shared-access/${token}/document/${documentId}`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchData} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Dados não encontrados</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysUntilExpiration = getDaysUntilExpiration(data.expires_at)
  const isExpiringSoon = daysUntilExpiration <= 3

  const filteredDocumentos = data.documentos.filter(doc =>
    doc.nome_original.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              Documentos do Colaborador
            </h1>
            <Badge 
              variant={isExpiringSoon ? "destructive" : "default"}
              className="gap-1"
            >
              <Clock className="h-3 w-3" />
              {daysUntilExpiration > 0 
                ? `Expira em ${daysUntilExpiration} dia${daysUntilExpiration > 1 ? 's' : ''}`
                : 'Expirado'
              }
            </Badge>
          </div>

          {/* Info do Colaborador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{data.colaborador.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Matrícula</p>
                    <p className="font-medium">{data.colaborador.matricula}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{data.colaborador.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">{data.colaborador.departamento}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso de Expiração */}
          {isExpiringSoon && daysUntilExpiration > 0 && (
            <div className="mt-4 flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Este link expira em breve!</p>
                <p>
                  Baixe todos os documentos necessários antes da expiração em{' '}
                  {formatDistanceToNow(new Date(data.expires_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Documentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos ({data.documentos.length})
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                 <Input
                   placeholder="Buscar documentos..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-9 w-64"
                 />
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           {filteredDocumentos.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>
                 {searchTerm 
                   ? "Nenhum documento encontrado com este termo" 
                   : "Nenhum documento disponível"
                 }
               </p>
             </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Documento</TableHead>
                   <TableHead>Categoria</TableHead>
                   <TableHead>Tamanho</TableHead>
                   <TableHead>Criado em</TableHead>
                   <TableHead>Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredDocumentos.map((documento) => (
                   <TableRow key={documento.id}>
                     <TableCell>
                       <div className="flex items-center gap-3">
                         {getFileIcon(documento.tipo)}
                         <div>
                           <p className="font-medium">{documento.nome_original}</p>
                           <p className="text-sm text-muted-foreground">
                             {documento.tipo.toUpperCase()}
                           </p>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       {documento.categoria && (
                         <Badge 
                           variant="outline" 
                           className={getCategoryColor(documento.categoria)}
                         >
                           {documento.categoria}
                         </Badge>
                       )}
                     </TableCell>
                     <TableCell>
                       <span className="text-sm text-muted-foreground">
                         {formatFileSize(documento.tamanho)}
                       </span>
                     </TableCell>
                     <TableCell>
                       <span className="text-sm text-muted-foreground">
                         {formatDistanceToNow(new Date(documento.created_at), {
                           addSuffix: true,
                           locale: ptBR
                         })}
                       </span>
                     </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleViewDocument(documento.id)}
                           className="gap-1"
                         >
                           <Eye className="h-3 w-3" />
                           Visualizar
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDownloadDocument(documento.id, documento.nome_original)}
                           className="gap-1"
                         >
                           <Download className="h-3 w-3" />
                           Baixar
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>

       {/* Footer */}
       <div className="mt-8 text-center">
         <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
           <Shield className="h-4 w-4" />
           <span>
             Link de acesso seguro • {data.access_count} visualização{data.access_count !== 1 ? 'ões' : ''}
           </span>
         </div>
         <p className="text-xs text-muted-foreground mt-1">
           Este link expira em {formatDistanceToNow(new Date(data.expires_at), { 
             addSuffix: true, 
             locale: ptBR 
           })}
         </p>
       </div>
     </div>
   </div>
 )
}