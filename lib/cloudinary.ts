import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'

// Configuração do Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
}

cloudinary.config(cloudinaryConfig)

/**
 * Cria uma pasta no Cloudinary para um colaborador
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador  
 * @returns Promise com resultado da operação
 */
export async function createColaboradorFolder(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    // Criar um placeholder na pasta para garantir que ela existe
    const placeholderResult = await cloudinary.uploader.upload(
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
      {
        folder: folderName,
        public_id: '.placeholder',
        resource_type: 'image'
      }
    )

    console.log(`Pasta criada no Cloudinary: ${folderName}`)
    
    return {
      success: true,
      folderName,
      placeholderId: placeholderResult.public_id
    }
  } catch (error) {
    console.error('Erro ao criar pasta no Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Gera assinatura para upload direto do cliente
 * @param timestamp - Timestamp da requisição
 * @param folder - Pasta de destino
 * @returns Assinatura e parâmetros para upload
 */
export async function generateUploadSignature(timestamp: number, folder: string) {
  try {
    const params = {
      timestamp: timestamp,
      folder: folder,
      resource_type: 'raw', // PDFs são sempre raw
      tags: 'documento,pdf'
    }

    const paramsToSign = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key as keyof typeof params]}`)
      .join('&')

    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + cloudinaryConfig.api_secret)
      .digest('hex')

    return {
      success: true,
      uploadParams: {
        ...params,
        signature,
        api_key: cloudinaryConfig.api_key,
        cloud_name: cloudinaryConfig.cloud_name
      }
    }
  } catch (error) {
    console.error('Erro ao gerar assinatura de upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Faz upload de um buffer de PDF para o Cloudinary
 * @param fileBuffer - Buffer do arquivo PDF
 * @param fileName - Nome do arquivo
 * @param folderPath - Caminho da pasta
 * @param mimeType - Tipo MIME do arquivo (sempre application/pdf)
 * @returns Resultado do upload
 */
export async function uploadFileBuffer(
  fileBuffer: Buffer,
  fileName: string,
  folderPath: string,
  mimeType: string
) {
  try {
    console.log(`Upload PDF para Cloudinary - Arquivo: ${fileName}`)
    
    // Converter buffer para base64
    const base64Data = `data:application/pdf;base64,${fileBuffer.toString('base64')}`
    
    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: folderPath,
      public_id: fileName,
      resource_type: 'raw', // SEMPRE raw para PDFs
      tags: ['documento', 'pdf'],
      use_filename: true,
      unique_filename: false
    })

    console.log(`Upload PDF bem-sucedido - Public ID: ${uploadResult.public_id}`)

    return {
      success: true,
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      bytes: uploadResult.bytes
    }
  } catch (error) {
    console.error('Erro no upload PDF para Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Baixa um PDF do Cloudinary como buffer
 * @param publicId - ID público do arquivo PDF
 * @returns Buffer do arquivo PDF
 */
export async function downloadFromCloudinary(publicId: string): Promise<Buffer> {
  try {
    console.log(`Baixando PDF com publicId: ${publicId}`)
    
    // Gerar URL assinada para recursos privados
    const timestamp = Math.round(Date.now() / 1000)
    const auth_params = `public_id=${publicId}&timestamp=${timestamp}`
    const signature = crypto
      .createHash('sha1')
      .update(auth_params + cloudinaryConfig.api_secret)
      .digest('hex')
    
    // Construir URL com autenticação
    const url = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/raw/upload/v1/${publicId}?api_key=${cloudinaryConfig.api_key}&signature=${signature}&timestamp=${timestamp}`
    
    console.log(`URL PDF assinada gerada: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDFViewer/1.0)',
        'Accept': 'application/pdf,application/octet-stream,*/*'
      }
    })
    
    console.log(`Status da resposta PDF: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    console.log(`Content-Length: ${response.headers.get('content-length')}`)
    
    if (!response.ok) {
      // Tentar método alternativo usando o SDK
      console.log('Tentando método alternativo com SDK do Cloudinary...')
      
      // Gerar URL privada usando o SDK
      const sdkUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        secure: true
      })
      
      console.log(`URL SDK gerada: ${sdkUrl}`)
      
      const sdkResponse = await fetch(sdkUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PDFViewer/1.0)',
          'Accept': 'application/pdf,application/octet-stream,*/*'
        }
      })
      
      if (!sdkResponse.ok) {
        throw new Error(`Erro HTTP: ${sdkResponse.status} - ${sdkResponse.statusText}. URL: ${sdkUrl}`)
      }
      
      const arrayBuffer = await sdkResponse.arrayBuffer()
      console.log(`Download PDF bem-sucedido (SDK) - Tamanho: ${arrayBuffer.byteLength} bytes`)
      return Buffer.from(arrayBuffer)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    console.log(`Download PDF bem-sucedido - Tamanho: ${arrayBuffer.byteLength} bytes`)
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Erro ao baixar PDF do Cloudinary:', error)
    throw new Error('Falha no download do documento PDF')
  }
}

/**
 * Remove um PDF do Cloudinary
 * @param publicId - ID público do arquivo PDF
 * @returns Resultado da operação
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw' // PDFs são sempre raw
    })

    return {
      success: result.result === 'ok',
      result: result.result
    }
  } catch (error) {
    console.error('Erro ao deletar PDF do Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Remove uma pasta do Cloudinary
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Promise com resultado da operação
 */
export async function deleteColaboradorFolder(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    // Listar todos os recursos raw na pasta (PDFs)
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
      max_results: 500,
      resource_type: 'raw'
    })

    // Deletar todos os PDFs
    if (resources.resources.length > 0) {
      const publicIds = resources.resources.map((resource: any) => resource.public_id)
      await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'raw'
      })
    }

    // Deletar placeholder de imagem se existir
    try {
      await cloudinary.uploader.destroy(`${folderName}/.placeholder`, {
        resource_type: 'image'
      })
    } catch (placeholderError) {
      console.warn('Placeholder não encontrado ou já removido')
    }

    // Tentar deletar a pasta
    try {
      await cloudinary.api.delete_folder(folderName)
    } catch (folderError) {
      console.warn('Aviso: Pasta pode não ter sido completamente removida:', folderError)
    }

    console.log(`Pasta removida do Cloudinary: ${folderName}`)
    
    return {
      success: true,
      folderName,
      deletedResources: resources.resources.length
    }
  } catch (error) {
    console.error('Erro ao remover pasta do Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Lista PDFs de um colaborador no Cloudinary
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Promise com lista de PDFs
 */
export async function listColaboradorFiles(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
      max_results: 100,
      resource_type: 'raw' // Apenas PDFs
    })

    // Filtrar apenas PDFs (não precisamos filtrar placeholder pois está em 'image')
    const files = resources.resources.map((file: any) => ({
      public_id: file.public_id,
      secure_url: file.secure_url,
      format: file.format,
      bytes: file.bytes,
      created_at: file.created_at,
      resource_type: file.resource_type
    }))

    return {
      success: true,
      files
    }
  } catch (error) {
    console.error('Erro ao listar PDFs do Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      files: []
    }
  }
}

export default cloudinary