"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [matricula, setMatricula] = useState("")
  const [senha, setSenha] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!matricula || !senha) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const success = await login({ matricula, senha })

      if (success) {
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: "Matrícula ou senha incorretos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
              disabled={isLoading}
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
              disabled={isLoading}
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