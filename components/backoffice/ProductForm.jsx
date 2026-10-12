// components/backoffice/ProductForm.jsx
// Route: n/a (shared form used by /dashboard/products/new and /dashboard/products/update/[id])
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormHeader from "@/components/backoffice/FormHeader";
import TextInput from "@/components/FormInputs/TextInput";
import TextareaInput from "@/components/FormInputs/TextAreasInput";
import SelectInput from "@/components/FormInputs/SelectInput";
import ImageInput from "@/components/FormInputs/ImageInput";
import ArrayItemsInput from "@/components/FormInputs/ArrayItemsInput";
import ToggleInput from "@/components/FormInputs/ToggleInput";
import SubmitButton from "@/components/FormInputs/SubmitButton";
import { makeGetRequest, makePostRequest, makePutRequest } from "@/lib/apiRequest";
import { generateSlug } from "@/lib/generateSlug";

export default function ProductForm({ product = null }) {
  const isEdit = Boolean(product);
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);

  // Schema stores imageUrls[]; this form edits the first image and keeps the rest
  const [imageUrl, setImageUrl] = useState(product?.imageUrls?.[0] ?? "");
  const extraImages = product?.imageUrls?.slice(1) ?? [];
  const [tags, setTags] = useState(product?.tags ?? []);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      barcode: product?.barcode ?? "",
      brand: product?.brand ?? "",
      model: product?.model ?? "",
      description: product?.description ?? "",
      price: product?.price ?? "",
      salePrice: product?.salePrice ?? "",
      costPrice: product?.costPrice ?? 0,
      stock: product?.stock ?? 0,
      reorderLevel: product?.reorderLevel ?? 5,
      warrantyMonths: product?.warrantyMonths ?? 0,
      categoryId: product?.categoryId ?? "",
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
    },
  });

  // Categories come from the database
  useEffect(() => {
    async function loadCategories() {
      const data = await makeGetRequest("/api/categories");
      setCategories(Array.isArray(data) ? data : []);
      setLoadingCategories(false);
    }
    loadCategories();
  }, []);

  function redirect() {
    router.push("/dashboard/products");
  }

  function handleReset() {
    reset();
    setImageUrl("");
    setTags([]);
  }

  async function onSubmit(data) {
    const payload = {
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      brand: data.brand,
      model: data.model,
      description: data.description,
      price: Number(data.price),
      salePrice: data.salePrice === "" ? null : Number(data.salePrice),
      costPrice: Number(data.costPrice) || 0,
      stock: Number(data.stock) || 0,
      reorderLevel: Number(data.reorderLevel) || 0,
      warrantyMonths: Number(data.warrantyMonths) || 0,
      categoryId: data.categoryId,
      imageUrls: imageUrl ? [imageUrl, ...extraImages] : extraImages,
      tags,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    };

    if (isEdit) {
      makePutRequest(setLoading, `/api/products/${product.id}`, payload, "Product", redirect);
    } else {
      payload.slug = generateSlug(data.name);
      makePostRequest(setLoading, "/api/products", payload, "Product", handleReset, redirect);
    }
  }

  if (loadingCategories) {
    return <p className="p-6 text-center">Loading form...</p>;
  }

  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.name }));

  return (
    <div>
      <FormHeader title={isEdit ? "Update Product" : "New Product"} />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto my-3 w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 sm:p-6 md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <TextInput label="Product Name" name="name" register={register} errors={errors} className="w-full" />
          <TextInput label="Product SKU" name="sku" register={register} errors={errors} className="w-full" />
          <TextInput
            label="Product Barcode"
            name="barcode"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <SelectInput
            label="Select Category"
            name="categoryId"
            register={register}
            errors={errors}
            className="w-full"
            options={categoryOptions}
          />
          <TextInput
            label="Brand"
            name="brand"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Model"
            name="model"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />

          <TextInput
            label="Selling Price (UGX)"
            name="price"
            type="number"
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Sale Price (UGX, discounted)"
            name="salePrice"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Cost Price (UGX)"
            name="costPrice"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label={isEdit ? "Stock (changing this logs an adjustment)" : "Opening Stock"}
            name="stock"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Reorder Level"
            name="reorderLevel"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />
          <TextInput
            label="Warranty (months)"
            name="warrantyMonths"
            type="number"
            isRequired={false}
            register={register}
            errors={errors}
            className="w-full"
          />

          <ImageInput
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            endpoint="productImageUploader"
            label="Product Image"
          />

          {/* Tags */}
          <ArrayItemsInput setItems={setTags} items={tags} itemTitle="Tag" />

          <TextareaInput
            label="Product Description"
            name="description"
            isRequired={false}
            register={register}
            errors={errors}
          />

          <ToggleInput
            label="Publish Your Product"
            name="isActive"
            trueTitle="Active"
            falseTitle="InActive"
            register={register}
          />
          <ToggleInput
            label="Featured Product"
            name="isFeatured"
            trueTitle="Featured"
            falseTitle="Not Featured"
            register={register}
          />
        </div>

        <SubmitButton
          isLoading={loading}
          buttonTitle={isEdit ? "Update Product" : "Create Product"}
          loadingButtonTitle={isEdit ? "Updating Product please wait..." : "Creating Product please wait..."}
        />
      </form>
    </div>
  );
}