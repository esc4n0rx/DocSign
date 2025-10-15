import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { inflateRawSync } from 'zlib'
import { createServiceClient, getAuthUser } from '@/lib/auth'
import { createColaboradorFolder, uploadFileBuffer } from '@/lib/storage-api'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

type ZipEntry = {
  path: string
  data: Buffer
  isDirectory: boolean
}

type CollaboratorFiles = {
  fileName: string
  buffer: Buffer
}

interface ImportSummary {
  colaboradoresCriados: number
  documentosImportados: number
  erros: string[]
}

const ALLOWED_EXTENSION = '.zip'

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset
    }
  }
  throw new Error('Arquivo ZIP inválido: diretório central não encontrado.')
}

function extractZipEntries(buffer: Buffer): ZipEntry[] {
  const endOfCentralDirectory = findEndOfCentralDirectory(buffer)
  const totalEntries = buffer.readUInt16LE(endOfCentralDirectory + 10)
  const centralDirectoryOffset = buffer.readUInt32LE(endOfCentralDirectory + 16)

  const entries: ZipEntry[] = []
  let offset = centralDirectoryOffset

  for (let i = 0; i < totalEntries; i++) {
    const signature = buffer.readUInt32LE(offset)
    if (signature !== 0x02014b50) {
      throw new Error('Arquivo ZIP inválido: assinatura do diretório central incorreta.')
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraFieldLength = buffer.readUInt16LE(offset + 30)
    const fileCommentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)

    const nameStart = offset + 46
    const filePath = buffer.slice(nameStart, nameStart + fileNameLength).toString('utf8')
    const isDirectory = filePath.endsWith('/')

    if (!isDirectory) {
      const localHeaderSignature = buffer.readUInt32LE(localHeaderOffset)
      if (localHeaderSignature !== 0x04034b50) {
        throw new Error('Arquivo ZIP inválido: assinatura do arquivo local incorreta.')
      }

      const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength
      const dataEnd = dataStart + compressedSize
      const compressedData = buffer.slice(dataStart, dataEnd)

      let data: Buffer
      if (compressionMethod === 0) {
        data = Buffer.from(compressedData)
      } else if (compressionMethod === 8) {
        data = inflateRawSync(compressedData)
      } else {
        throw new Error(`Método de compressão não suportado: ${compressionMethod}`)
      }

      if (uncompressedSize !== 0 && data.length !== uncompressedSize) {
        console.warn(`Tamanho do arquivo '${filePath}' diferente do esperado.`)
      }

      entries.push({ path: filePath, data, isDirectory: false })
    } else {
      entries.push({ path: filePath, data: Buffer.alloc(0), isDirectory: true })
    }

    offset = nameStart + fileNameLength + extraFieldLength + fileCommentLength
  }

  return entries
}

function sanitizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '')
    .replace(/\.\.+/g, '.')
}

