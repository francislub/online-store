"use client"
import React from 'react'
import { Toaster } from "react-hot-toast"

import {ThemeProvider} from 'next-themes'
export default function Providers({children}) {
    return (
        <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark" >
            <Toaster
            position="top-center"
            reverseOrder={false}
            />
            {children}
        </ThemeProvider>
    );
}