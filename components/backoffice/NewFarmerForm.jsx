"use client"

import React, {useState} from 'react'
import FormHeader from '@/components/backoffice/FormHeader'
import TextInput from '@/components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '@/components/FormInputs/SubmitButton';
import TextareaInput from '@/components/FormInputs/TextAreasInput';
import { makePostRequest } from '@/lib/apiRequest';
import ToggleInput from '@/components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';
import { useRouter } from "next/navigation";
import ImageInput from '@/components/FormInputs/ImageInput';
import ArrayItemsInput from "../FormInputs/ArrayItemsInput";
import { generateUserCode } from "@/lib/generateUserCode";

export default function NewFarmerForm({user}) {
  
  const [loading, setLoading] = useState(false)
  // const [couponCode, setCouponCode] useState();
  const [imageUrl, setImageUrl] = useState("");
  const [products, setProducts] = useState([])
  const {register,reset,watch,handleSubmit,formState: {errors}} = useForm({
    defaultValues:{
      isActive:true,
      ...user
    },
  });
  const isActive = watch("isActive")
  const [logoUrl, setLogoUrl] = useState("");


  const router = useRouter();
    
    function redirect() {
      router.push("/dashboard/farmers")
    }

  async function onSubmit(data){
    // setLoading(true)
    const code = generateUserCode("LFF", data.name)
    data.code = code;
    data.userId = user.id
    data.products = products;
    data.imageUrl = imageUrl;
  console.log(data);
  makePostRequest(
    setLoading,
    "api/farmers",
    data,
    "Farmer Profile",
    reset,
    redirect
  );
  // setImageUrl("")
  }
  return (

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Farmer's Full Name"
            name="name"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Farmer's Phone"
            name="phone"
            type="tel"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Farmer's Email Address"
            name="email"
            type="email"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Farmer's Physical Address"
            name="physicalAddress"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Farmer's Contact Person"
            name="contactPerson"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="Farmer's Contact Person Phone"
            name="contactPersonPhone"
            type="tel"
            register={register}
            errors={errors}
            className='w-full'
          />
          <TextInput
            label="What is the Size of your Land in Accres"
            name="landSize"
            type="number"
            register={register}
            errors={errors}
            className='w-full'
          />
          
          <TextInput
            label="What is your main Crop that you Cultivate"
            name="mainCrop"
            type="text"
            register={register}
            errors={errors}
            className='w-full'
          />
          <ArrayItemsInput setItems={setProducts} items={products} itemTitle="Product"/>


         <ImageInput 
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          endpoint="farmerProfileUploader"
          label="Farmer Profile Image"

          />

          <TextareaInput
            label="Farmer's Payment Terms"
            name="terms"
            register={register}
            errors={errors}
            isRequired={false}
          />
          <TextareaInput
            label="Notes"
            name="notes"
            register={register}
            errors={errors}
            isRequired={false}
          />
         
         <ToggleInput 
        label="Farmer Status" 
        name="isActive" 
        trueTitle="Active" 
        falseTitle="InActive" 
        register={register}
        />
        </div>
        <SubmitButton isLoading={loading} buttonTitle="Create Farmer" loadingButtonTitle="Creating Farmer please wait..."/>

      </form>
      
  )
}
