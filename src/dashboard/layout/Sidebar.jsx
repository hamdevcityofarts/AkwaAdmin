import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Calendar, 
  Bed, 
  Users, 
  CreditCard, 
  Settings,
  UserCog,
  BarChart3,
  FileText,
  Shield,
  UtensilsCrossed as Utensils, // ✅ Utensils existe comme UtensilsCrossed
  Sparkles, // ✅ Sparkles existe
  Brush, // ✅ Brush existe pour le ménage
  Trash2 // ✅ Alternative pour le ménage
} from 'lucide-react'
import { useAppSelector } from '../../hooks'
import logo from '../../assets/ghLogo.png'

// ✅ Fonction pour obtenir le label du rôle
const getRoleLabel = (roleValue) => {
  const roles = {
    'admin': 'Administrateur',
    'manager': 'Gérant',
    'receptionist': 'Réceptionniste',
    'housekeeper': 'Agent de ménage',
    'supervisor': 'Superviseur',
    'technician': 'Technicien',
    'client': 'Client'
  }
  return roles[roleValue] || 'Utilisateur'
}

const Sidebar = () => {
  const location = useLocation()
  
  // ✅ Récupérer l'utilisateur connecté
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const userPermissions = currentUser?.permissions || []
  const userRole = currentUser?.role || ''

  // ✅ Fonction pour vérifier les permissions
  const checkPermission = (requiredPermission) => {
    if (userRole === 'admin') return true
    return userPermissions.includes(requiredPermission)
  }

  // ✅ Menu complet avec permissions - utilisant des icônes qui existent
  const allMenuItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Tableau de bord',
      requiredPermission: null,
      visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor', 'technician', 'housekeeper']
    },
    {
      path: '/dashboard/reservations',
      icon: Calendar,
      label: 'Réservations',
      requiredPermission: 'gestion_reservations',
      visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor']
    },
    {
      path: '/dashboard/rooms',
      icon: Bed,
      label: 'Chambres',
      requiredPermission: 'gestion_chambres',
      visibleToRoles: ['admin', 'manager', 'supervisor', 'technician']
    },
    {
      path: '/dashboard/clients',
      icon: Users,
      label: 'Clients',
      requiredPermission: 'gestion_clients',
      visibleToRoles: ['admin', 'manager', 'receptionist', 'supervisor']
    },
    {
      path: '/dashboard/payments',
      icon: CreditCard,
      label: 'Paiements',
      requiredPermission: 'acces_finances',
      visibleToRoles: ['admin', 'manager']
    },
    {
      path: '/dashboard/users',
      icon: UserCog,
      label: 'Utilisateurs',
      requiredPermission: 'gestion_utilisateurs',
      visibleToRoles: ['admin']
    },
   /* {
      path: '/dashboard/reports',
      icon: BarChart3,
      label: 'Rapports',
      requiredPermission: 'rapports',
      visibleToRoles: ['admin', 'manager']
    },
    {
      path: '/dashboard/housekeeping',
      icon: Brush, // ✅ Brush existe et est approprié pour le ménage
      label: 'Ménage',
      requiredPermission: 'gestion_menage',
      visibleToRoles: ['admin', 'manager', 'housekeeper', 'supervisor']
    },
    {
      path: '/dashboard/restaurant',
      icon: Utensils, // ✅ UtensilsCrossed renommé en Utensils
      label: 'Restaurant',
      requiredPermission: 'gestion_restaurant',
      visibleToRoles: ['admin', 'manager', 'supervisor']
    },*/
    {
      path: '/dashboard/system',
      icon: Settings,
      label: 'Système',
      requiredPermission: 'parametres_systeme',
      visibleToRoles: ['admin']
    },
    {
      path: '/dashboard/logs',
      icon: FileText,
      label: 'Logs',
      requiredPermission: 'parametres_systeme',
      visibleToRoles: ['admin']
    }
  ]

  // ✅ Filtrer le menu selon le rôle et les permissions
  const filteredMenuItems = allMenuItems.filter(item => {
    // Admin voit tout
    if (userRole === 'admin') return true
    
    // Vérifier si le rôle est autorisé à voir cet item
    if (!item.visibleToRoles.includes(userRole)) return false
    
    // Si une permission spécifique est requise, la vérifier
    if (item.requiredPermission) {
      return checkPermission(item.requiredPermission)
    }
    
    return true
  })

  // ✅ Si aucun menu n'est disponible
  if (filteredMenuItems.length === 0) {
    return (
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-3 py-5">
            <div className="w-23 h-20 rounded-lg flex items-center justify-center">
              <img 
                src={logo}
                alt="Grand Hotel Logo" 
                className="h-18 w-18 object-contain"
              />
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">
            Accès limité
          </h3>
          <p className="text-sm text-gray-500">
            Vous n'avez accès à aucune fonctionnalité.
            Contactez un administrateur.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className=" px-6 border-b border-gray-200">
        <div className="flex items-center justify-center space-x-3 ">
          <div className="w-18 h-18 rounded-lg flex items-center justify-center">
            <img 
              src={logo}
              alt="Grand Hotel Logo" 
              className="h-18 w-18 object-contain"
            />
          </div>
        </div>
        
        {/* ✅ Affichage du rôle actuel */}
        <div className=" text-center">
          <div className="inline-flex items-center px-3  rounded-full bg-blue-50 border border-blue-200">
            <Shield className="w-3 h-3 text-blue-600 mr-1" />
            <span className="text-xs font-medium text-blue-700">
              {getRoleLabel(userRole)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser?.name} {currentUser?.surname}
          </p>
        </div>
      </div>
      
      <nav className="p-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-lg transition-all group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
              
              {/* ✅ Indicateur si permission spéciale */}
              {item.requiredPermission && userRole !== 'admin' && (
                <span className="ml-auto">
                  <Shield className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                </span>
              )}
            </Link>
          )
        })}
        
        {/* ✅ Nombre d'éléments disponibles */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 px-4">
            <div className="flex justify-between">
              <span>Éléments accessibles:</span>
              <span className="font-medium">
                {filteredMenuItems.length} / {allMenuItems.length}
              </span>
            </div>
            {userRole !== 'admin' && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <Shield className="w-3 h-3 inline mr-1" />
                Accès restreint selon votre rôle
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar