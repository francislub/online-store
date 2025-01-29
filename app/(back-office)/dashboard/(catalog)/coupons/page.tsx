import PageHeader from '@/components/backoffice/PageHeader'
import React from 'react'
import TableActions from '../../../../../components/backoffice/TableActions'

export default function Coupons() {
  return (
    <div>
      {/* Header  */}
       <PageHeader heading="Coupons" href="/dashboard/coupons/new" linkTitle="Add Coupon"/>
      {/* Table */}

      {/* Export search bulk  */}
      <TableActions />
      <div className="py-8">
      <h2>Table</h2>
      </div>
    </div>
  )
}
