import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function POST(request){

    try {
        const { title, link, imageUrl, isActive} = await request.json();
        const newBanner = await db.banner.create({
            data:{
                title, link, imageUrl, isActive
            }
        })
        
        return NextResponse.json(newBanner)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to create Banner",
            error,
        },{status:500})
    }
}

export async function Get (request){
    try {

        const banners = await db.banner.findMany({
            orderBy:{
                createdAt:"desc"
            }
        });
        
        return NextResponse.json(banners)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to Fetch Bunners",
            error,
        },{status:500})
    }
}