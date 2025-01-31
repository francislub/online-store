import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '@/components/backoffice/TableActions'

export default function Staff() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Staff" href="/dashboard/staff/new" linkTitle="Add Staff"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
