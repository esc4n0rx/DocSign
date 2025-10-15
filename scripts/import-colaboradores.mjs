#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

/**
 * Configurações necessárias para executar o script.
 * Preencha com as credenciais do seu projeto antes de executar.
 */
const CONFIG = {
  /** URL do projeto Supabase */
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  /** Chave Service Role do Supabase (necessária para ignorar RLS) */
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  /** URL base da API de armazenamento / upload */
  STORAGE_API_URL: process.env.STORAGE_API_URL || '',
  /** Token de autenticação para a API de armazenamento */
  STORAGE_API_TOKEN: process.env.STORAGE_API_TOKEN || '',
  /** Caminho raiz contendo as pastas de colaboradores (padrão: diretório atual) */
  IMPORT_ROOT: process.env.IMPORT_ROOT || '',
  /** Categoria utilizada ao registrar documentos no banco */
  DEFAULT_DOCUMENT_CATEGORY: 'Importação em massa'
}

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.vercel',
  'node_modules',
  'public',
  'scripts',
  'app',
  'components',
  'styles',
  'lib',
  'hooks',
  'contexts'
])

function sanitizeBaseUrl(url) {
  return url.replace(/\/$/, '')
}

function ensureConfig() {
  const missingKeys = Object.entries(CONFIG)
    .filter(([key, value]) => !value && key !== 'IMPORT_ROOT' && key !== 'DEFAULT_DOCUMENT_CATEGORY')
    .map(([key]) => key)

  if (missingKeys.length) {
    throw new Error(`Configuração incompleta. Defina: ${missingKeys.join(', ')}`)
  }
}

function getImportRoot() {
  const explicitRoot = CONFIG.IMPORT_ROOT?.trim()
  if (explicitRoot) {
    return path.resolve(explicitRoot)
  }
  return process.cwd()
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateRandomEmail(nome) {
  const slug = slugify(nome) || 'colaborador'
  const randomSuffix = crypto.randomBytes(3).toString('hex')
  return `${slug}.${randomSuffix}@example.com`
}

function generateRandomPhone() {
  const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10))
  return digits.join('')
}

function generateRandomAdmissionDate() {
  const start = new Date('2015-01-01').getTime()
  const end = Date.now()
  const randomTime = start + Math.random() * (end - start)
  const date = new Date(randomTime)
  const iso = date.toISOString().split('T')[0]
  return iso
}

async function collectCollaboratorFolders(rootPath) {
  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      absolutePath: path.join(rootPath, entry.name)
    }))
}

async function collectFilesRecursively(dirPath) {
  const stack = [dirPath]
  const files = []

  while (stack.length) {
    const current = stack.pop()
    const entries = await fs.readdir(current, { withFileTypes: true })

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolutePath)
        continue
      }

      if (/\.pdf$/i.test(entry.name)) {
        files.push({
          absolutePath,
          relativePath: path.relative(dirPath, absolutePath),
          baseName: entry.name
        })
      }
    }
  }

  return files
}

function createSupabaseClient() {
  return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch }
  })
}

async function fetchLatestMatricula(supabase) {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('matricula')
    .order('matricula', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Não foi possível obter a última matrícula: ${error.message}`)
  }

  if (!data?.matricula) {
    return 0
  }

  const numericPart = parseInt(String(data.matricula).replace(/\D/g, ''), 10)
  return Number.isFinite(numericPart) ? numericPart : 0
}

function formatMatricula(value) {
  return String(value).padStart(5, '0')
}

async function createCollaborator(supabase, matriculaNumber, nome) {
  const matricula = formatMatricula(matriculaNumber)
  const payload = {
    nome,
    matricula,
    cargo: 'Operador',
    departamento: 'Operação',
    status: 'Ativo',
    email: generateRandomEmail(nome),
    telefone: generateRandomPhone(),
    data_admissao: generateRandomAdmissionDate()
  }

  const { data, error } = await supabase
    .from('colaboradores')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar colaborador ${nome}: ${error.message}`)
  }

  return data
}

async function ensureStorageFolder(folderName) {
  const baseUrl = sanitizeBaseUrl(CONFIG.STORAGE_API_URL)
  const response = await fetch(`${baseUrl}/folder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.STORAGE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: folderName })
  })

  const bodyText = await response.text()
  let json
  try {
    json = bodyText ? JSON.parse(bodyText) : null
  } catch (error) {
    throw new Error(`Resposta inválida ao criar pasta (${response.status}): ${bodyText}`)
  }

  if (!response.ok || !json?.success) {
    throw new Error(`Falha ao criar pasta ${folderName}: ${json?.message || json?.error || 'erro desconhecido'}`)
  }

  return json
}

function normalizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function uploadDocument(folderName, file) {
  const baseUrl = sanitizeBaseUrl(CONFIG.STORAGE_API_URL)
  const buffer = await fs.readFile(file.absolutePath)
  const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`
  const normalizedName = normalizeFileName(file.baseName)
  const uploadName = `${uniquePrefix}-${normalizedName}`
  const formData = new FormData()
  const blob = new Blob([buffer])
  formData.append('files', blob, uploadName)

  const response = await fetch(`${baseUrl}/upload/${folderName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.STORAGE_API_TOKEN}`
    },
    body: formData
  })

  const bodyText = await response.text()
  let json
  try {
    json = bodyText ? JSON.parse(bodyText) : null
  } catch (error) {
    throw new Error(`Resposta inválida do upload (${response.status}): ${bodyText}`)
  }

  if (!response.ok || !json?.success) {
    throw new Error(`Falha no upload de ${file.baseName}: ${json?.message || json?.error || 'erro desconhecido'}`)
  }

  const storedFileName = json.files?.[0] || uploadName
  const sanitizedBase = sanitizeBaseUrl(CONFIG.STORAGE_API_URL)
  const fileUrl = `${sanitizedBase}/files/${folderName}/${storedFileName}`

  return {
    storedFileName,
    originalName: file.baseName,
    fileUrl,
    size: buffer.length
  }
}

