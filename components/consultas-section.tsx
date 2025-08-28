"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock data para demonstração
const mockColaboradores = [
  {
    id: 1,
    nome: "João Silva Santos",
    matricula: "12345",
    cargo: "Desenvolvedor Senior",
    departamento: "TI",
    status: "Ativo",
    dataAdmissao: "2022-03-15",
    email: "joao.silva@empresa.com",
    telefone: "(11) 99999-1234",
    documentos: [
      {
        id: 1,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.4 MB",
        dataUpload: "2024-01-15",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 2,
        nome: "Carteira de Trabalho",
        tipo: "PDF",
        tamanho: "1.8 MB",
        dataUpload: "2024-01-15",
        categoria: "Identificação",
        url: "#",
      },
      {
        id: 3,
        nome: "Comprovante de Residência",
        tipo: "PDF",
        tamanho: "956 KB",
        dataUpload: "2024-01-20",
        categoria: "Pessoal",
        url: "#",
      },
      {
        id: 4,
        nome: "Certificado AWS",
        tipo: "PDF",
        tamanho: "1.2 MB",
        dataUpload: "2024-02-10",
        categoria: "Certificação",
        url: "#",
      },
      {
        id: 5,
        nome: "Avaliação de Performance 2023",
        tipo: "PDF",
        tamanho: "890 KB",
        dataUpload: "2024-01-30",
        categoria: "Avaliação",
        url: "#",
      },
    ],
  },
  {
    id: 2,
    nome: "Maria Santos Oliveira",
    matricula: "67890",
    cargo: "Analista de RH",
    departamento: "Recursos Humanos",
    status: "Ativo",
    dataAdmissao: "2021-08-10",
    email: "maria.santos@empresa.com",
    telefone: "(11) 98888-5678",
    documentos: [
      {
        id: 6,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.1 MB",
        dataUpload: "2024-02-01",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 7,
        nome: "Diploma Universitário",
        tipo: "PDF",
        tamanho: "3.2 MB",
        dataUpload: "2024-02-01",
        categoria: "Educação",
        url: "#",
      },
      {
        id: 8,
        nome: "Certificado SHRM",
        tipo: "PDF",
        tamanho: "1.5 MB",
        dataUpload: "2024-02-15",
        categoria: "Certificação",
        url: "#",
      },
    ],
  },
  {
    id: 3,
    nome: "Carlos Eduardo Lima",
    matricula: "11111",
    cargo: "Gerente de Vendas",
    departamento: "Comercial",
    status: "Ativo",
    dataAdmissao: "2020-01-20",
    email: "carlos.lima@empresa.com",
    telefone: "(11) 97777-9012",
    documentos: [
      {
        id: 9,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.3 MB",
        dataUpload: "2024-01-10",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 10,
        nome: "Plano de Metas 2024",
        tipo: "XLSX",
        tamanho: "456 KB",
        dataUpload: "2024-01-05",
        categoria: "Planejamento",
        url: "#",
      },
      {
        id: 11,
        nome: "Relatório de Vendas Q4",
        tipo: "PDF",
        tamanho: "1.8 MB",
        dataUpload: "2024-01-25",
        categoria: "Relatório",
        url: "#",
      },
      {
        id: 12,
        nome: "Certificado de Liderança",
        tipo: "PDF",
        tamanho: "1.1 MB",
        dataUpload: "2024-02-20",
        categoria: "Certificação",
        url: "#",
      },
    ],
  },
  {
    id: 4,
    nome: "Ana Paula Costa",
    matricula: "22222",
    cargo: "Designer UX/UI",
    departamento: "Design",
    status: "Ativo",
    dataAdmissao: "2023-05-12",
    email: "ana.costa@empresa.com",
    telefone: "(11) 96666-3456",
    documentos: [
      {
        id: 13,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.2 MB",
        dataUpload: "2024-01-08",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 14,
        nome: "Portfolio Digital",
        tipo: "PDF",
        tamanho: "15.6 MB",
        dataUpload: "2024-01-12",
        categoria: "Portfolio",
        url: "#",
      },
      {
        id: 15,
        nome: "Certificado Adobe Creative Suite",
        tipo: "PDF",
        tamanho: "980 KB",
        dataUpload: "2024-02-05",
        categoria: "Certificação",
        url: "#",
      },
    ],
  },
  {
    id: 5,
    nome: "Roberto Ferreira",
    matricula: "33333",
    cargo: "Contador",
    departamento: "Financeiro",
    status: "Férias",
    dataAdmissao: "2019-11-03",
    email: "roberto.ferreira@empresa.com",
    telefone: "(11) 95555-7890",
    documentos: [
      {
        id: 16,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.5 MB",
        dataUpload: "2024-01-03",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 17,
        nome: "Registro CRC",
        tipo: "PDF",
        tamanho: "1.3 MB",
        dataUpload: "2024-01-03",
        categoria: "Registro Profissional",
        url: "#",
      },
      {
        id: 18,
        nome: "Declaração de Imposto de Renda",
        tipo: "PDF",
        tamanho: "2.1 MB",
        dataUpload: "2024-03-15",
        categoria: "Fiscal",
        url: "#",
      },
      {
        id: 19,
        nome: "Curso de Atualização Fiscal",
        tipo: "PDF",
        tamanho: "1.7 MB",
        dataUpload: "2024-02-28",
        categoria: "Educação",
        url: "#",
      },
    ],
  },
  {
    id: 6,
    nome: "Fernanda Alves",
    matricula: "44444",
    cargo: "Estagiária de Marketing",
    departamento: "Marketing",
    status: "Ativo",
    dataAdmissao: "2024-02-01",
    email: "fernanda.alves@empresa.com",
    telefone: "(11) 94444-2468",
    documentos: [
      {
        id: 20,
        nome: "Termo de Compromisso de Estágio",
        tipo: "PDF",
        tamanho: "1.8 MB",
        dataUpload: "2024-02-01",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 21,
        nome: "Comprovante de Matrícula",
        tipo: "PDF",
        tamanho: "756 KB",
        dataUpload: "2024-02-01",
        categoria: "Educação",
        url: "#",
      },
      {
        id: 22,
        nome: "Projeto de Marketing Digital",
        tipo: "PPTX",
        tamanho: "8.2 MB",
        dataUpload: "2024-03-10",
        categoria: "Projeto",
        url: "#",
      },
    ],
  },
  {
    id: 7,
    nome: "Pedro Henrique Santos",
    matricula: "55555",
    cargo: "Analista de Suporte",
    departamento: "TI",
    status: "Licença Médica",
    dataAdmissao: "2022-09-18",
    email: "pedro.santos@empresa.com",
    telefone: "(11) 93333-1357",
    documentos: [
      {
        id: 23,
        nome: "Contrato de Trabalho",
        tipo: "PDF",
        tamanho: "2.3 MB",
        dataUpload: "2024-01-12",
        categoria: "Contratual",
        url: "#",
      },
      {
        id: 24,
        nome: "Atestado Médico",
        tipo: "PDF",
        tamanho: "512 KB",
        dataUpload: "2024-03-01",
        categoria: "Médico",
        url: "#",
      },
      {
        id: 25,
        nome: "Certificado ITIL",
        tipo: "PDF",
        tamanho: "1.4 MB",
        dataUpload: "2024-01-20",
        categoria: "Certificação",
        url: "#",
      },
    ],
  },
]

