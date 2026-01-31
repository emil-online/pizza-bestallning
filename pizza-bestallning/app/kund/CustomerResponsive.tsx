"use client";

import CustomerMobile from "./CustomerMobile";
import CustomerDesktop from "./CustomerDesktop";

export default function CustomerResponsive() {
  return (
    <>
      <div className="block md:hidden">
        <CustomerMobile />
      </div>

      <div className="hidden md:block">
        <CustomerDesktop />
      </div>
    </>
  );
}
