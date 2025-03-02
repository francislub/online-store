import React from 'react'
import Link from "next/link";

export default function page() {
  return (
    <div className='flex justify-center items-center h-screen '>
      <h2 className='text-4xl'>Welcome to Online Store</h2>

      <Link className="my-4 underline " href="/register-farmer">Become a farmer / Vendor / Supplier</Link>
    </div>
  )
}
