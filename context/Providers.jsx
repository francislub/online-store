"use client"
import React from 'react'
import { Toaster } from "react-hot-toast"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "../app/api/uploadthing/core";

import {ThemeProvider} from 'next-themes'
export default function Providers({children}) {
    return (
        <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark" >
             <NextSSRPlugin
          
                routerConfig={extractRouterConfig(ourFileRouter)}
            />
            <Toaster
            position="top-center"
            reverseOrder={false}
            />
            {children}
        </ThemeProvider>
    );
}