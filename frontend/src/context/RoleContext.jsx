import React, { createContext, useContext, useState } from 'react'

const RoleContext = createContext()

export function RoleProvider({ children }) {
  const [role, setRole] = useState('officer') // admin, officer, field_worker

  const can = (permission) => {
    const permissions = {
      admin: ['manage_users', 'upload_data', 'manage_network', 'run_analysis', 'configure_risk', 'view_all'],
      officer: ['view_map', 'view_incidents', 'view_hotspots', 'view_risk', 'assign_tasks', 'view_all'],
      field_worker: ['view_tasks', 'record_incident', 'upload_photos', 'mark_cleaned'],
    }
    return (permissions[role] || []).includes(permission) || (permissions[role] || []).includes('view_all')
  }

  return (
    <RoleContext.Provider value={{ role, setRole, can }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
