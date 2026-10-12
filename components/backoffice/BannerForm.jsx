// components/backoffice/BannerForm.jsx
// Route: /dashboard/banners/new and /dashboard/banners/update/:id  (shared form)
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import ImageInput from "@/components/FormInputs/ImageInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makePostRequest, makePutRequest } from "@/lib/apiRequest";

// mode: "create" | "edit". In edit mode pass the banner loaded from the database.
export default function BannerForm({ mode = "create", initialData = null }) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [loading, setLoading] = useState(false);

  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || "",
      link: initialData?.link || "",
      sortOrder: initialData?.sortOrder ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const goBack = () => {
    router.push("/dashboard/banners");
    router.refresh();
  };

  async function onSubmit(values) {
    if (!imageUrl) {
      toast.error("Please upload a banner image");
      return;
    }

    const payload = {
      title: values.title,
      link: values.link,
      isActive: Boolean(values.isActive),
      imageUrl,
    };
    if (values.sortOrder !== "" && values.sortOrder !== undefined) {
      payload.sortOrder = Number(values.sortOrder);
    }
    console.log("[BannerForm] submit", mode, payload);

    if (isEdit) {
      await makePutRequest(setLoading, `api/banners/${initialData.id}`, payload, "Banner", goBack);
    } else {
      await makePostRequest(
        setLoading,
        "api/banners",
        payload,
        "Banner",
        () => {
          reset();
          setImageUrl("");
        },
        goBack
      );
    }
  }

  return (
    <div>
      <FormHeader title={isEdit ? "Update Banner" : "New Banner"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-4xl p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700 mx-auto my-3"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Banner Title" name="title" register={register} errors={errors} />
          <TextInput label="Banner Link" name="link" register={register} errors={errors} isRequired={false} />

          <div>
            <label
              htmlFor="sortOrder"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Sort Order (optional)
            </label>
            <input
              id="sortOrder"
              type="number"
              min="0"
              step="1"
              {...register("sortOrder")}
              placeholder="Auto"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-lime-500 focus:border-lime-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <ImageInput
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            endpoint="bannerImageUploader"
            label="Banner Image"
          />

          <ToggleInput
            label="Publish Your Banner"
            name="isActive"
            trueTitle="Active"
            falseTitle="InActive"
            register={register}
          />
        </div>

        <div className="mt-4">
          <SubmitButton
            isLoading={loading}
            buttonTitle={isEdit ? "Update Banner" : "Create Banner"}
            loadingButtonTitle={isEdit ? "Updating Banner please wait..." : "Creating Banner please wait..."}
          />
        </div>
      </form>
    </div>
  );
}