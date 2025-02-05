import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '@/components/backoffice/TableActions'

export default function Staff() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Wallet" href="/dashboard/wallet/new" linkTitle="Add Wallet"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
