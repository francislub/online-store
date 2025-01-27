"use client"

import React, {useState} from 'react'
import FormHeader from '../../../../../../components/backoffice/FormHeader'
import TextInput from '../../../../../../components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '../../../../../../components/FormInputs/SubmitButton';
import TextareaInput from '../../../../../../components/FormInputs/TextAreasInput';
import { generateSlug } from '../../../../../../lib/generateSlug';
import ImageInput from '../../../../../../components/FormInputs/ImageInput';

export default function NewCategory() {
  const [imageUrl, setImageUrl] = useState("")
  const {register,handleSubmit,formState: {errors}} = useForm();
  async function onSubmit(data){
    const slug = generateSlug(data.title)
    data.slug = slug
  console.log(data)
  }
  return (
    <div>
      <FormHeader title="New Category"/>

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Category Title"
            name="title"
            register={register}
            errors={errors}
          />
          <TextareaInput
            label="Category Description"
            name="description"
            register={register}
            errors={errors}
          />
          <ImageInput imageUrl={imageUrl} setImageUrl={setImageUrl} endpoint="categoryImageUploader" label="Category Image"/>
        </div>
        <SubmitButton isLoading={false} buttonTitle="Create Category" loadingButtonTitle="Creating Category please wait..."/>

      </form>
      
    </div>
  )
}
