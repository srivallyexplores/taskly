import { useLocation } from 'react-router-dom'
import Header from '../common/Header'
import Footer from '../common/Footer'

const Layout = ({ children }) => {
  const location = useLocation()
  
  // Define routes that should hide navbar or footer
  const hideNavbarRoutes = []
  const hideFooterRoutes = []
  
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname)
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname)

  return (
    <div className="page-container">
      <header>
        {!shouldHideNavbar && <Header />}
      </header>
      
      {children}
      
      {!shouldHideFooter && <Footer />}
    </div>
  )
}

export default Layout