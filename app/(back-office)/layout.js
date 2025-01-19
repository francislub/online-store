import React from 'react'
import Sidebar from '../../components/backoffice/Sidebar'

export default function Layout({children}) {
  return (
    <div className='flex'>

        <Sidebar/>

        <div className='w-full'>
           <h2>Nav Bra</h2>

           <main>{children}</main>
        </div>
      
    </div>
  )
}
