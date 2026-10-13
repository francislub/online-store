// src/app/(frontend)/page.jsx
// Route: /
import HeroSection from "@/components/frontend/HeroSection";
import ShopByCategory from "@/components/frontend/ShopByCategory";
import NewArrivals from "@/components/frontend/NewArrivals";
import LaptopsSection from "@/components/frontend/LaptopsSection";
import MonitorsSection from "@/components/frontend/MonitorsSection";
import AccessoriesBanner from "@/components/frontend/AccessoriesBanner";
import PCHardwareSection from "@/components/frontend/PCHardwareSection";
import BluetoothSection from "@/components/frontend/BluetoothSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ShopByCategory />
      <NewArrivals />
      <LaptopsSection />
      <MonitorsSection />
      <AccessoriesBanner />
      <PCHardwareSection />
      <BluetoothSection />
      <div className="h-24" />
    </>
  );
}