# Retro Editorial UI Design System

## 1. Overall Design Style

This UI combines several visual influences:

-   **Minimalist Editorial**
-   **Retro Illustration**
-   **Soft Brutalism**
-   **Hand-Drawn Character UI**
-   **Vintage Magazine / Poster Design**
-   **Modern Mobile App UI**
-   **Flat Vector Illustration**
-   **Monochromatic / Duotone Artwork**

### Core Design Philosophy

The design does not depend on many colors or complex effects. Instead,
it uses:

> **Warm neutral colors + hand-drawn illustrations + bold typography +
> rounded cards + generous negative space.**

The goal is to make the application feel playful, sophisticated, calm,
and editorial rather than like a conventional dashboard.

------------------------------------------------------------------------

# 2. Color Palette

The UI primarily uses warm cream, charcoal, and muted gray.

  Purpose                        HEX         RGB / Approximation
  ------------------------------ ----------- -----------------------
  Primary Dark / Ink             `#1D1E22`   29, 30, 34
  Ink Soft / Illustration Dark   `#1B1F22`   27, 31, 34
  Main Background Gray           `#545452`   84, 84, 82
  Secondary Gray                 `#716D6C`   113, 109, 108
  Card Cream                     `#DBD2CD`   219, 210, 205
  Light Cream / White            `#F5F3EF`   Approx. 245, 243, 239
  Muted Text                     `#A7A3A0`   Approx.
  Border / Divider               `#8B8784`   Approx.

## Core Palette

The three most important colors are:

``` text
CHARCOAL
#1D1E22

CREAM
#DBD2CD

GRAY
#545452
```

Avoid introducing many unrelated accent colors. The restricted palette
is a major part of the visual identity.

------------------------------------------------------------------------

# 3. Recommended Color Tokens

``` css
:root {
  --ink: #1D1E22;
  --ink-soft: #1B1F22;

  --cream: #DBD2CD;
  --cream-light: #F5F3EF;

  --gray: #545452;
  --gray-light: #716D6C;

  --text-primary: #1D1E22;
  --text-secondary: #777472;

  --white: #FFFFFF;
}
```

------------------------------------------------------------------------

# 4. Color Ratio

A useful starting point for the application is:

``` text
Dark / Charcoal     35%
Warm Cream          40%
Muted Gray          20%
White / Accents      5%
```

The colors should not be distributed equally.

The application should feel predominantly neutral and monochromatic.

------------------------------------------------------------------------

# 5. Background

The primary background should not normally be pure black.

Recommended:

``` css
background: #545452;
```

Using a muted gray instead of pure black makes the interface softer and
creates the vintage/editorial atmosphere.

Avoid using:

``` css
background: #000000;
```

as the main background unless a particular section specifically requires
it.

------------------------------------------------------------------------

# 6. Card Design

Cards are one of the strongest characteristics of this design language.

## Main Card

Recommended:

``` css
background: #DBD2CD;
border-radius: 14px;
```

Characteristics:

-   Tall and narrow where appropriate
-   Rounded corners
-   Minimal or no visible borders
-   Strong contrast against the background
-   Poster-like composition
-   Large internal negative space

The card should feel more like a **modern magazine/poster panel** than a
standard SaaS card.

------------------------------------------------------------------------

# 7. Border Radius System

Use moderate rounded corners rather than extremely rounded containers.

``` text
Main Card             14–16px
Secondary Card        10–12px
Small Components       8–10px
Buttons               999px
Circular Elements     50%
```

Example:

``` css
.card {
  border-radius: 14px;
}

.small-card {
  border-radius: 10px;
}

.button {
  border-radius: 999px;
}
```

Avoid excessive values such as `32px` or `40px` for normal cards.

------------------------------------------------------------------------

# 8. Typography

Typography is a major part of the design.

The primary headings use:

-   Uppercase text
-   Bold weight
-   Tight line spacing
-   Slightly condensed visual appearance
-   Strong geometric letterforms

