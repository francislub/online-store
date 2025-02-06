"use client"

import React, {useState} from 'react'
import FormHeader from '@/components/backoffice/FormHeader'
import TextInput from '@/components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '@/components/FormInputs/SubmitButton';
import TextareaInput from '@/components/FormInputs/TextAreasInput';
import { generateSlug } from '../../../../../lib/generateSlug';
import ImageInput from '@/components/FormInputs/ImageInput';
import SelectInput from '@/components/FormInputs/SelectInput';
import ToggleInput from '@/components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';
import QuillEditor from '../../../../../components/FormInputs/QuillEditor';

export default function NewTraining() {
  const [imageUrl, setImageUrl] = useState("")
  const categories =[
    {
      id:1,
      title: "Category 1"
    },
    {
      id:2,
      title: "Category 2"
    },
    {
      id:3,
      title: "Category 3"
    },
   
  ]
  const [loading, setLoading] = useState(false)
  const {register,reset,watch,handleSubmit,formState: {errors}} = useForm({
    defaultValues:{
      isActive:true
    }
  });
  
  const [content, setContent] = useState("");
  

  const isActive = watch("isActive")
  async function onSubmit(data){
    // setLoading(true)
    const slug = generateSlug(data.title)
    data.slug = slug;
    data.imageUrl = imageUrl;
    data.content = content;
  console.log(data);
  makePostRequest(
    setLoading,
    "api/trainings",
    data,
    "Training",
    reset
  );
  setImageUrl("")
  setContent("")
  }
  return (
    <div>
      <FormHeader title="New Training"/>

      <form action="" onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Training Title"
            name="title"
            register={register}
            errors={errors}
            className='w-full'
          />
          <SelectInput
            label="Select Category"
            name="categoryIds"
            register={register}
            errors={errors}
            className='w-full'
            options={categories}
          />
          <TextareaInput
            label="Training Description"
            name="description"
            register={register}
            errors={errors}
          />
          <ImageInput imageUrl={imageUrl} setImageUrl={setImageUrl} endpoint="trainingImageUploader" label="Training Image"/>
        
          <QuillEditor label="Training Content" value={content} onChange={setContent}/>

        <ToggleInput 
        label="Publish Your Training" 
        name="isActive" 
        trueTitle="Active" 
        falseTitle="InActive" 
        register={register}
        />
        </div>
        <SubmitButton isLoading={loading} buttonTitle="Create Training" loadingButtonTitle="Creating Training please wait..."/>

      </form>
      
    </div>
  )
}
