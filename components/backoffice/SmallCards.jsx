import React from 'react'
import SmallCard from './SmallCard'

export default function SmallCards() {
    const orderStats =[
        {
        period: "Today Orders",
        sales: 110000,
        color: "bg-green-600",
        // icon: "Layers",
       },
        {
        period: "Yesterday Orders",
        sales: 21000,
        color: "bg-blue-600",
        // icon: "Layers",
       },
        {
        period: "This Month",
        sales: 300000,
        color: "bg-orange-600",
        // icon: "Layers",
       },
        {
        period: "All-Time Sales",
        sales: 110000,
        color: "bg-purple-600",
        // icon: "Layers",
       },
];
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8'>
        {
            orderStats.map((item, i)=> {
                return <SmallCard />

                
            })
        }
    </div>
  )
}

