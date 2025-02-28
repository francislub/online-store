import { NextResponse } from "next/server";
import bcrypt from 'bcrypt'

export async function POST(request){

    try {
        const { name, email, password} = await request.json();

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
                name, email, password: hashedPassword,
            },
        });
        console.log(user)
        
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