## Recommended Fonts

### Primary Recommendations

1.  **Poppins**
2.  **Manrope**
3.  **DM Sans**
4.  **Montserrat**
5.  **Archivo**

Recommended combination:

``` text
Headings: Poppins / Manrope
Body: Poppins / Manrope
Labels: Poppins / Manrope
```

------------------------------------------------------------------------

# 9. Typography Styles

## Hero Heading

``` css
font-size: 24px;
font-weight: 700;
line-height: 1.05;
letter-spacing: -0.03em;
text-transform: uppercase;
```

## Section Heading

``` css
font-size: 18px;
font-weight: 700;
```

## Card Label

``` css
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
```

## Body Text

``` css
font-size: 12px;
line-height: 1.45;
font-weight: 400;
```

## Micro Text

``` css
font-size: 8px;
```

Supporting information should remain relatively small so that headings
and illustrations dominate the composition.

------------------------------------------------------------------------

# 10. Illustration Style

The illustrations are the defining visual element.

## Characteristics

### Flat Vector

Use flat vector shapes instead of realistic rendering.

### Monochromatic

Primarily use:

``` text
#1D1E22
+
#DBD2CD
```

### Thick Outlines

Characters use strong dark outlines.

### Simplified Anatomy

The faces and bodies are deliberately simplified.

### No Realistic Shading

Avoid:

-   Photorealistic skin
-   Complex lighting
-   Detailed shadows
-   3D rendering
-   Realistic textures
-   Excessive gradients

The desired appearance is:

> **Simple hand-drawn vector characters with strong silhouettes and
> minimal facial details.**

------------------------------------------------------------------------

# 11. Character Design

The character design follows a consistent visual language.

## Head

-   Large
-   Rounded
-   Simple silhouette

## Eyes

-   Small or medium black circles
-   Minimal detail

## Nose

-   Simple curved line or tiny shape

## Mouth

-   Small curved line

## Hair

-   Large simplified silhouette
-   Strong dark mass
-   Rounded and organic shapes

## Body

-   Simple geometric torso
-   Minimal clothing details

## Clothing

Use simple outlines and shapes rather than detailed garments.

The goal is for the character to remain recognizable even at a small
size.

------------------------------------------------------------------------

# 12. AI Illustration Prompt

For generating illustrations that match the style:

> Minimalist flat vector editorial illustration, hand-drawn cartoon
> character, simplified facial features, thick dark charcoal outlines,
> monochromatic warm cream and charcoal palette, rounded geometric
> shapes, vintage magazine illustration, 1960s editorial cartoon
> aesthetic, no gradients, no realistic shading, clean negative space,
> playful character design.

For consistency across a complete application, maintain the same:

-   Stroke thickness
-   Color palette
-   Face proportions
-   Head proportions
-   Body proportions
-   Line style
-   Illustration complexity

------------------------------------------------------------------------

# 13. Three-Screen Composition

The reference design presents three different application states.

## Screen 1 --- Introduction / Onboarding

Structure:

``` text
┌──────────────────┐
│ Search           │
│                  │
│    Character     │
│                  │
│                  │
├──────────────────┤
│ WELCOME, LISA    │
│                  │
│ Description      │
│                  │
│             →    │
└──────────────────┘
```

Purpose:

-   Introduce the application
-   Establish the visual identity
-   Introduce the character
-   Give the user a clear first action

------------------------------------------------------------------------

# 14. Screen 2 --- Selection / Discovery

Structure:

``` text
┌──────────────────┐
│ Menu          ♡  │
│                  │
│ CHOOSE            │
│ HAIR STYLE        │
│                  │
│ ┌──────┐ ┌──────┐│
│ │  01  │ │  02  ││
│ │      │ │      ││
│ └──────┘ └──────┘│
│                  │
│ ┌──────┐ ┌──────┐│
│ │  03  │ │  04  ││
│ │      │ │      ││
│ └──────┘ └──────┘│
│                  │
│      MORE ↓      │
└──────────────────┘
```

