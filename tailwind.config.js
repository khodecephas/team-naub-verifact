import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                // Material-3-style role names from the Stitch design system
                // (Forensic Portal pages). New key names only — nothing here
                // touches Tailwind's default scale, so existing pages are
                // unaffected.
                'headline-xl': ['Inter', ...defaultTheme.fontFamily.sans],
                'headline-lg': ['Inter', ...defaultTheme.fontFamily.sans],
                'headline-md': ['Inter', ...defaultTheme.fontFamily.sans],
                'headline-sm': ['Inter', ...defaultTheme.fontFamily.sans],
                'body-lg': ['Inter', ...defaultTheme.fontFamily.sans],
                'body-md': ['Inter', ...defaultTheme.fontFamily.sans],
                'body-sm': ['Inter', ...defaultTheme.fontFamily.sans],
                'label-md': ['Inter', ...defaultTheme.fontFamily.sans],
                'label-sm': ['Inter', ...defaultTheme.fontFamily.sans],
                'code-lg': ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
                'code-md': ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
                'code-sm': ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
            },
            fontSize: {
                'headline-xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
                'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
                'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
                'headline-sm': ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '600' }],
                'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
                'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
                'body-sm': ['13px', { lineHeight: '18px', letterSpacing: '0em', fontWeight: '400' }],
                'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
                'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.03em', fontWeight: '600' }],
                'code-lg': ['14px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '500' }],
                'code-md': ['12px', { lineHeight: '18px', letterSpacing: '0em', fontWeight: '500' }],
                'code-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '400' }],
            },
            colors: {
                'on-primary-fixed': '#131b2e',
                'surface-container-high': '#dce9ff',
                'surface-bright': '#f8f9ff',
                'on-primary': '#ffffff',
                primary: '#0f2742',
                'tertiary-container': '#002114',
                surface: '#f1f5f9',
                'on-tertiary-fixed-variant': '#005137',
                'primary-fixed': '#dae2fd',
                'on-secondary-fixed': '#00174b',
                'on-error': '#ffffff',
                'on-primary-fixed-variant': '#3f465c',
                'on-tertiary': '#ffffff',
                'on-surface-variant': '#45464d',
                'surface-dim': '#cbdbf5',
                'primary-container': '#131b2e',
                'secondary-fixed-dim': '#b4c5ff',
                'surface-container-low': '#eff4ff',
                'inverse-primary': '#bec6e0',
                secondary: '#1d4f7a',
                'on-tertiary-fixed': '#002114',
                'on-secondary-fixed-variant': '#003ea8',
                'outline-variant': '#c6c6cd',
                'primary-fixed-dim': '#bec6e0',
                'surface-tint': '#565e74',
                'tertiary-fixed': '#85f8c4',
                'inverse-on-surface': '#eaf1ff',
                error: '#ba1a1a',
                'tertiary-fixed-dim': '#68dba9',
                'surface-container': '#e5eeff',
                'surface-variant': '#d3e4fe',
                'inverse-surface': '#213145',
                outline: '#76777d',
                'surface-container-highest': '#d3e4fe',
                'surface-container-lowest': '#ffffff',
                'on-surface': '#0b1c30',
                'on-background': '#0b1c30',
                'on-error-container': '#93000a',
                'on-tertiary-container': '#069669',
                tertiary: '#000000',
                'secondary-fixed': '#dbe1ff',
                'on-secondary-container': '#fefcff',
                'secondary-container': '#316bf3',
                'on-primary-container': '#7c839b',
                background: '#f1f5f9',
                'error-container': '#ffdad6',
                'on-secondary': '#ffffff',

                // shadcn-style semantic aliases for components/ui/* — kept
                // separate from the MD3 token set above since components/ui
                // components (adapted from digital-roster's pattern) expect
                // these exact names. Values match the slate/blue palette
                // already used throughout the Forensic Portal pages.
                'primary-foreground': '#ffffff',
                'secondary-foreground': '#ffffff',
                foreground: '#0b1c30',
                muted: '#f1f5f9',
                'muted-foreground': '#64748b',
                border: '#e2e8f0',
                ring: '#1d4f7a',
                destructive: '#ba1a1a',
                'destructive-foreground': '#ffffff',
            },
            spacing: {
                'space-sm': '0.5rem',
                'space-3xl': '3rem',
                'space-xl': '1.5rem',
                'space-lg': '1rem',
                'space-2xl': '2rem',
                gutter: '1rem',
                'container-padding': '1.5rem',
                'space-2xs': '0.125rem',
                'space-md': '0.75rem',
                'space-xs': '0.25rem',
            },
        },
    },

    plugins: [forms],
};