export function ConsultasSection() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColaborador, setSelectedColaborador] = useState<(typeof mockColaboradores)[0] | null>(null)
  const [searchResults, setSearchResults] = useState<typeof mockColaboradores>([])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setSelectedColaborador(null)
      return
    }

    const results = mockColaboradores.filter(
      (colaborador) =>
        colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) || colaborador.matricula.includes(searchTerm),
    )

    setSearchResults(results)
    setSelectedColaborador(null)
  }

  const handleSelectColaborador = (colaborador: (typeof mockColaboradores)[0]) => {
    setSelectedColaborador(colaborador)
  }

  const handleDownload = (documento: any) => {
    // Simulação de download
    console.log(`Baixando documento: ${documento.nome}`)
  }

  const handleView = (documento: any) => {
    // Simulação de visualização
    console.log(`Visualizando documento: ${documento.nome}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground text-balance">Consultas</h1>
        <p className="text-muted-foreground mt-2 text-pretty">Busque documentos por matrícula ou nome do colaborador</p>
      </div>

      {/* Campo de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Buscar Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Digite a matrícula ou nome do colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="px-6">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Busca */}
      {searchResults.length > 0 && !selectedColaborador && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Resultados da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((colaborador) => (
                <div
                  key={colaborador.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectColaborador(colaborador)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {colaborador.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{colaborador.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          Matrícula: {colaborador.matricula} • {colaborador.cargo}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{colaborador.departamento}</Badge>
                    <Badge variant={colaborador.status === "Ativo" ? "default" : "destructive"}>
                      {colaborador.status}
                    </Badge>
                    <svg
                      className="h-5 w-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pasta do Colaborador Selecionado */}
      {selectedColaborador && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Pasta do Colaborador</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {selectedColaborador.nome} - Matrícula: {selectedColaborador.matricula}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setSelectedColaborador(null)} className="gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Voltar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium text-foreground">{selectedColaborador.cargo}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium text-foreground">{selectedColaborador.departamento}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedColaborador.status === "Ativo"
                        ? "default"
                        : selectedColaborador.status === "Férias"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {selectedColaborador.status}
                  </Badge>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Data de Admissão</p>
                  <p className="font-medium text-foreground">{selectedColaborador.dataAdmissao}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedColaborador.email}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground">{selectedColaborador.telefone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Documentos ({selectedColaborador.documentos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedColaborador.documentos.map((documento) => (
                  <div
                    key={documento.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {documento.tipo === "PDF" ? (
                          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ) : documento.tipo === "XLSX" ? (
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                            />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{documento.nome}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{documento.tipo}</span>
                          <span>•</span>
                          <span>{documento.tamanho}</span>
                          <span>•</span>
                          <span>Enviado em {documento.dataUpload}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {documento.categoria}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(documento)} className="gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Visualizar
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleDownload(documento)} className="gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Baixar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estado vazio */}
      {searchTerm && searchResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <svg
              className="h-12 w-12 mx-auto mb-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Não encontramos nenhum colaborador com o termo "{searchTerm}". Tente buscar por matrícula ou nome
              completo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
