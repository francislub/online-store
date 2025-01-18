import React from 'react'

export default function Layout({children}) {
  return (
    <div className='flex'>

        <div className='w-1/6 bg-gray-200'>
          Side Bar
        </div>

        <div className=''>
           <h2>Nav Bra</h2>

           <main>{children}</main>
        </div>
      
    </div>
  )
}
