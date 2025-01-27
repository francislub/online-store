// import type { Config } from "tailwindcss";
import { withUt } from "uploadthing/tw";
 
export default withUt(
	{

		darkMode: ["class"],
		content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	  ],
	  theme: {
		  extend: {
			  colors: {
				  background: 'var(--background)',
				  foreground: 'var(--foreground)'
			  },
			  borderRadius: {
				  lg: 'var(--radius)',
				  md: 'calc(var(--radius) - 2px)',
				  sm: 'calc(var(--radius) - 4px)'
			  },
		  },
		},
		  plugins: [require("tailwindcss-animate"),require('@tailwindcss/forms')],
	// }, satisfies Config;
  });

