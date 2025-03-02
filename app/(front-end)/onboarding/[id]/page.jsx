import React from 'react'
import NewFarmerForm from "@/components/backoffice/NewFarmerForm";
import { getData } from "@/lib/getData"

export default async function page({params:{id}}) {
    const users = await getData("users")
  return (
    <div className="flex flex-col gap-6 p-16">
        <div className="max-w-4xl p-4 mx-auto">
        <h2>Tell Us More About Your Self</h2>

        </div>
        <NewFarmerForm/>
    </div>

  )
}
