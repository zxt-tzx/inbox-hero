import { NavBar } from './NavBar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <NavBar />
      {children}
    </>
  )
}
