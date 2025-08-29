'use client'

import { useState, useEffect, useCallback } from 'react'
import { Documento, DocumentoListResponse, DocumentoUpload } from '@/types/documento'
import { useToast } from '@/hooks/use-toast'

export function useDocuments(colaboradorId?: number) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const fetchDocumentos = useCallback(async () => {
    if (!colaboradorId) {
      setDocumentos([])
      return
    }

    setIsLoading(true)
    try {
      const url = `/api/documentos?colaborador_id=${colaboradorId}`
      
      const response = await fetch(url)
      const data: DocumentoListResponse = await response.json()

      if (data.success) {
        setDocumentos(data.documentos || [])
      } else {
        console.error('Erro ao buscar documentos:', data.error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar documentos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão ao carregar documentos',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [colaboradorId, toast])

  const uploadDocumento = useCallback(async (upload: DocumentoUpload): Promise<boolean> => {
    try {
      setUploadProgress(0)
      
      const formData = new FormData()
      formData.append('file', upload.file)
      formData.append('colaborador_id', upload.colaborador_id.toString())
      if (upload.categoria) {
        formData.append('categoria', upload.categoria)
      }

      const xhr = new XMLHttpRequest()

      return new Promise((resolve) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', async () => {
          setUploadProgress(100)
          
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              toast({
                title: 'Sucesso',
                description: 'Documento enviado com sucesso!',
              })
              await fetchDocumentos() // Recarregar lista
              resolve(true)
            } else {
              toast({
                title: 'Erro',
                description: response.error || 'Erro no upload',
                variant: 'destructive'
              })
              resolve(false)
            }
          } else {
            toast({
              title: 'Erro',
              description: 'Erro no servidor durante upload',
              variant: 'destructive'
            })
            resolve(false)
          }
          
          setTimeout(() => setUploadProgress(0), 2000)
        })

        xhr.addEventListener('error', () => {
          toast({
            title: 'Erro',
            description: 'Erro de conexão durante upload',
            variant: 'destructive'
          })
          setUploadProgress(0)
          resolve(false)
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro',
        description: 'Erro interno durante upload',
        variant: 'destructive'
      })
      setUploadProgress(0)
      return false
    }
  }, [toast, fetchDocumentos])

  const deleteDocumento = useCallback(async (documentoId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/documentos?id=${documentoId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Documento removido com sucesso',
        })
        await fetchDocumentos() // Recarregar lista
        return true
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao remover documento',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error('Erro ao deletar documento:', error)
      toast({
        title: 'Erro',
        description: 'Erro de conexão ao remover documento',
        variant: 'destructive'
      })
      return false
    }
  }, [toast, fetchDocumentos])

  const getViewUrl = useCallback((documentoId: number) => {
    return `/api/documentos/${documentoId}/view`
  }, [])

  const getDownloadUrl = useCallback((documentoId: number) => {
    return `/api/documentos/${documentoId}/download`
  }, [])

  useEffect(() => {
    fetchDocumentos()
  }, [fetchDocumentos])

  return {
    documentos,
    isLoading,
    uploadProgress,
    fetchDocumentos,
    uploadDocumento,
    deleteDocumento,
    getViewUrl,
    getDownloadUrl
  }
}