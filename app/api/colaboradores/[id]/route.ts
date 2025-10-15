import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/auth'
import { deleteColaboradorFolder, deleteFile, createColaboradorFolder } from '@/lib/storage-api'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!authUser.usuario || !['Admin', 'Editor'].includes(authUser.usuario.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem remover colaboradores' },
        { status: 403 }
      )
    }

    const serviceSupabase = createServiceClient()
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
          if (documento.storage_folder && documento.storage_filename) {
            // Documento usando API de storage
            console.log(`Removendo arquivo: ${documento.storage_filename} da pasta: ${documento.storage_folder}`)
            const deleteResult = await deleteFile(documento.storage_folder, documento.storage_filename)
            
            if (deleteResult.success) {
              storageResult.deletedFiles++
            } else {
              console.warn(`Falha ao remover arquivo: ${documento.storage_filename}`)
            }
          }
        } catch (fileError) {
          console.warn(`Erro ao remover arquivo individual: ${fileError}`)
        }
      }
    }

    // Remover pasta do colaborador
    const folderResult = await deleteColaboradorFolder(colaboradorId, colaborador.matricula)
    
    if (!folderResult.success) {
      console.warn(`Aviso: ${folderResult.error}`)
    }

    // Remover documentos do banco de dados
    await serviceSupabase
      .from('documentos')
      .delete()
      .eq('colaborador_id', colaboradorId)

    // Remover colaborador do banco de dados
    const { error: deleteError } = await serviceSupabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId)

    if (deleteError) {
      console.error('Erro ao remover colaborador do banco:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover colaborador do banco de dados' },
        { status: 500 }
      )
    }

    console.log(`Colaborador removido com sucesso: ${colaborador.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Colaborador e documentos removidos com sucesso',
      storage: {
        deletedFiles: storageResult.deletedFiles,
        folderRemoved: folderResult.success
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!authUser.usuario || !['Admin', 'Editor'].includes(authUser.usuario.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem editar colaboradores' },
        { status: 403 }
      )
    }

    const serviceSupabase = createServiceClient()
    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nome, email, matricula, setor, cargo, telefone, data_nascimento, endereco } = body

    // Validar dados obrigatórios
    if (!nome || !email || !matricula) {
      return NextResponse.json(
        { error: 'Nome, email e matrícula são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se colaborador existe
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

    // Verificar se a nova matrícula já existe (se foi alterada)
    if (matricula !== existingColaborador.matricula) {
      const { data: existingMatricula } = await serviceSupabase
        .from('colaboradores')
        .select('id')
        .eq('matricula', matricula)
        .neq('id', colaboradorId)
        .single()

      if (existingMatricula) {
        return NextResponse.json(
          { error: 'Matrícula já está em uso por outro colaborador' },
          { status: 400 }
        )
      }
    }

    // Atualizar colaborador
    const { data: colaborador, error } = await serviceSupabase
      .from('colaboradores')
      .update({
        nome,
        email,
        matricula,
        setor,
        cargo,
        telefone,
        data_nascimento,
        endereco
      })
      .eq('id', colaboradorId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar colaborador:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar colaborador' },
        { status: 500 }
      )
    }

    // Se a matrícula mudou, atualizar estrutura de pastas
    if (matricula !== existingColaborador.matricula) {
      const oldFolderName = `${existingColaborador.matricula}_${colaboradorId}`
      const newFolderName = `${matricula}_${colaboradorId}`
      
      console.log(`Atualizando pasta de storage: ${oldFolderName} -> ${newFolderName}`)
      
      // Criar nova pasta
      const storageResult = await createColaboradorFolder(colaboradorId, matricula)
      
      if (storageResult.success) {
        // Atualizar referências de pasta nos documentos
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