import React from 'react'

export default function Sidebar() {
  return (
    <div className='bg-slate-800'>
      <Link href='/'>
        Logo
      </Link>
        <div className=''>
        <Link href='#'>Dashboard</Link>
        <Link href='#'>Catalogue</Link>
        <Link href='#'>Customers</Link>
        <Link href='#'>Markets</Link>
        <Link href='#'>Farmers</Link>
        <Link href='#'>Orders</Link>
        <Link href='#'>Staff</Link>
        <Link href='#'>Settings</Link>
        <Link href='#'>Online Store</Link>
        </div>
    </div>
  )
}
