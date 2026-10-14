"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import dynamic from "next/dynamic";

import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import ImageInput from "@/components/FormInputs/ImageInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";

import { generateSlug } from "@/lib/generateSlug";
import { makePostRequest } from "@/lib/makePostRequest";

// Load the rich-text editor only in the browser.
// Update the import path if your existing editor is elsewhere.
const QuillEditor = dynamic(
  () => import("@/components/FormInputs/QuillEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-lg border p-4 text-sm text-gray-500">
        Loading training editor...
      </div>
    ),
  }
);

export default function NewTraining() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const categories = [
    {
      id: 1,
      title: "Category 1",
    },
    {
      id: 2,
      title: "Category 2",
    },
    {
      id: 3,
      title: "Category 3",
    },
  ];

  const {
    register,
    reset,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  async function onSubmit(formData) {
    try {
      setLoading(true);

      const slug = generateSlug(formData.title);

      const payload = {
        ...formData,
        slug,
        imageUrl,
        content,
        isActive,
      };

      console.log("Submitting training:", payload);

      await makePostRequest(
        setLoading,
        "/api/trainings",
        payload,
        "Training",
        reset
      );

      setImageUrl("");
      setContent("");
    } catch (error) {
      console.error(
        "Error creating training:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <FormHeader title="New Training" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow sm:p-6 md:p-8 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput
            label="Training Title"
            name="title"
            register={register}
            errors={errors}
            className="w-full"
          />

          <SelectInput
            label="Select Category"
            name="categoryIds"
            register={register}
            errors={errors}
            className="w-full"
            options={categories}
          />

          <TextareaInput
            label="Training Description"
            name="description"
            register={register}
            errors={errors}
          />

          <ImageInput
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            endpoint="trainingImageUploader"
            label="Training Image"
          />

          <div className="sm:col-span-2">
            <QuillEditor
              label="Training Content"
              value={content}
              onChange={setContent}
            />
          </div>

          <div className="sm:col-span-2">
            <ToggleInput
              label="Publish Your Training"
              name="isActive"
              trueTitle="Active"
              falseTitle="Inactive"
              register={register}
            />
          </div>
        </div>

        <div className="mt-6">
          <SubmitButton
            isLoading={loading}
            buttonTitle="Create Training"
            loadingButtonTitle="Creating Training, please wait..."
          />
        </div>
      </form>
    </div>
  );
}