Purpose:

-   Browse choices
-   Discover content
-   Make selection visually engaging
-   Keep information lightweight

------------------------------------------------------------------------

# 15. Screen 3 --- Detail / Recommendation

Structure:

``` text
┌──────────────────┐
│ ←                │
│                  │
│    Character     │
│                  │
├──────────────────┤
│ VOLUMINOUS       │
│ LAYERS           │
│                  │
│ ★★★★☆            │
│                  │
│ Description      │
│                  │
│ [ GET ... ]      │
└──────────────────┘
```

Purpose:

-   Show selected content
-   Provide additional information
-   Display rating or metadata
-   Provide the primary action

------------------------------------------------------------------------

# 16. UX Flow

The three screens establish a very effective flow:

``` text
DISCOVER
   ↓
SELECT
   ↓
VIEW DETAILS
   ↓
TAKE ACTION
```

This pattern can be adapted to many applications:

``` text
Dashboard
   ↓
Category
   ↓
Item
   ↓
Details / Action
```

------------------------------------------------------------------------

# 17. Navigation Icons

The icons are deliberately small and simple.

Examples:

-   Search
-   Menu
-   Heart
-   Bookmark
-   Back arrow
-   Chevron/down arrow

Recommended icon library:

**Lucide Icons**

Example:

``` jsx
import {
  Search,
  Menu,
  Heart,
  Bookmark,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
```

Use:

``` jsx
<Search size={16} strokeWidth={2} />
```

Recommended stroke:

``` text
1.5–2px
```

Avoid large, highly detailed, filled icons.

------------------------------------------------------------------------

# 18. Button Design

The primary CTA uses a pill-shaped button.

``` css
button {
  background: #F5F3EF;
  color: #1D1E22;

  border: none;
  border-radius: 999px;

  padding: 10px 22px;

  font-size: 8px;
  font-weight: 700;

  text-transform: uppercase;
}
```

The basic relationship is:

``` text
Dark Surface
      ↓
Cream Button
      ↓
Dark Text
```

This creates a strong but restrained contrast.

------------------------------------------------------------------------

# 19. Rating System

Ratings should remain monochromatic.

Recommended:

``` text
★★★★☆
```

instead of colorful emoji stars:

``` text
⭐⭐⭐⭐☆
```

Example:

``` css
.rating {
  color: #F5F3EF;
}
```

or use the dark ink color when displayed on a cream surface.

------------------------------------------------------------------------

# 20. Background Decoration

The background can contain subtle abstract shapes.

Recommended elements:

-   Large circles
-   Organic blobs
-   Oversized geometric forms
-   Soft overlapping shapes

Example:

``` css
.decor-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(219, 210, 205, 0.12);
}
```

Recommended opacity:

``` text
5–15%
```

These shapes should remain atmospheric rather than compete with the
content.

------------------------------------------------------------------------

# 21. Spacing System

Use an 8px-based spacing system.

``` text
4px
8px
12px
16px
24px
32px
48px
```

Example:

``` css
.container {
  padding: 16px;
}

.card {
  gap: 12px;
}
```

Avoid overcrowding.

Negative space is a fundamental part of the visual style.

------------------------------------------------------------------------

# 22. Negative Space

The UI intentionally leaves empty areas around illustrations and
typography.

Think:

> **Poster design rather than dashboard design.**

Instead of filling every area with:

-   text
-   buttons
-   statistics
-   icons
-   borders
-   cards

allow the interface to breathe.

This is one of the biggest contributors to the premium appearance.

------------------------------------------------------------------------

# 23. Shadows

The design relies more on surface contrast than heavy shadows.

Avoid:

``` css
box-shadow: 0 10px 30px rgba(0,0,0,.3);
```

If shadows are needed, keep them extremely subtle:

``` css
box-shadow: 0 4px 12px rgba(0,0,0,0.08);
```

Use shadows sparingly.

------------------------------------------------------------------------

