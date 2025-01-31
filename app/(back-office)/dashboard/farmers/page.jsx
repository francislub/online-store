import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '@/components/backoffice/TableActions'

export default function Farmers() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Farmers" href="/dashboard/farmers/new" linkTitle="Add Farmer"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
