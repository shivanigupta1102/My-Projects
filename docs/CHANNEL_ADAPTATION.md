# Channel Adaptation Guide

How ListingPilot AI adapts canonical product data for each marketplace.

## Philosophy

Each marketplace has different search algorithms, buyer psychology, and policy requirements. A single "template" approach fails because:

- Amazon rewards keyword-dense titles; Etsy penalizes them
- eBay titles max at 80 chars; Amazon allows 200 bytes
- Etsy requires exactly 13 tags; other channels have no such rule
- Shopify uses HTML descriptions; Amazon uses plain text with limited HTML
- Walmart requires specific content score optimization

ListingPilot generates **per-channel adapted listings** from a single canonical product record.

## Adaptation by Channel

### Amazon
- **Title**: Keyword-stuffed, respecting 200-byte UTF-8 limit. Brand first, then key attributes and model.
- **Bullets**: Exactly 5, starting with capital letter, no trailing period, benefit-led.
- **Backend Keywords**: Non-overlapping with title words, within 250-byte limit.
- **Description**: Wrapped in `<p>` HTML tags.
- **GTIN**: Included, mapped to `externally_assigned` or `brand_assigned`.
- **Example before/after**:
  - Canonical: `Sony WH-1000XM5 Wireless Headphones`
  - Amazon: `Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones with Auto NC Optimizer, Crystal Sound, Up to 30-Hour Battery Life – Black`

### eBay
- **Title**: Frontloaded with highest-search-volume terms, max 80 characters. Brand-first formatting.
- **Item Specifics**: Populated from category requirements via eBay Taxonomy API.
- **Condition**: Mapped to eBay condition ID system.
- **Description vs ShortDescription**: Split based on content length.
- **Example before/after**:
  - Canonical: `Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones with Multipoint Bluetooth`
  - eBay: `Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Headphones Black`

### Etsy
- **Title**: Natural language (Etsy penalizes keyword-stuffed titles), max 140 characters.
- **Tags**: Exactly 13 tags generated with SEO scoring, each under 20 characters.
- **AI Disclosure**: Appended to description if any content was AI-generated.
- **Variation Structure**: Normalized to ≤2 types (Etsy's maximum).
- **Fields**: `who_made`, `when_made`, `is_supply` derived from extraction.
- **Example before/after**:
  - Canonical: `Sony WH-1000XM5 Wireless Headphones`
  - Etsy: `Premium Wireless Noise Canceling Headphones by Sony - Over Ear - Black`

### Shopify
- **Description**: HTML with semantic structure (`<div>`, `<ul>`, `<li>`).
- **Metafields**: Populated with extracted product data.
- **SEO Title**: Separate field, optimized for 70-character limit.
- **SEO Description**: Separate field, optimized for 160-character limit.
- **Sales Channels**: Configurable publishing targets (online_store, POS, Google, Facebook).
- **Example before/after**:
  - Canonical: `Sony WH-1000XM5 Wireless Headphones`
  - Shopify: Same title (natural language), but with rich HTML description and SEO metadata

### Walmart
- **Title**: Content score optimized, max 200 characters.
- **Bullets**: Up to 10, formatted per Walmart style guide.
- **Required Attributes**: Brand, manufacturer, model, color, size, material checked.
- **Content Score**: Target ≥90 for optimal visibility.
- **Example before/after**:
  - Canonical: `Sony WH-1000XM5 Wireless Headphones`
  - Walmart: `Sony WH-1000XM5 Wireless Noise Canceling Over-Ear Bluetooth Headphones, Black`

## Adaptation Log

Every channel listing includes an `adaptationNotes` field documenting what changed from canonical and why:

```
3 changes from canonical:
· Title reordered for keyword density
· "XM5" expanded to full model name per Amazon SEO
· 2 prohibited terms removed ("best seller", "#1")
```

This log appears in the listing preview UI for operator transparency.

## Confidence and Safety

Adapted values inherit the confidence and evidence chain from the canonical product. Safety-critical fields (weight, voltage, certifications) are never modified during adaptation — they pass through verbatim or are omitted if unverified.
