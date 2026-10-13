// src/app/(frontend)/layout.jsx
// CustomerProvider must wrap SiteShell so the header's AccountMenu, the account page
// and checkout can all read the logged-in customer.
import SiteShell from "@/components/frontend/SiteShell";
import { CustomerProvider } from "@/context/CustomerContext";

export default function FrontendLayout({ children }) {
  return (
    <CustomerProvider>
      <SiteShell>{children}</SiteShell>
    </CustomerProvider>
  );
}