async function registerDocumentMetadata(supabase, colaboradorId, folderName, uploadResult) {
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      colaborador_id: colaboradorId,
      nome: uploadResult.storedFileName,
      nome_original: uploadResult.originalName,
      tipo: path.extname(uploadResult.originalName).replace('.', '').toLowerCase() || 'pdf',
      tamanho: uploadResult.size,
      categoria: CONFIG.DEFAULT_DOCUMENT_CATEGORY,
      storage_folder: folderName,
      storage_filename: uploadResult.storedFileName,
      url: uploadResult.fileUrl
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao registrar documento ${uploadResult.originalName}: ${error.message}`)
  }

  return data
}

async function processCollaborator(supabase, colaboradorFolder, matriculaCounter) {
  console.log(`\n=== Processando colaborador: ${colaboradorFolder.name} ===`)
  const files = await collectFilesRecursively(colaboradorFolder.absolutePath)

  if (!files.length) {
    console.warn(`Nenhum arquivo PDF encontrado para ${colaboradorFolder.name}, pulando...`)
    return {
      nome: colaboradorFolder.name,
      status: 'skipped',
      motivo: 'Sem arquivos PDF'
    }
  }

  const matriculaNumber = matriculaCounter.nextNumber()
  const matricula = formatMatricula(matriculaNumber)
  console.log(`Criando colaborador com matrícula ${matricula}...`)
  const colaborador = await createCollaborator(supabase, matriculaNumber, colaboradorFolder.name)

  const folderName = `${colaborador.matricula}_${colaborador.id}`
  console.log(`Criando pasta no storage (${folderName})...`)
  await ensureStorageFolder(folderName)

  const documentos = []
  for (const file of files) {
    console.log(`Fazendo upload de ${file.relativePath}...`)
    const uploadResult = await uploadDocument(folderName, file)
    await registerDocumentMetadata(supabase, colaborador.id, folderName, uploadResult)
    documentos.push({
      arquivo: file.relativePath,
      storage: uploadResult.storedFileName
    })
  }

  return {
    nome: colaboradorFolder.name,
    status: 'imported',
    colaboradorId: colaborador.id,
    matricula: colaborador.matricula,
    documentos
  }
}

function createMatriculaCounter(initialValue) {
  let current = initialValue
  return {
    nextNumber() {
      current += 1
      return current
    }
  }
}

async function run() {
  try {
    ensureConfig()
    const supabase = createSupabaseClient()
    const importRoot = getImportRoot()
    console.log(`Diretório base da importação: ${importRoot}`)

    const colaboradores = await collectCollaboratorFolders(importRoot)

    if (!colaboradores.length) {
      console.log('Nenhuma pasta de colaborador encontrada. Nada a fazer.')
      return
    }

    console.log(`Encontradas ${colaboradores.length} pastas de colaboradores.`)

    const latestMatricula = await fetchLatestMatricula(supabase)
    const matriculaCounter = createMatriculaCounter(latestMatricula)

    const resultados = []
    for (const folder of colaboradores) {
      try {
        const resultado = await processCollaborator(supabase, folder, matriculaCounter)
        resultados.push(resultado)
      } catch (error) {
        console.error(`Erro ao processar ${folder.name}:`, error)
        resultados.push({
          nome: folder.name,
          status: 'error',
          motivo: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const sucesso = resultados.filter((r) => r.status === 'imported').length
    const pulados = resultados.filter((r) => r.status === 'skipped').length
    const falhas = resultados.filter((r) => r.status === 'error').length

    console.log('\n=== Resumo da Importação ===')
    console.log(`Sucesso: ${sucesso}`)
    console.log(`Pulados: ${pulados}`)
    console.log(`Falhas: ${falhas}`)

    resultados.forEach((resultado) => {
      console.log(`- ${resultado.nome}: ${resultado.status}`)
      if (resultado.status === 'imported') {
        console.log(`  Matrícula: ${resultado.matricula}`)
        console.log(`  Documentos:`)
        resultado.documentos.forEach((doc) => {
          console.log(`    • ${doc.arquivo} => ${doc.storage}`)
        })
      } else if (resultado.motivo) {
        console.log(`  Motivo: ${resultado.motivo}`)
      }
    })
  } catch (error) {
    console.error('Falha crítica durante a importação:', error)
    process.exitCode = 1
  }
}

run()
