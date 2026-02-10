#!/usr/bin/env python3
import argparse
import json
import sys

# --- DATABASE MOCK (Base de Conhecimento UI/UX) ---
DATABASE = {
    "product": {
        "saas": "Focus on clarity, conversion, and trust. Use clean sans-serif fonts, high contrast for CTAs, and generous whitespace.",
        "ecommerce": "Focus on product imagery, simplified checkout flow, and trust signals. Use fast transitions and sticky 'Add to Cart'.",
        "portfolio": "Focus on personality and case studies. Use large typography, grid layouts, and scroll-triggered animations.",
        "beauty": "Focus on elegance and sensory appeal. Use serif headings, pastel or earthy tones, and high-quality photography.",
        "healthcare": "Focus on trust and accessibility. Use calming blues/greens, very legible fonts, and clear information hierarchy."
    },
    "style": {
        "minimal": "Less is more. Heavy reliance on typography and spacing. No shadows, just borders. Monochromatic colors.",
        "glassmorphism": "Translucent backgrounds (backdrop-filter: blur), white borders, vivid background blobs.",
        "dark": "Background: #0F172A or #000000. Text: #E2E8F0. Borders: #1E293B. Avoid pure black for cards.",
        "elegant": "Serif fonts (Playfair Display), gold/cream accents, generous leading (line-height), subtle fade-in animations."
    },
    "typography": {
        "elegant": "Font Pairing: Playfair Display (Headings) + Lato (Body). Import: @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Playfair+Display:wght@400;700&display=swap');",
        "modern": "Font Pairing: Inter (Headings) + Inter (Body). The standard for SaaS.",
        "playful": "Font Pairing: Poppins (Headings) + Quicksand (Body). Good for education or lifestyle apps.",
        "tech": "Font Pairing: Space Grotesk (Headings) + Roboto Mono (Code/Accents)."
    },
    "color": {
        "beauty": "Palette: Primary #F472B6 (Pink-400), Bg #FFF1F2 (Rose-50), Text #881337 (Rose-900).",
        "saas": "Palette: Primary #2563EB (Blue-600), Bg #F8FAFC (Slate-50), Text #0F172A (Slate-900).",
        "dark": "Palette: Primary #8B5CF6 (Violet-500), Bg #0F172A (Slate-900), Text #F1F5F9 (Slate-100).",
        "fintech": "Palette: Primary #059669 (Emerald-600), Secondary #020617 (Slate-950)."
    },
    "ux": {
        "accessibility": "Checklist: 1. Contrast ratio > 4.5:1. 2. Alt text for images. 3. Focus states visible. 4. Semantic HTML.",
        "animation": "Rule: Duration between 200ms-300ms. Easing: cubic-bezier(0.4, 0, 0.2, 1). Never animate 'width' or 'height', use 'transform'.",
        "z-index": "System: Drawer (50), Modal (40), Dropdown (30), Sticky Header (20), Default (0), Background (-1)."
    }
}

STACK_GUIDELINES = {
    "html-tailwind": "Use utility classes for everything. Config: tailwind.config.js for colors/fonts. Avoid @apply unless necessary.",
    "react": "Use functional components. Memoize expensive calculations. Use Context for global state, Props for local.",
    "nextjs": "Use App Router (app/). Server Components by default. Use <Image/> for optimization. Metadata API for SEO.",
    "r3f": "Use @react-three/drei for helpers. Keep scene logic separate from UI. Use explicit disposal for textures."
}

def search(keyword, domain, stack, max_results):
    results = []
    keyword = keyword.lower()
    
    # 1. Domain Search
    if domain in DATABASE:
        category = DATABASE[domain]
        for key, value in category.items():
            if keyword in key.lower() or keyword in value.lower() or keyword == "":
                results.append(f"[{domain.upper()}] {key.capitalize()}: {value}")
    
    # 2. Stack Search (if flagged)
    if stack and stack in STACK_GUIDELINES:
         results.append(f"[STACK: {stack.upper()}] {STACK_GUIDELINES[stack]}")

    return results[:max_results]

def main():
    parser = argparse.ArgumentParser(description="UI/UX Knowledge Base Search")
    parser.add_argument("keyword", help="Search term")
    parser.add_argument("--domain", choices=["product", "style", "typography", "color", "ux", "landing", "chart"], default="product")
    parser.add_argument("--stack", help="Tech stack context")
    parser.add_argument("-n", "--max_results", type=int, default=5)
    
    args = parser.parse_args()
    
    print(f"🔍 Searching for '{args.keyword}' in domain '{args.domain}'...")
    results = search(args.keyword, args.domain, args.stack, args.max_results)
    
    if results:
        print("\n".join(results))
    else:
        print("No specific matches found. Try broader keywords like 'saas', 'modern', or 'accessibility'.")

if __name__ == "__main__":
    main()
