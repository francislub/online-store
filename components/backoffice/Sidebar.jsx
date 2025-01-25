"use client"

import React, { useState } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../public/images/logo.jpeg';
import { Boxes, ChevronDown, ChevronRight, ExternalLink, LayoutGrid, LayoutList, LogOut, MonitorPlay, ScanSearch, SendToBack, Slack, Truck, User, User2, UserSquare2, Warehouse } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// import { DropdownMenu } from '@radix-ui/react-dropdown-menu';


export default function Sidebar({showSidebar, setShowSidebar}) {
  const pathname = usePathname()
  const sidebarLinks =[
    {
      title:'Customers',
      icon:User2,
      href:"/dashboard/customers",
    },
    {
      title:'Markets',
      icon:Warehouse,
      href:"/dashboard/markets",
    },
    {
      title:'Farmers',
      icon:UserSquare2,
      href:"/dashboard/farmers",
    },
    {
      title:'Orders',
      icon:Truck,
      href:"/dashboard/orders",
    },
    {
      title:'Our Staff',
      icon:User,
      href:"/dashboard/staff",
    },
    {
      title:'Settings',
      icon:LayoutGrid,
      href:"/dashboard/settings",
    },
    {
      title:'Online Store',
      icon:ExternalLink,
      href:"/",
    },
  ]
  const catalogueLinks =[
    {
      title:'Products',
      icon:Boxes,
      href:"/dashboard/products",
    },
    {
      title:'Categories',
      icon:LayoutList,
      href:"/dashboard/categories",
    },
    {
      title:'Attributes',
      icon:SendToBack,
      href:"/dashboard/attributes",
    },
    {
      title:'Coupons',
      icon:ScanSearch,
      href:"/dashboard/coupons",
    },
    {
      title:'Store Sliders',
      icon:MonitorPlay,
      href:"/dashboard/slides",
    },
    
  ];
  const [openMenu, setOpenMenu] = useState(false)
  return (
    <div className={showSidebar?' sm:block sm:mt-0 mt-20 bg-slate-50 shadow-md dark:bg-slate-700 space-y-6 w-60 h-screen dark:text-slate-50 text-slate-800  fixed left-0 top-0 overflow-y-scroll':'sm:mt-0 mt-20 hidden sm:block bg-slate-50 shadow-md dark:bg-slate-700 space-y-6 w-60 h-screen dark:text-slate-50 text-slate-800  fixed left-0 top-0 overflow-y-scroll'}>
      <Link onClick={()=>setShowSidebar(false)} className=' items-center justify-center px-6 py-4' href='/dashboard'>
       <Image src={logo} alt="ClyCite" className='w-12 h-12 rounded-full'/>
      </Link>
        <div className='space-y-3 flex flex-col '>
        <Link
        onClick={()=>setShowSidebar(false)}
        href='/dashboard' 
        className={pathname==='/dashboard'?'flex items-center space-x-3 px-6 py-2 border-l-8 border-lime-600 text-lime-600':'flex items-center space-x-3 px-6 py-2'}>
        <LayoutGrid/>
        <span>Dashboard</span>
        </Link>
        <Collapsible className='px-6 py-2'>
          <CollapsibleTrigger className='' onClick ={()=> setOpenMenu(!openMenu)}>
              <button className='flex items-center space-x-6 py-2'>
              <div className="flex items-center space-x-3">
                <Slack/>
                <span>Catalogue</span>
              </div>
                {openMenu? <ChevronDown />: <ChevronRight />}
               </button>
          </CollapsibleTrigger>

          <CollapsibleContent className='rounded-lg px-3 pl-6 bg-slate-800 py-3'>
            
              {
                catalogueLinks.map((item, i)=> {
                  const Icon = item.icon
                  return (
                    <Link 
                    onClick={()=>setShowSidebar(false)}
                      key={i}
                    href={item.href} 
                    className={
                      pathname=== item.href ?'flex items-center space-x-3 py-1 text-sm text-lime-600':'flex items-center space-x-3 py-1'}>

                      <Icon className='w-4 h-4'/>
                      <span>{item.title}</span>
                    </Link>

                  )
                })
              }

          </CollapsibleContent>
        </Collapsible>
        {
          sidebarLinks.map((item,i)=>{
            const Icon = item.icon
            return (
              <Link
              onClick={()=>setShowSidebar(false)}
               key={i}
              href={item.href} className={item.href==pathname?'flex items-center space-x-3 px-6 py-2 border-l-8 border-green-600 text-lime-600':'flex items-center space-x-3 px-6 py-2'}>
                <Icon/>
                <span>{item.title}</span>
              </Link>
            )
          })
        }
       <div className="px-6 py-2">
       <button
         className='flex items-center space-x-3 px-6 py-3 bg-lime-600 rounded-full'>
          <LogOut/>
          <span>Log Out</span>
        </button>
       </div>
        </div>
    </div>
  )
}