# 24. What to Avoid

Do not mix this visual language with:

``` text
❌ Neon colors
❌ Strong gradients
❌ Glassmorphism
❌ Heavy drop shadows
❌ 3D icons
❌ Excessive realistic photography
❌ Rainbow accent colors
❌ Excessive borders
❌ Overly complex illustrations
❌ Excessive animations
❌ Dense dashboard layouts
```

Instead use:

``` text
✓ Flat illustrations
✓ Warm neutrals
✓ Thick outlines
✓ Rounded cards
✓ Bold typography
✓ Large negative space
✓ Tiny icons
✓ Editorial layouts
✓ Minimal animations
✓ Strong contrast
```

------------------------------------------------------------------------

# 25. Next.js + Tailwind Design Tokens

For a Next.js + Tailwind application, define the colors centrally.

Example:

``` css
@theme {
  --color-ink: #1D1E22;
  --color-ink-soft: #1B1F22;

  --color-cream: #DBD2CD;
  --color-cream-light: #F5F3EF;

  --color-gray: #545452;
  --color-gray-soft: #716D6C;

  --radius-card: 14px;
}
```

This allows the visual language to remain consistent across the
application.

------------------------------------------------------------------------

# 26. Component Architecture

Recommended component structure:

``` text
App
│
├── AppBackground
│
├── Navigation
│
├── IllustrationCard
│
├── CharacterIllustration
│
├── SectionHeading
│
├── StyleCard
│
├── Rating
│
├── Description
│
├── PrimaryButton
│
└── BottomNavigation
```

Suggested pages:

``` text
/
├── onboarding
├── styles
├── style/[id]
├── favorites
└── profile
```

------------------------------------------------------------------------

# 27. Example Selection Page

``` jsx
<main className="min-h-screen bg-gray p-5">

  <section className="rounded-[14px] bg-ink p-5">

    <header className="flex justify-between">
      <Menu />
      <Heart />
    </header>

    <h1 className="
      mt-8
      text-2xl
      font-bold
      uppercase
      tracking-tight
      text-cream-light
    ">
      Choose
      <br />
      Hair Style
    </h1>

    <div className="mt-6 grid grid-cols-2 gap-3">

      <StyleCard />
      <StyleCard />
      <StyleCard />
      <StyleCard />

    </div>

  </section>

</main>
```

------------------------------------------------------------------------

# 28. Example Style Card

``` jsx
<div className="
  aspect-[4/5]
  rounded-xl
  bg-cream
  p-3
">

  <span className="
    text-[8px]
    font-bold
    uppercase
    text-ink
  ">
    Voluminous Layers
  </span>

  <div className="
    flex
    h-full
    items-center
    justify-center
  ">
    <CharacterIllustration />
  </div>

</div>
```

------------------------------------------------------------------------

# 29. Illustration Assets

For a real application, do not generate the entire UI as one large
image.

Create individual reusable illustration assets.

Recommended structure:

``` text
illustrations/
│
├── character-01.svg
├── character-02.svg
├── character-03.svg
├── character-04.svg
│
├── hairstyle-01.svg
├── hairstyle-02.svg
└── hairstyle-03.svg
```

SVG is preferred because it provides:

-   Infinite scalability
-   Small file sizes
-   Crisp outlines
-   Easy recoloring
-   Consistent rendering
-   Easy integration with React

------------------------------------------------------------------------

# 30. Animation Style

The application can use subtle animation.

## Page Entrance

``` text
opacity: 0 → 1
y: 15px → 0
```

## Character

``` text
scale: 0.98 → 1
```

## Card Hover

``` text
translateY(-3px)
```

## Button Hover

``` text
scale(1.03)
```

The animation should feel calm and polished.

Avoid aggressive motion.

------------------------------------------------------------------------

# 31. Framer Motion Example

``` jsx
<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {/* Content */}
</motion.div>
```

For cards:

