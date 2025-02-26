import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function POST(request){

    try {
        const {title, slug, imageUrl, description, isActive} = await request.json();
        
        const existingCategory = await db.category.findUnique({
            where: {
                slug,
            },
        });
        if(existingCategory){
            return NextResponse.json({
                data:null,
                message:"Category already exists"
            },{status:409});
        }

        const newCategory = await db.category.create({
            data: {title, slug, imageUrl, description, isActive},
        });
        
        return NextResponse.json(newCategory);
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to create Category",
            error,
        },{status:500})
    }
}

export async function Get (request){
    try {

        const categories = await db.category.findMany({
            orderBy:{
                createdAt:"desc"
            }
        });
        
        return NextResponse.json(categories)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to Fetch Category",
            error,
        },{status:500})
    }
}