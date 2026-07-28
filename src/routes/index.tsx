import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home'
import { Agenda } from '@/pages/Agenda'
import { Clientes } from '@/pages/Clientes'
import { Mensagens } from '@/pages/Mensagens'
import { Caixa } from '@/pages/Caixa'
import { Ajustes } from '@/pages/Ajustes'
import { ServicosPage } from '@/pages/ajustes/ServicosPage'
import { ProdutosPage } from '@/pages/ajustes/ProdutosPage'
import { EquipePage } from '@/pages/ajustes/EquipePage'
import { NegocioPage } from '@/pages/ajustes/NegocioPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/caixa" element={<Caixa />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/ajustes/servicos" element={<ServicosPage />} />
          <Route path="/ajustes/produtos" element={<ProdutosPage />} />
          <Route path="/ajustes/equipe" element={<EquipePage />} />
          <Route path="/ajustes/negocio" element={<NegocioPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
