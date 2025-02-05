import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '@/components/backoffice/TableActions'

export default function Community() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Clycite Community Trainings " href="/dashboard/community/new" linkTitle="Add Training"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
