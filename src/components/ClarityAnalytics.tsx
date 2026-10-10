"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";
import { CLARITY_PROJECT_ID } from "@/lib/site";

/** Starts Microsoft Clarity once per page load, in production builds only. */
export function ClarityAnalytics() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") Clarity.init(CLARITY_PROJECT_ID);
  }, []);
  return null;
}
