import { Layers, ShoppingCart } from 'lucide-react'
import React from 'react'

export default function SmallCard() {
  return (
    <div className="rounded-lg shadow-lg bg-slate-700 p-4">
       <div className='flex space-x-4'>
        <div className="w-12 h-12 bg-orange-600 rounded-full items-center flex justify-center">
        <ShoppingCart className='' />
        </div>
        <div className="">
            <p>Total Order</p>
            <h3 className='text-2xl font-bold'>552</h3>
        </div>
       </div>
    </div>
  )
}
