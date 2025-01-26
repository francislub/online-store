import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '../../../../../components/backoffice/TableActions'

export default function page() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Categories" href="/dashboard/categories/new" linkTitle="Add Category"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
