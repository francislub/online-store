import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '@/components/backoffice/TableActions'

export default function Markets() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Markets" href="/dashboard/markets/new" linkTitle="Add Market"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
