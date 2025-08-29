import { v2 as cloudinary, ConfigOptions } from 'cloudinary'

// Configuração do Cloudinary
const cloudinaryConfig: ConfigOptions = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}

cloudinary.config(cloudinaryConfig)

/**
 * Cria uma pasta no Cloudinary para um colaborador
 * @param colaboradorId - ID único do colaborador
 * @param matricula - Matrícula do colaborador para nome da pasta
 * @returns Promise com resultado da operação
 */
export async function createColaboradorFolder(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    // Criar uma imagem placeholder para garantir que a pasta seja criada
    // O Cloudinary só cria pastas quando há arquivos dentro
    const placeholderResult = await cloudinary.uploader.upload(
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8L3N2Zz4K',
      {
        folder: folderName,
        public_id: '.placeholder',
        resource_type: 'image',
        tags: ['colaborador', 'placeholder']
      }
    )

    console.log(`Pasta criada no Cloudinary: ${folderName}`)
    
    return {
      success: true,
      folderName,
      placeholderUrl: placeholderResult.secure_url
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
 * Gera URL de upload assinada para um colaborador
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns URL e parâmetros para upload
 */
export function generateUploadSignature(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    const params = {
      timestamp,
      folder: folderName,
      resource_type: 'raw', // Apenas PDFs como raw
      allowed_formats: 'pdf'
    }

    const signature = cloudinary.utils.api_sign_request(params, cloudinaryConfig.api_secret!)

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
    
    // Gerar URL direta para PDF como recurso raw
    const url = cloudinary.url(publicId, { 
      resource_type: 'raw',
      secure: true,
      type: 'upload'
    })
    
    console.log(`URL PDF gerada: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDFViewer/1.0)',
        'Accept': 'application/pdf'
      }
    })
    
    console.log(`Status da resposta PDF: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    console.log(`Content-Length: ${response.headers.get('content-length')}`)
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}. URL: ${url}`)
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