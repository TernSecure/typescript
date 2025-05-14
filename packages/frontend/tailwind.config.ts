/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	//content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
	content: [
        "./src/**/*.{ts,tsx,js,jsx}",
		"./src/components/**/*.{ts,tsx}",
		"./node_modules/@tern-secure/**/*.{js,ts,jsx,tsx}",
		"./node_modules/@tern-secure/*/dist/**/*.{js,ts,jsx,tsx}" 
    ],
	theme: {
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		},
		borderRadius: {
		  lg: `var(--radius)`,
		  md: `calc(var(--radius) - 2px)`,
		  sm: "calc(var(--radius) - 4px)",
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  }
  