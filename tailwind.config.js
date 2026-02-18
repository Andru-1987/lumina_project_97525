/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
                accent: {
                    orange: '#f97316',
                    red: '#ef4444',
                    emerald: '#10b981',
                    yellow: '#eab308',
                    purple: '#8b5cf6',
                    pink: '#ec4899',
                    cyan: '#06b6d4',
                },
            },
            fontFamily: {
                sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
            },
            borderRadius: {
                'card': '12px',
                'button': '8px',
                'pill': '9999px',
                'input': '8px',
                'modal': '16px',
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)',
                'card-hover': '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 6px -2px rgba(0,0,0,0.08)',
                'dropdown': '0 10px 30px -5px rgba(0,0,0,0.15), 0 4px 8px -4px rgba(0,0,0,0.1)',
                'tooltip': '0 4px 14px -2px rgba(0,0,0,0.2)',
                'focus-ring': '0 0 0 3px rgba(14,165,233,0.4)',
                'focus-error': '0 0 0 3px rgba(239,68,68,0.4)',
                'elevated': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                'modal': '0 20px 60px -15px rgba(0,0,0,0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out forwards',
                'slide-down': 'slideDown 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
                'slide-up': 'slideUp 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
                'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'badge-pop': 'badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'shimmer': 'shimmer 1.5s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    from: { transform: 'translateY(-100%)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                slideUp: {
                    from: { transform: 'translateY(16px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                badgePop: {
                    '0%': { transform: 'scale(0)' },
                    '60%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
                shimmer: {
                    from: { backgroundPosition: '-200% 0' },
                    to: { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
