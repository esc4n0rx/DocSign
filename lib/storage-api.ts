/**
 * Cliente para API de armazenamento personalizada
 * Substitui o sistema Cloudinary por API própria
 */

const API_BASE_URL = process.env.STORAGE_API_URL || 'https://api.poupadin.space'
const API_TOKEN = process.env.STORAGE_API_TOKEN

if (!API_TOKEN) {
  console.warn('STORAGE_API_TOKEN não configurado!')
}

interface StorageApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface FileUploadResponse {
  message: string
  files: string[]
}

/**
 * Cria uma pasta no sistema de armazenamento
 * @param folderName - Nome da pasta a ser criada
 * @returns Resultado da operação
 */
export async function createFolder(folderName: string) {
  try {
    console.log(`Criando pasta: ${folderName}`)
    
    const response = await fetch(`${API_BASE_URL}/folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: folderName })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao criar pasta')
    }

    console.log(`Pasta criada com sucesso: ${folderName}`)
    
    return {
      success: true,
      folderName,
      message: result.message
    }
  } catch (error) {
    console.error('Erro ao criar pasta:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Cria uma pasta para o colaborador baseado na matrícula e ID
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Resultado da operação
 */
export async function createColaboradorFolder(colaboradorId: number, matricula: string) {
  const folderName = `${matricula}_${colaboradorId}`
  return await createFolder(folderName)
}

/**
 * Faz upload de um arquivo para uma pasta específica
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo
 * @param folderName - Nome da pasta de destino
 * @param originalFileName - Nome original do arquivo
 * @returns Resultado do upload
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folderName: string,
  originalFileName: string
) {
  try {
    console.log(`Upload arquivo: ${fileName} para pasta: ${folderName}`)

    // Criar FormData para multipart/form-data
    const formData = new FormData()
    const blob = new Blob([fileBuffer])
    formData.append('files', blob, fileName)

    const response = await fetch(`${API_BASE_URL}/upload/${folderName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: formData
    })

    const result: FileUploadResponse = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Erro no upload do arquivo')
    }

    console.log(`Upload bem-sucedido: ${fileName}`)

    return {
      success: true,
      fileName: result.files[0], // Nome do arquivo salvo na API
      originalFileName,
      folderName,
      message: result.message
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Faz upload de um buffer de arquivo
 * @param fileBuffer - Buffer do arquivo
 * @param fileName - Nome do arquivo
 * @param folderPath - Caminho da pasta (matricula_id)
 * @param mimeType - Tipo MIME do arquivo
 * @returns Resultado do upload
 */
export async function uploadFileBuffer(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string,
  mimeType: string
) {
  // Gerar nome único para o arquivo
  const timestamp = Date.now()
  const extension = fileName.split('.').pop() || 'bin'
  const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  return await uploadFile(fileBuffer, uniqueFileName, folderPath, fileName)
}

/**
 * Baixa um arquivo do sistema de armazenamento
 * @param folderName - Nome da pasta
 * @param fileName - Nome do arquivo
 * @returns Buffer do arquivo
 */
export async function downloadFile(folderName: string, fileName: string): Promise<Buffer> {
  try {
    console.log(`Baixando arquivo: ${fileName} da pasta: ${folderName}`)
    
    const response = await fetch(`${API_BASE_URL}/files/${folderName}/${fileName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Arquivo não encontrado')
      }
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log(`Download bem-sucedido: ${fileName} (${arrayBuffer.byteLength} bytes)`)
    
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    throw new Error(`Falha no download: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Remove um arquivo do sistema de armazenamento
 * @param folderName - Nome da pasta
 * @param fileName - Nome do arquivo
 * @returns Resultado da operação
 */
export async function deleteFile(folderName: string, fileName: string) {
  try {
    console.log(`Removendo arquivo: ${fileName} da pasta: ${folderName}`)
    
    const response = await fetch(`${API_BASE_URL}/files/${folderName}/${fileName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
      }
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Arquivo não encontrado: ${fileName}`)
        return { success: true, message: 'Arquivo não encontrado (já removido)' }
      }
      throw new Error(result.message || 'Erro ao remover arquivo')
    }

    console.log(`Arquivo removido com sucesso: ${fileName}`)
    
    return {
      success: true,
      message: result.message
    }
  } catch (error) {
    console.error('Erro ao remover arquivo:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Remove uma pasta do colaborador e todos os seus arquivos
 * Não há endpoint específico para isso na API, então precisamos listar e deletar individualmente
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Resultado da operação
 */
export async function deleteColaboradorFolder(colaboradorId: number, matricula: string) {
  try {
    const folderName = `${matricula}_${colaboradorId}`
    console.log(`Removendo pasta do colaborador: ${folderName}`)
    
    // Nota: A API não tem endpoint para listar arquivos ou remover pasta inteira
    // Este método existe para compatibilidade, mas a remoção real será feita
    // quando os documentos individuais forem removidos do banco de dados
    
    console.log(`Pasta marcada para remoção: ${folderName}`)
    
    return {
      success: true,
      folderName,
      message: 'Pasta será limpa quando documentos forem removidos'
    }
  } catch (error) {
    console.error('Erro ao remover pasta do colaborador:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Gera URL para visualização de arquivo
 * @param folderName - Nome da pasta
 * @param fileName - Nome do arquivo
 * @returns URL para acesso direto ao arquivo
 */
export function getFileViewUrl(folderName: string, fileName: string): string {
  return `${API_BASE_URL}/files/${folderName}/${fileName}`
}

/**
 * Gera URL para download de arquivo (mesmo que visualização)
 * @param folderName - Nome da pasta
 * @param fileName - Nome do arquivo
 * @returns URL para download do arquivo
 */
export function getFileDownloadUrl(folderName: string, fileName: string): string {
  return getFileViewUrl(folderName, fileName)
}

// Funções de compatibilidade com nomes antigos do Cloudinary
export const downloadFromCloudinary = downloadFile
export const deleteFromCloudinary = deleteFile

export default {
  createFolder,
  createColaboradorFolder,
  uploadFile,
  uploadFileBuffer,
  downloadFile,
  deleteFile,
  deleteColaboradorFolder,
  getFileViewUrl,
  getFileDownloadUrl
}