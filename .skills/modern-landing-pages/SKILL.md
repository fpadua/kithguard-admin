---
name: modern-landing-pages
description: Build, redesign, critique, or refine modern marketing landing pages, homepages, product launch pages, waitlist pages, SaaS pages, campaign pages, and conversion-focused one-page websites. Use when Codex needs to create or improve frontend landing-page UX, responsive layout, hero sections, conversion copy, visual hierarchy, trust/proof sections, CTA flows, pricing/FAQ sections, or visual QA for polished web pages.
---

# Modern Landing Pages

## Overview

Create landing pages that feel current, specific, and conversion-ready without becoming generic template art. Favor a usable first screen, strong offer clarity, realistic visuals, responsive behavior, and ruthless visual QA.

## Workflow

1. Establish the job of the page: audience, offer, conversion action, proof available, brand constraints, and technology stack. If the prompt is vague, infer a sensible direction from existing files and make the page easy to customize.
2. Inspect the codebase before designing. Reuse the existing framework, routes, components, tokens, fonts, icons, and build scripts where they exist.
3. Define the page narrative before editing: hero, proof, value, product or experience reveal, feature depth, objection handling, and final CTA. Use only sections that serve the offer.
4. Implement the page as the actual first screen, not a marketing explanation about the app. Keep the primary conversion action visible early and repeated after proof or pricing.
5. Use real or generated bitmap visuals when visual inspection matters. Prefer product screenshots, venue/product/person imagery, UI mockups, or domain-specific art over abstract SVG decoration.
6. Validate at desktop and mobile sizes. Run the app when needed, capture screenshots when available, and fix overlap, cramped text, broken assets, poor contrast, dead links, and awkward first-viewport composition.

## Design Rules

- Make the hero specific: the H1 should usually be the product, brand, category, or literal offer. Put value props in supporting copy.
- Show the thing being sold or promised in the first viewport whenever possible: product UI, object, place, before/after, workflow, or outcome.
- Leave a hint of the next section visible on common desktop and mobile viewports so the page feels scrollable and composed.
- Use restrained, confident density. SaaS and operational products should feel organized and scannable; consumer, editorial, or event pages can be more expressive.
- Avoid generic one-note palettes, oversized empty hero copy, floating decorative cards, gradient-orb backgrounds, stock-like blurred imagery, and section cards nested inside other cards.
- Keep cards for repeated items, pricing plans, testimonials, modals, or framed tools. Page sections should usually be full-width bands or unframed layouts with constrained inner content.
- Use familiar icons from the existing icon library for compact controls or feature cues. Do not hand-draw icon systems unless the repo already does.
- Reserve hero-scale type for true hero content. Keep panel, card, navbar, and form typography compact and stable.
- Use stable responsive dimensions for media, tiles, logos, cards, and CTA groups to prevent layout shift.
- Ensure button labels, long words, and headings fit on small screens. Wrap or shorten copy before shrinking everything.

## Copy Rules

- Write clear, concrete copy. Prefer what the user gets, for whom, and why now over vague excellence claims.
- Make CTAs action-oriented and specific: "Start free", "Book a demo", "Join the waitlist", "View plans", or the equivalent for the offer.
- Use proof where available: customer logos, metrics, screenshots, security badges, quotes, ratings, integrations, case-study snippets, or product facts.
- Avoid visible instructional text about the page itself, design choices, keyboard shortcuts, or implementation details.

## Section Patterns

- SaaS: hero with product UI, logo strip, pain-to-outcome blocks, feature workflow, integrations, pricing or demo CTA, FAQ.
- Product launch: hero with product shot, announcement proof, benefit clusters, use cases, comparison or specs, preorder/signup CTA.
- Local venue or service: hero with real place/person/service imagery, immediate booking/contact CTA, trust signals, service menu, location, reviews.
- Portfolio or personal brand: name as first-viewport signal, editorial hero image or work sample, selected work, credibility, contact CTA.
- Waitlist: concise hero, product promise, social proof or founder note, low-friction form, privacy reassurance, compact FAQ.

## Reference

Read `references/quality-bar.md` when implementing, redesigning, or auditing a real page. It contains the detailed landing-page checklist, common section recipes, and visual QA pass.

## Verification

Before finishing substantial work, check:
- The page builds or serves successfully.
- Desktop and mobile layouts have no incoherent overlap, clipped text, broken media, or accidental horizontal scroll.
- The first viewport communicates the offer, shows a meaningful visual, contains a clear CTA, and hints at the next section.
- Forms, navigation, CTAs, and anchor links work.
- The final response names what changed and how it was verified.
