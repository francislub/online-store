import Heading from '@/components/backoffice/Heading'
import LargeCards from '@/components/backoffice/LargeCards'
import SmallCards from '@/components/backoffice/SmallCards'
import React from 'react'

export default function page() {
  return (
    <div>
      <Heading title='Dashboard Overview'/>

      {/* large cards */}
      <LargeCards />

      {/* smaill cards */}
      <SmallCards />

      {/* charts */}

      {/* Recent Orders table orders */}


    </div>
  )
}
