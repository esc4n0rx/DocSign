// app/shared/[token]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Link Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                O link que você está tentando acessar não existe, expirou ou foi removido.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com quem compartilhou este link para obter um novo.
              </p>
            </div>
            
            <div className="pt-4">
              <Button asChild className="gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Ir para o Site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}