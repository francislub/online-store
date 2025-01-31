"use client"

import React, {useState} from 'react'
import FormHeader from '../../../../../../components/backoffice/FormHeader'
import TextInput from '../../../../../../components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '../../../../../../components/FormInputs/SubmitButton';
import { makePostRequest } from '../../../../../../lib/apiRequest';
import { generateCouponCode } from '../../../../../../lib/generateCouponCode';
import ToggleInput from '../../../../../../components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';

export default function NewCoupon() {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState()
  const {register,reset,watch,handleSubmit,formState: {errors}} = useForm({
      defaultValues:{
        isActive:true
      }
    });
    const isActive = watch("isActive")

  async function onSubmit(data){
    // setLoading(true)
    const couponCode = generateCouponCode(data.title, data.expiryDate)

    data.couponCode = couponCode;
  console.log(data);
  makePostRequest(
    setLoading,
    "api/coupons",
    data,
    "Coupon",
    reset
  );
  }
  return (
    <div>
      <FormHeader title="New Coupon"/>

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Coupon Title"
            name="title"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Coupon Expiry Date"
            name="expiryDate"
            type='date'
            register={register}
            errors={errors}
            className='w-full'
          />

           <ToggleInput 
            label="Publish Your Coupon" 
            name="isActive" 
            trueTitle="Active" 
            falseTitle="InActive" 
            register={register}
            />
          
          </div>
        <SubmitButton isLoading={loading} buttonTitle="Create Coupon" loadingButtonTitle="Creating Coupon please wait..."/>

      </form>
      
    </div>
  )
}
