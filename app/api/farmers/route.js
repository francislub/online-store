import { NextResponse } from "next/server";

export async function POST(request){

    try {
        const { code, contactPerson, contactPersonPhone, email, name, notes, phone, physicalAddress, terms, isActive, profileImageUrl} = await request.json();
        const newFarmer = await db.farmer.create({
            data:{
                code, contactPerson, contactPersonPhone, email, name, notes, phone, physicalAddress, terms, isActive, profileImageUrl
            }
        })
        
        return NextResponse.json(newFarmer)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to create Farmer",
            error,
        },{status:500})
    }
}