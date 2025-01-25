"use client"

import React, {useState} from 'react'
import Sidebar from '../../components/backoffice/Sidebar'
import Navbar from '../../components/backoffice/Navbar'

export default function Layout({children}) {
  const [showSidebar, setShowSidebar] = useState(false);
  return (
    <div className='flex'>

        <Sidebar showSidebar={showSidebar}/>

        <div className=''>
         <Navbar showSidebar={showSidebar} setShowSidebar={setShowSidebar}/>

           <main className='ml-60 p-8 bg-slate-50 dark:bg-slate-900 text-slate-50 min-h-screen mt-16'>{children}</main>
        </div>
    </div>
  )
  // <div className='lg:ml-64 ml-0 flex-grow bg-slate-100 min-h-screen'>
}
