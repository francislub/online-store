import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '../../../../../components/backoffice/TableActions'

export default function Product() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Products" href="/dashboard/products/new" linkTitle="Add Product"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
