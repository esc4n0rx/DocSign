"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar fixa à esquerda */}
      <Sidebar />

      {/* Área principal de conteúdo */}
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
