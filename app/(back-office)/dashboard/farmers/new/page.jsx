"use client"

import React, {useState} from 'react'
import FormHeader from '@/components/backoffice/FormHeader'
import TextInput from '@/components/FormInputs/TextInput'
import {useForm} from "react-hook-form";
import SubmitButton from '@/components/FormInputs/SubmitButton';
import TextareaInput from '@/components/FormInputs/TextAreasInput';
import { makePostRequest } from '../../../../../lib/apiRequest';
import ToggleInput from '@/components/FormInputs/ToggleInput';
import { watch } from 'lucide-react';
import { useRouter } from "next/navigation";
import ImageInput from '@/components/FormInputs/ImageInput';
import NewFarmerForm from '@/components/backoffice/NewFarmerForm'

export default function NewFarmer() {
  
  return (
    <div>
      <FormHeader title="New Farmer"/>

      <NewFarmerForm />
      
    </div>
  )
}
