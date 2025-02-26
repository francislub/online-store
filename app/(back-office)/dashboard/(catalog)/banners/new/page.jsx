"use client"

import React, {useState} from 'react'
import FormHeader from '../../../../../../components/backoffice/FormHeader'
import TextInput from '../../../../../../components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '../../../../../../components/FormInputs/SubmitButton';
import TextareaInput from '../../../../../../components/FormInputs/TextAreasInput';
import ImageInput from '../../../../../../components/FormInputs/ImageInput';
import { makePostRequest } from '../../../../../../lib/apiRequest';
import ToggleInput from '../../../../../../components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';
import { redirect, useRouter} from 'next/navigation';

export default function NewCategory() {
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const {register, watch ,reset,handleSubmit,formState: {errors}} = useForm({
    defaultValues:{
      isActive:true
    }
  });
  const isActive = watch("isActive")
  const router = useRouter();
    function redirect() {
      router.push("/dashboard/banners")
    }
  async function onSubmit(data){
    // setLoading(true)
    // const slug = generateSlug(data.title)
    // data.slug = slug;
    data.imageUrl = imageUrl;
  console.log(data);
  makePostRequest(
    setLoading,
    "api/banners",
    data,
    "Banner",
    reset, 
    redirect
  );
  setImageUrl("")
  }
  return (
    <div>
      <FormHeader title="New Banner"/>

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Banner Title"
            name="title"
            register={register}
            errors={errors}
          />
          <TextInput
            label="Banner Link"
            name="link"
            register={register}
            errors={errors}
          />
          {/* <TextareaInput
            label="Banner Description"
            name="description"
            register={register}
            errors={errors}
          /> */}
          <ImageInput imageUrl={imageUrl} setImageUrl={setImageUrl} endpoint="bannerImageUploader" label="Banner Image"/>

          <ToggleInput 
          label="Publish Your Banner" 
          name="isActive" 
          trueTitle="Active" 
          falseTitle="InActive" 
          register={register}
          />
        </div>
        <div className="mt-4">
          <SubmitButton isLoading={loading} buttonTitle="Create Banner" loadingButtonTitle="Creating Banner please wait..." />
        </div>
        {/* <SubmitButton isLoading={loading} buttonTitle="Create Banner" loadingButtonTitle="Creating Banner please wait..."/> */}

      </form>
      
    </div>
  )
}
