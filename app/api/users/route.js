import db from "@/lib/db"
import { NextResponse } from "next/server";
import bcrypt from 'bcrypt'

export async function POST(request){

    try {
        const { name, email, password, role} = await request.json();

        const existingUser = await db.user.findUnique({
            where:{
                email
            }
        })
        if(existingUser){
            return NextResponse.json({
                data:null,
                message:"User Already exists"
            },{status:409})
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await db.user.create({
            data:{
                name, email, password: hashedPassword, role,
            },
        });
        // console.log(user)
        
        return NextResponse.json(
            {
            data: newUser,
            message: "User Created Successfully",
        }, { status: 201 }
    );
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
                error,
                message: "Server Error: Something went wrong",
            }, { status: 500 }
        );
    }
}

export async function Get (request){
    try {

        const users = await db.user.findMany({
            orderBy:{
                createdAt:"desc"
            }
        });
        
        return NextResponse.json(users)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to Fetch Users",
            error,
        },{status:500})
    }
}