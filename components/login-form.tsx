"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [matricula, setMatricula] = useState("")
  const [senha, setSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulação de autenticação
    setTimeout(() => {
      if (matricula && senha) {
        // Redirecionar para o dashboard
        router.push("/dashboard")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1 pb-4">
        <h2 className="text-xl font-semibold text-center text-card-foreground">Acesso ao Sistema</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matricula" className="text-card-foreground">
              Matrícula
            </Label>
            <Input
              id="matricula"
              type="text"
              placeholder="Digite sua matrícula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-card-foreground">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
