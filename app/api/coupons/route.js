import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function POST(request){

    try {
        const {title, couponCode, expiryDate ,isActive} = await request.json();

        
        const newCoupon = await db.coupon.create({
            data:{
                title, couponCode, expiryDate, isActive
            },
        });
        
        return NextResponse.json(newCoupon)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to create Coupon",
            error,
        },{status:500})
    }
}

export async function Get (request){
    try {

        const coupons = await db.coupon.findMany({
            orderBy:{
                createdAt:"desc"
            }
        });
        
        return NextResponse.json(coupons)
    } catch (error){
        console.log(error)
        return NextResponse.json(
            {
            message:"Failed to Fetch Coupon",
            error,
        },{status:500})
    }
}