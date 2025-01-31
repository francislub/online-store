"use client"

import React, {useState} from 'react'
import FormHeader from '@/components/backoffice/FormHeader'
import TextInput from '@/components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '@/components/FormInputs/SubmitButton';
import TextareaInput from '@/components/FormInputs/TextAreasInput';
import ImageInput from '@/components/FormInputs/ImageInput';
import { makePostRequest } from '../../../../../lib/apiRequest';
import ToggleInput from '@/components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';

export default function NewMarket() {
  const [logoUrl, setLogoUrl] = useState("")
  
  const [loading, setLoading] = useState(false)
  const {register,reset,watch,handleSubmit,formState: {errors}} = useForm({
    defaultValues:{
      isActive:true
    }
  });
  const isActive = watch("isActive")
  async function onSubmit(data){
    // setLoading(true)
    const slug = generateSlug( data.title)
    data.slug = slug;
    data.logoUrl = logoUrl;
  console.log(data);
  makePostRequest(
    setLoading,
    "api/markets",
    data,
    "Market",
    reset
  );
  setLogoUrl("")
  }
  return (
    <div>
      <FormHeader title="New Market"/>

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Market Title"
            name="title"
            register={register}
            errors={errors}
          />

          <ImageInput 
          imageUrl={logoUrl}
          setImageUrl={setLogoUrl}
          endpoint="marketLogoUploader"
          label="Market Logo"

          />
          <TextareaInput
            label="Market Description"
            name="description"
            register={register}
            errors={errors}
          />
         
         <ToggleInput 
        label="Market Status" 
        name="isActive" 
        trueTitle="Active" 
        falseTitle="InActive" 
        register={register}
        />
        </div>
        <SubmitButton isLoading={loading} buttonTitle="Create Market" loadingButtonTitle="Creating Market please wait..."/>

      </form>
      
    </div>
  )
}
