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
 * Remove uma pasta do Cloudinary
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Promise com resultado da operação
 */
export async function deleteColaboradorFolder(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    // Listar todos os recursos na pasta
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
      max_results: 500
    })

    // Deletar todos os recursos
    if (resources.resources.length > 0) {
      const publicIds = resources.resources.map((resource: any) => resource.public_id)
      await cloudinary.api.delete_resources(publicIds)
    }

    // Tentar deletar a pasta (pode não funcionar se não estiver completamente vazia)
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
 * Lista arquivos de um colaborador no Cloudinary
 * @param colaboradorId - ID do colaborador
 * @param matricula - Matrícula do colaborador
 * @returns Promise com lista de arquivos
 */
export async function listColaboradorFiles(colaboradorId: number, matricula: string) {
  try {
    const folderName = `colaboradores/${matricula}_${colaboradorId}`
    
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
      max_results: 100,
      resource_type: 'auto'
    })

    // Filtrar o placeholder
    const files = resources.resources.filter((resource: any) => 
      !resource.public_id.endsWith('.placeholder')
    )

    return {
      success: true,
      files: files.map((file: any) => ({
        public_id: file.public_id,
        secure_url: file.secure_url,
        format: file.format,
        bytes: file.bytes,
        created_at: file.created_at,
        resource_type: file.resource_type
      }))
    }
  } catch (error) {
    console.error('Erro ao listar arquivos do Cloudinary:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      files: []
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
      resource_type: 'auto',
      allowed_formats: 'pdf,jpg,jpeg,png,doc,docx'
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

export default cloudinary