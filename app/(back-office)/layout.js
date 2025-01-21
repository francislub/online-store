import React from 'react'
import Sidebar from '../../components/backoffice/Sidebar'
import Navbar from '../../components/backoffice/Navbar'

export default function Layout({children}) {
  return (
    <div className='flex'>

        <Sidebar/>

        <div className='w-full'>
         <Navbar/>

           <main className='ml-60 p-8 bg-slate-50 dark:bg-slate-900 text-slate-50 min-h-screen mt-16'>{children}</main>
        </div>
    </div>
  )
}
