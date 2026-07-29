import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Home } from '@/pages/Home'
import { Agenda } from '@/pages/Agenda'
import { Comanda } from '@/pages/Comanda'
import { Clientes } from '@/pages/Clientes'
import { Mensagens } from '@/pages/Mensagens'
import { Caixa } from '@/pages/Caixa'
import { Ajustes } from '@/pages/Ajustes'
import { ServicosPage } from '@/pages/ajustes/ServicosPage'
import { ProdutosPage } from '@/pages/ajustes/ProdutosPage'
import { EquipePage } from '@/pages/ajustes/EquipePage'
import { NegocioPage } from '@/pages/ajustes/NegocioPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { AdminTenantPage } from '@/pages/admin/AdminTenantPage'
import { AdminLogsPage } from '@/pages/admin/AdminLogsPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminRoute } from './AdminRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/comanda" element={<Comanda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/ajustes/servicos" element={<ServicosPage />} />
          <Route path="/ajustes/produtos" element={<ProdutosPage />} />
          <Route path="/ajustes/equipe" element={<EquipePage />} />
          <Route path="/ajustes/negocio" element={<NegocioPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/tenants/:id" element={<AdminTenantPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-marca mb-2">404</h1>
        <p className="text-suave">Página não encontrada</p>
      </div>
    </div>
  )
}
