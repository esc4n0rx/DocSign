import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { deleteColaboradorFolder, deleteFile } from '@/lib/storage-api'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário atual tem permissão
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || !['Admin', 'Editor'].includes(currentUserData.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem remover colaboradores' },
        { status: 403 }
      )
    }

    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    // Verificar se colaborador existe e buscar dados
    const { data: colaborador } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    console.log(`Removendo colaborador ${colaborador.nome} (${colaborador.matricula})...`)

    // Buscar todos os documentos do colaborador para remoção individual dos arquivos
    const { data: documentos } = await serviceSupabase
      .from('documentos')
      .select('*')
      .eq('colaborador_id', colaboradorId)

    let storageResult = { success: true, error: null, deletedFiles: 0 }
    
    // Remover arquivos individuais da API de storage
    if (documentos && documentos.length > 0) {
      console.log(`Removendo ${documentos.length} arquivos da API de storage...`)
      
      for (const documento of documentos) {
        try {
          // Verificar se é documento novo (com storage) ou antigo (com cloudinary)
          if (documento.storage_folder && documento.storage_filename) {
            // Documento novo - usar API de storage
            console.log(`Removendo arquivo: ${documento.storage_filename} da pasta: ${documento.storage_folder}`)
            const deleteResult = await deleteFile(documento.storage_folder, documento.storage_filename)
            
            if (deleteResult.success) {
              storageResult.deletedFiles++
            } else {
              console.warn(`Falha ao remover arquivo ${documento.storage_filename}: ${deleteResult.error}`)
            }
          } else if (documento.cloudinary_public_id) {
            // Documento antigo - usar Cloudinary (compatibilidade temporária)
            console.log(`Removendo arquivo do Cloudinary: ${documento.cloudinary_public_id}`)
            const { deleteFromCloudinary } = await import('@/lib/cloudinary')
            const cloudinaryResult = await deleteFromCloudinary(documento.cloudinary_public_id)
            
            if (cloudinaryResult.success) {
              storageResult.deletedFiles++
            } else {
              console.warn(`Falha ao remover arquivo do Cloudinary ${documento.cloudinary_public_id}: ${cloudinaryResult.error}`)
            }
          }
        } catch (fileError) {
          console.error(`Erro ao remover arquivo do documento ${documento.id}:`, fileError)
        }
      }
    }

    // Remover pasta da API de storage (se existir)
    if (colaborador.storage_folder || colaborador.matricula) {
      console.log('Removendo pasta da API de storage...')
      const folderResult = await deleteColaboradorFolder(colaboradorId, colaborador.matricula)
      
      if (!folderResult.success) {
        console.warn(`Falha ao remover pasta: ${folderResult.error}`)
      }
    }

    // Remover pasta do Cloudinary (se existir - compatibilidade temporária)
    if (colaborador.cloudinary_folder) {
      console.log('Removendo pasta do Cloudinary...')
      try {
        const { deleteColaboradorFolder: deleteCloudinaryFolder } = await import('@/lib/cloudinary')
        const cloudinaryFolderResult = await deleteCloudinaryFolder(colaboradorId, colaborador.matricula)
        
        if (!cloudinaryFolderResult.success) {
          console.warn(`Falha ao remover pasta do Cloudinary: ${cloudinaryFolderResult.error}`)
        }
      } catch (cloudinaryError) {
        console.warn('Erro ao acessar Cloudinary (pode estar desabilitado):', cloudinaryError)
      }
    }

    // Remover colaborador do banco (isso também removerá documentos por CASCADE)
    const { error: deleteError } = await serviceSupabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId)

    if (deleteError) {
      console.error('Erro ao remover colaborador:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover colaborador: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('Colaborador removido com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Colaborador removido com sucesso',
      storageResult: {
        ...storageResult,
        message: `${storageResult.deletedFiles} arquivos removidos do storage`
      }
    })

  } catch (error) {
    console.error('Erro na remoção do colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Buscar colaborador específico
    const { data: colaborador, error } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (error) {
      console.error('Erro ao buscar colaborador:', error)
      return NextResponse.json(
        { success: false, error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      colaborador 
    })

  } catch (error) {
    console.error('Erro ao buscar colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    
    // Verificar permissões
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || !['Admin', 'Editor'].includes(currentUserData.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem editar colaboradores' },
        { status: 403 }
      )
    }

    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nome, matricula, cargo, departamento, status, email, telefone, data_admissao } = body

    if (!nome || !matricula || !cargo || !departamento || !status || !email || !data_admissao) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Buscar colaborador existente
    const { data: existingColaborador } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (!existingColaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se matrícula já existe (exceto para o próprio colaborador)
    const { data: matriculaExists } = await serviceSupabase
      .from('colaboradores')
      .select('id, matricula')
      .eq('matricula', matricula)
      .neq('id', colaboradorId)
      .single()

    if (matriculaExists) {
      return NextResponse.json(
        { error: 'Matrícula já utilizada por outro colaborador' },
        { status: 409 }
      )
    }

    // Atualizar colaborador
    const { data: colaborador, error: updateError } = await serviceSupabase
      .from('colaboradores')
      .update({
        nome,
        matricula,
        cargo,
        departamento,
        status,
        email,
        telefone,
        data_admissao
      })
      .eq('id', colaboradorId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar colaborador:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar colaborador' },
        { status: 500 }
      )
    }

    // Se a matrícula mudou, atualizar também a pasta na API de storage
    if (existingColaborador.matricula !== matricula) {
      console.log('Matrícula alterada, atualizando referências de storage...')
      
      const oldFolderName = `${existingColaborador.matricula}_${colaboradorId}`
      const newFolderName = `${matricula}_${colaboradorId}`
      
      // Deletar pasta antiga (se existir)
      if (existingColaborador.storage_folder) {
        console.log(`Removendo pasta antiga: ${oldFolderName}`)
        await deleteColaboradorFolder(colaboradorId, existingColaborador.matricula)
      }
      
      // Criar nova pasta na API de storage
      const { createColaboradorFolder } = await import('@/lib/storage-api')
      const storageResult = await createColaboradorFolder(colaboradorId, matricula)
      
      if (storageResult.success) {
        // Atualizar storage_folder do colaborador
        await serviceSupabase
          .from('colaboradores')
          .update({ 
            storage_folder: newFolderName 
          })
          .eq('id', colaboradorId)
        
        colaborador.storage_folder = newFolderName
        
        // Atualizar storage_folder de todos os documentos do colaborador
        await serviceSupabase
          .from('documentos')
          .update({
            storage_folder: newFolderName
          })
          .eq('colaborador_id', colaboradorId)
        
        console.log(`Pasta de storage atualizada: ${oldFolderName} -> ${newFolderName}`)
      } else {
        console.warn(`Falha ao criar nova pasta de storage: ${storageResult.error}`)
      }
      
      // Compatibilidade: também atualizar Cloudinary se necessário
      if (existingColaborador.cloudinary_folder) {
        try {
          const { deleteColaboradorFolder: deleteCloudinaryFolder, createColaboradorFolder: createCloudinaryFolder } = await import('@/lib/cloudinary')
          
          // Remover pasta antiga do Cloudinary
          await deleteCloudinaryFolder(colaboradorId, existingColaborador.matricula)
          
          // Criar nova pasta do Cloudinary
          const cloudinaryResult = await createCloudinaryFolder(colaboradorId, matricula)
          
          if (cloudinaryResult.success) {
            await serviceSupabase
              .from('colaboradores')
              .update({ 
                cloudinary_folder: cloudinaryResult.folderName 
              })
              .eq('id', colaboradorId)
            
            colaborador.cloudinary_folder = cloudinaryResult.folderName
          }
        } catch (cloudinaryError) {
          console.warn('Erro ao atualizar Cloudinary (pode estar desabilitado):', cloudinaryError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador atualizado com sucesso',
      colaborador
    })

  } catch (error) {
    console.error('Erro na atualização do colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}