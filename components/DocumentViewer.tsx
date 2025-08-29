'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Eye, 
  Download, 
  FileText, 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2 
} from 'lucide-react'
import { Documento } from '@/types/documento'

interface DocumentViewerProps {
  documento: Documento
  trigger?: React.ReactNode
}

export default function DocumentViewer({ documento, trigger }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleError = () => {
    setIsLoading(false)
    setError('Erro ao carregar o documento')
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const downloadUrl = `/api/documentos/${documento.id}/download`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = documento.nome_original
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewUrl = `/api/documentos/${documento.id}/view`

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-left">{documento.nome_original}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {documento.categoria || 'Outros'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {documento.tipo.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-2">
              {documento.tipo.toLowerCase() === 'pdf' && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-12 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-muted/10 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando documento...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Erro na Visualização
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Documento
                </Button>
              </div>
            </div>
          )}
          
          {/* Viewer baseado no tipo de arquivo */}
          {documento.tipo.toLowerCase() === 'pdf' ? (
            <iframe
              src={`${viewUrl}#zoom=${scale * 100}&rotate=${rotation}`}
              className="w-full h-full border-0"
              title={documento.nome_original}
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : ['jpg', 'jpeg', 'png'].includes(documento.tipo.toLowerCase()) ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={viewUrl}
                alt={documento.nome_original}
                className="max-w-full max-h-full object-contain"
                style={{ 
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Visualização Não Disponível
                </h3>
                <p className="text-muted-foreground mb-4">
                  Este tipo de arquivo não pode ser visualizado no navegador
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar para Visualizar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}