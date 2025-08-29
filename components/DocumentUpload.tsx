'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { DocumentoCategoria } from '@/types/documento'
import { useDocuments } from '@/hooks/useDocuments'

interface DocumentUploadProps {
  colaboradorId: number
  onUploadComplete?: () => void
  className?: string
}

const categorias: DocumentoCategoria[] = [
  'Contrato',
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Carteira de Trabalho',
  'Título de Eleitor',
  'Certificados',
  'Outros'
]

export default function DocumentUpload({ 
  colaboradorId, 
  onUploadComplete,
  className 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [categoria, setCategoria] = useState<DocumentoCategoria>('Outros')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocumento, uploadProgress } = useDocuments()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validar arquivos
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      return validTypes.includes(file.type) && file.size <= maxSize
    })
    
    if (validFiles.length !== selectedFiles.length) {
      alert('Alguns arquivos foram ignorados. Apenas PDF, JPG, PNG, DOC e DOCX até 10MB são aceitos.')
    }
    
    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of files) {
        const success = await uploadDocumento({
          file,
          colaborador_id: colaboradorId,
          categoria
        })

        if (!success) {
          setIsUploading(false)
          return
        }
      }

      // Upload completado com sucesso
      setFiles([])
      setCategoria('Outros')
      onUploadComplete?.()
    } catch (error) {
      console.error('Erro no upload:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium text-foreground">Upload de Documentos</h3>
            <p className="text-sm text-muted-foreground">
              Selecione os arquivos para upload (PDF, JPG, PNG, DOC, DOCX - máx. 10MB cada)
            </p>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={(value) => setCategoria(value as DocumentoCategoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="files">Arquivos</Label>
            <Input
              ref={fileInputRef}
              id="files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="cursor-pointer"
            />
          </div>

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Arquivos Selecionados ({files.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar {files.length > 0 ? `(${files.length})` : ''}
                </>
              )}
            </Button>
            
            {files.length > 0 && !isUploading && (
              <Button
                variant="outline"
                onClick={() => setFiles([])}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}