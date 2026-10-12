// Route: /dashboard/categories/new
// File: src/app/(backoffice)/dashboard/categories/new/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import ImageInput from "@/components/FormInputs/ImageInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest } from "@/lib/apiRequest";
import { generateSlug } from "@/lib/generateSlug";

export default function NewCategory() {
  const [imageUrl, setImageUrl] = useState("");
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isActive: true,
      parentId: "",
    },
  });

  useEffect(() => {
    async function loadParents() {
      const data = await makeGetRequest("/api/categories");
      setParents(Array.isArray(data) ? data : []);
    }
    loadParents();
  }, []);

  function redirect() {
    router.push("/dashboard/categories");
  }

  function handleReset() {
    reset();
    setImageUrl("");
  }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      slug: generateSlug(data.name),
      description: data.description || "",
      imageUrl,
      parentId: data.parentId || null,
      isActive: data.isActive,
    };

    makePostRequest(setLoading, "/api/categories", payload, "Category", handleReset, redirect);
  }

  return (
    <div>
      <FormHeader title="New Category" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Category Name" name="name" register={register} errors={errors} />

          <div className="w-full">
            <label htmlFor="parentId" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Parent Category (optional)
            </label>
            <select
              id="parentId"
              {...register("parentId")}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-lime-500 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">None (top-level category)</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          <TextareaInput
            label="Category Description"
            name="description"
            isRequired={false}
            register={register}
            errors={errors}
          />

          <ImageInput
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            endpoint="categoryImageUploader"
            label="Category Image"
          />

          <ToggleInput
            label="Publish Your Category"
            name="isActive"
            trueTitle="Active"
            falseTitle="InActive"
            register={register}
          />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle="Create Category"
          loadingButtonTitle="Creating Category please wait..."
        />
      </form>
    </div>
  );
}