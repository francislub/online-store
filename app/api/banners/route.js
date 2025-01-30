import { NextResponse } from "next/server";

export async function POST(request){

    try {
        const {url, imageUrl, description} = await request.json();
        const newBanner = {url, imageUrl, description};
        
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