``` jsx
<motion.div
  whileHover={{
    y: -4,
    transition: { duration: 0.2 }
  }}
>
  {/* Card */}
</motion.div>
```

------------------------------------------------------------------------

# 32. Image Treatment

If photography is used, it should be treated so that it can coexist with
the illustrations.

Recommended process:

``` text
Original Photograph
        ↓
Desaturate
        ↓
Increase Contrast
        ↓
Apply Warm Tint
        ↓
Use Cream / Charcoal Surrounding Surface
```

Basic CSS:

``` css
img {
  filter:
    grayscale(100%)
    contrast(1.05);
}
```

Photography should not overpower the illustrated elements.

------------------------------------------------------------------------

# 33. Design Language Formula

The visual identity can be summarized as:

``` text
              ┌─────────────────────┐
              │   WARM NEUTRALS     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ FLAT ILLUSTRATIONS  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ BOLD TYPOGRAPHY     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ EDITORIAL LAYOUT    │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ GENEROUS SPACE      │
              └─────────────────────┘
```

------------------------------------------------------------------------

# 34. Complete Design Token Sheet

## Colors

``` text
Ink
#1D1E22

Ink Soft
#1B1F22

Cream
#DBD2CD

Cream Light
#F5F3EF

Gray
#545452

Gray Soft
#716D6C
```

## Typography

``` text
Font:
Poppins / Manrope / DM Sans

Heading:
700 Bold
Uppercase
Tight tracking

Body:
400 Regular

Labels:
700 Bold
Uppercase
```

## Shape

``` text
Main Card:
14px

Secondary Card:
10–12px

Button:
999px

Avatar:
50%
```

## Borders

``` text
Minimal borders
1px maximum
Prefer surface contrast over borders
```

## Shadows

``` text
Very subtle

0 4px 12px rgba(0,0,0,.08)
```

## Illustration

``` text
Flat vector
Monochrome
Thick outlines
Minimal facial features
Geometric forms
No gradients
No realistic shading
```

## Layout

``` text
Editorial
Asymmetric where appropriate
Large negative space
Poster-like composition
8px spacing system
```

## Icons

``` text
Lucide
1.5–2px stroke
Small
Minimal
```

## Motion

``` text
Subtle
200–500ms
Small translations
Fade + slide
No excessive effects
```

------------------------------------------------------------------------

# 35. Adapting the Style to Another Application

Do not copy the hair-styling application's information architecture
literally.

Instead, copy its **visual language**.

For another application, retain:

``` text
✓ Charcoal / cream color palette
✓ Flat illustrated assets
✓ Editorial card layouts
✓ Bold uppercase headings
✓ Rounded cards
✓ Pill-shaped buttons
✓ Minimal icons
✓ Large negative space
✓ Subtle animations
✓ Simple line illustrations
```

But replace the content, navigation, illustrations, and interaction
patterns with those appropriate to your application.

For example, a finance application could use illustrated financial
concepts instead of hairstyles, while retaining the same visual system.

------------------------------------------------------------------------

# 36. Final Visual Formula

For an application that strongly resembles this aesthetic, use:

``` text
#545452
        ↓
Muted gray background

#1D1E22
        ↓
Dark surfaces + illustrations + primary text

#DBD2CD
        ↓
Main cards and panels

#F5F3EF
        ↓
Buttons + highlights + light text

Poppins / Manrope
        ↓
Bold editorial typography

Flat SVG Illustrations
        ↓
Primary visual identity

14px Rounded Cards
        ↓
Soft modern structure

Pill Buttons
        ↓
Strong CTAs

Lucide Icons
        ↓
Minimal navigation

Large Negative Space
        ↓
Premium editorial appearance

Subtle Motion
        ↓
Modern interaction
```

## One-Sentence Style Definition

> **A warm monochromatic retro-editorial mobile UI combining flat
> hand-drawn vector illustrations, bold uppercase typography, charcoal
> surfaces, cream cards, rounded geometry, minimal icons, subtle motion,
> and generous negative space.**
