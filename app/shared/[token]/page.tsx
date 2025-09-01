// app/shared/[token]/page.tsx
import { notFound } from 'next/navigation'
import SharedDocumentViewer from '@/components/SharedDocumentViewer'
import { createServiceClient } from '@/lib/auth'
import { isSharedLinkValid } from '@/lib/shared-link'
import { SharedAccessData } from '@/types/shared-link'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getSharedData(token: string): Promise<SharedAccessData | null> {
  try {
    const serviceSupabase = createServiceClient()

    // Buscar link compartilhado pelo token
    const { data: sharedLink, error: linkError } = await serviceSupabase
      .from('shared_links')
      .select(`
        *,
        colaborador:colaboradores(*)
      `)
      .eq('token', token)
      .single()

    if (linkError || !sharedLink) {
      return null
    }

    // Verificar se o link ainda é válido
    if (!isSharedLinkValid(sharedLink)) {
      return null
    }

    // Buscar documentos do colaborador
    const { data: documentos, error: docsError } = await serviceSupabase
      .from('documentos')
      .select('id, nome_original, tipo, tamanho, categoria, created_at')
      .eq('colaborador_id', sharedLink.colaborador_id)
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('Erro ao buscar documentos:', docsError)
      return null
    }

    return {
      colaborador: sharedLink.colaborador,
      documentos: documentos || [],
      expires_at: sharedLink.expires_at,
      access_count: sharedLink.access_count
    }
  } catch (error) {
    console.error('Erro ao buscar dados compartilhados:', error)
    return null
  }
}

export default async function SharedPage({ params }: PageProps) {
  const resolvedParams = await params
  const { token } = resolvedParams

  if (!token) {
    notFound()
  }

  const data = await getSharedData(token)

  if (!data) {
    notFound()
  }

  return (
    <SharedDocumentViewer 
      token={token} 
      initialData={data}
    />
  )
}

// Metadados da página
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params
  const { token } = resolvedParams
  
  const data = await getSharedData(token)
  
  if (!data) {
    return {
      title: 'Link não encontrado',
      description: 'O link solicitado não foi encontrado ou expirou.',
    }
  }

  return {
    title: `Documentos - ${data.colaborador.nome}`,
    description: `Visualize os documentos de ${data.colaborador.nome} através do link compartilhado.`,
    robots: 'noindex, nofollow', // Não indexar páginas de acesso público
  }
}