function generateRandomEmail(name: string) {
  const slug = sanitizeSlug(name) || 'colaborador'
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${slug}.${suffix}@example.com`
}

function generateRandomPhone() {
  const ddds = ['11', '21', '31', '41', '51', '61']
  const ddd = ddds[Math.floor(Math.random() * ddds.length)]
  const subscriber = Math.floor(10000000 + Math.random() * 90000000).toString()
  return `(${ddd}) 9${subscriber.slice(0, 4)}-${subscriber.slice(4)}`
}

function generateRandomAdmissionDate() {
  const now = Date.now()
  const fiveYearsAgo = now - 1000 * 60 * 60 * 24 * 365 * 5
  const randomTime = Math.floor(fiveYearsAgo + Math.random() * (now - fiveYearsAgo))
  return new Date(randomTime).toISOString()
}

function extractNumeric(value?: string | null) {
  if (!value) return 0
  const numeric = parseInt(value.replace(/\D/g, ''), 10)
  return Number.isNaN(numeric) ? 0 : numeric
}

function buildCollaboratorMap(entries: ZipEntry[], errors: string[]) {
  const filesByCollaborator = new Map<string, CollaboratorFiles[]>()

  const validEntries = entries.filter((entry) => {
    if (entry.isDirectory) return false
    if (!entry.path) return false
    if (entry.path.startsWith('__MACOSX/')) return false
    return true
  })

  const segmentsList = validEntries.map((entry) => entry.path.split('/').filter(Boolean))
  const uniqueFirstSegments = new Set(segmentsList.map((parts) => parts[0]))

  let rootFolder: string | null = null
  if (uniqueFirstSegments.size === 1 && segmentsList.some((parts) => parts.length > 1)) {
    rootFolder = segmentsList[0][0]
  }

  for (const entry of validEntries) {
    const parts = entry.path.split('/').filter(Boolean)
    if (parts.length === 0) continue

    let collaboratorName: string | undefined

    if (rootFolder && parts[0] === rootFolder) {
      if (parts.length < 2) {
        continue
      }
      collaboratorName = parts[1]
    } else {
      collaboratorName = parts[0]
    }

    if (!collaboratorName || collaboratorName === '__MACOSX') {
      continue
    }

    const fileName = path.posix.basename(entry.path)

    if (!fileName.toLowerCase().endsWith('.pdf')) {
      errors.push(`Arquivo ignorado (${fileName}) - apenas PDFs são suportados.`)
      continue
    }

    if (!filesByCollaborator.has(collaboratorName)) {
      filesByCollaborator.set(collaboratorName, [])
    }

    filesByCollaborator.get(collaboratorName)!.push({
      fileName,
      buffer: entry.data,
    })
  }

  return filesByCollaborator
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!authUser.usuario || authUser.usuario.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Somente usuários com permissão de Admin podem importar dados.' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo de importação não informado.' }, { status: 400 })
    }

    const extension = path.extname(file.name || '').toLowerCase()

    if (extension !== ALLOWED_EXTENSION) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Utilize um arquivo .zip.' },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const zipEntries = extractZipEntries(fileBuffer)

    const errors: string[] = []
    const collaboratorFiles = buildCollaboratorMap(zipEntries, errors)

    if (collaboratorFiles.size === 0) {
      return NextResponse.json(
        { error: 'Nenhum colaborador válido encontrado no arquivo informado.' },
        { status: 400 },
      )
    }

    const serviceSupabase = createServiceClient()

    const { data: existingMatricula } = await serviceSupabase
      .from('colaboradores')
      .select('matricula')
      .order('matricula', { ascending: false })
      .limit(1)

    let nextMatriculaNumber = 1

    if (existingMatricula && existingMatricula.length > 0) {
      nextMatriculaNumber = extractNumeric(existingMatricula[0].matricula) + 1
    }

    let colaboradoresCriados = 0
    let documentosImportados = 0

    for (const [collaboratorName, files] of collaboratorFiles.entries()) {
      if (!files || files.length === 0) {
        errors.push(`Nenhum documento encontrado para o colaborador "${collaboratorName}".`)
        continue
      }

      const matricula = nextMatriculaNumber.toString().padStart(5, '0')
      nextMatriculaNumber += 1

      const email = generateRandomEmail(collaboratorName)
      const telefone = generateRandomPhone()
      const dataAdmissao = generateRandomAdmissionDate()

      const { data: colaborador, error: createError } = await serviceSupabase
        .from('colaboradores')
        .insert({
          nome: collaboratorName,
          matricula,
          cargo: 'Operador',
          departamento: 'Operação',
          status: 'Ativo',
          email,
          telefone,
          data_admissao: dataAdmissao,
        })
        .select()
        .single()

      if (createError || !colaborador) {
        errors.push(`Falha ao criar o colaborador "${collaboratorName}".`)
        continue
      }

      colaboradoresCriados += 1

      const folderResult = await createColaboradorFolder(colaborador.id, matricula)
      const folderName = `${matricula}_${colaborador.id}`

      if (!folderResult.success) {
        errors.push(`Colaborador "${collaboratorName}" criado, mas não foi possível gerar a pasta de documentos.`)
      } else if (folderResult.folderName) {
        await serviceSupabase
          .from('colaboradores')
          .update({ storage_folder: folderResult.folderName })
          .eq('id', colaborador.id)
      }

      for (const fileData of files) {
        try {
          const uploadResult = await uploadFileBuffer(fileData.buffer, fileData.fileName, folderName, 'application/pdf')

          if (!uploadResult.success || !uploadResult.fileName) {
            errors.push(
              `Falha ao enviar o arquivo "${fileData.fileName}" do colaborador "${collaboratorName}".`,
            )
            continue
          }

          const sanitizedBaseUrl = (process.env.STORAGE_API_URL || 'https://api.poupadin.space').replace(/\/$/, '')
          const fileUrl = uploadResult.fileUrl || `${sanitizedBaseUrl}/files/${folderName}/${uploadResult.fileName}`

          const { error: documentError } = await serviceSupabase
            .from('documentos')
            .insert({
              colaborador_id: colaborador.id,
              nome: uploadResult.fileName,
              nome_original: fileData.fileName,
              tipo: 'pdf',
              tamanho: fileData.buffer.length,
              categoria: 'Importado',
              storage_folder: folderName,
              storage_filename: uploadResult.fileName,
              url: fileUrl,
            })

          if (documentError) {
            errors.push(
              `Arquivo "${fileData.fileName}" enviado, mas não foi possível salvar no banco de dados para o colaborador "${collaboratorName}".`,
            )
            continue
          }

          documentosImportados += 1
        } catch (error) {
          console.error('Erro ao processar arquivo importado:', error)
          errors.push(
            `Erro inesperado ao importar o arquivo "${fileData.fileName}" do colaborador "${collaboratorName}".`,
          )
        }
      }
    }

    const summary: ImportSummary = {
      colaboradoresCriados,
      documentosImportados,
      erros: errors,
    }

    if (colaboradoresCriados === 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors[0] || 'Não foi possível importar os colaboradores informados.',
          summary,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('Erro na importação em massa de colaboradores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar a importação.' },
      { status: 500 },
    )
  }
}
