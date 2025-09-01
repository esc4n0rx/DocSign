// hooks/useSharedLinks.ts
import { useState, useEffect, useCallback } from 'react'
import { SharedLink, SharedLinkFormData, SharedLinkCreateResponse } from '@/types/shared-link'
import { useToast } from '@/hooks/use-toast'

export function useSharedLinks(colaboradorId?: number) {
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchSharedLinks = useCallback(async () => {
    if (!colaboradorId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/colaboradores/${colaboradorId}/shared-link`)
      const data = await response.json()

      if (data.success) {
        setSharedLinks(data.shared_links || [])
      } else {
        console.error('Erro ao buscar links compartilhados:', data.error)
      }
    } catch (error) {
      console.error('Erro na busca de links compartilhados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [colaboradorId])

  const createSharedLink = useCallback(async (
    formData: SharedLinkFormData
  ): Promise<SharedLinkCreateResponse> => {
    try {
      const response = await fetch(`/api/colaboradores/${formData.colaborador_id}/shared-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expires_in_days: formData.expires_in_days }),
      })

      const data: SharedLinkCreateResponse = await response.json()

      if (data.success) {
        toast({
          title: "Link compartilhado criado",
          description: "O link foi gerado com sucesso",
          variant: "default"
        })
        fetchSharedLinks() // Recarregar lista
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao criar link compartilhado",
          variant: "destructive"
        })
      }

      return data
    } catch (error) {
      const errorMessage = "Erro de conexão ao criar link compartilhado"
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
      return { success: false, error: errorMessage }
    }
  }, [toast, fetchSharedLinks])

  const toggleSharedLink = useCallback(async (
    sharedLinkId: number,
    isActive: boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/colaboradores/${colaboradorId}/shared-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          shared_link_id: sharedLinkId,
          is_active: isActive 
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: isActive ? "Link ativado" : "Link desativado",
          description: `O link foi ${isActive ? 'ativado' : 'desativado'} com sucesso`,
          variant: "default"
        })
        fetchSharedLinks() // Recarregar lista
        return true
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao alterar status do link",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao alterar link",
        variant: "destructive"
      })
      return false
    }
  }, [colaboradorId, toast, fetchSharedLinks])

  const deleteSharedLink = useCallback(async (sharedLinkId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/colaboradores/${colaboradorId}/shared-link`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shared_link_id: sharedLinkId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Link removido",
          description: "O link compartilhado foi removido com sucesso",
          variant: "default"
        })
        fetchSharedLinks() // Recarregar lista
        return true
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao remover link compartilhado",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão ao remover link",
        variant: "destructive"
      })
      return false
    }
  }, [colaboradorId, toast, fetchSharedLinks])

  useEffect(() => {
    fetchSharedLinks()
  }, [fetchSharedLinks])

  return {
    sharedLinks,
    isLoading,
    fetchSharedLinks,
    createSharedLink,
    toggleSharedLink,
    deleteSharedLink
  }
}