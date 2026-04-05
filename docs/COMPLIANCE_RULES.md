# Compliance Rules Catalog

Per-channel compliance rule reference for ListingPilot AI v2.

## Overview

Compliance checks run automatically before publishing. Rules are categorized by severity:

- **BLOCKING** — Hard stops. Must be resolved before publish.
- **ERROR** — Significant issues. Publish allowed with degraded quality score.
- **WARNING** — Advisory. Publish allowed, but improvements recommended.
- **INFO** — Informational notes.

---

## Amazon (12 rules)

| Rule ID | Severity | Field | Description | Auto-fix |
|---------|----------|-------|-------------|----------|
| `AMAZON_GTIN_REQUIRED` | BLOCKING | gtin | Valid GTIN required unless category is GTIN-exempt | No |
| `AMAZON_MAIN_IMAGE_BACKGROUND` | BLOCKING | images[0] | Main image must have pure white (#FFFFFF) background | Yes |
| `AMAZON_PROHIBITED_TERMS` | BLOCKING | title, bullets | Must not contain promotional terms (best seller, #1, guaranteed, free shipping, etc.) | Yes |
| `AMAZON_TITLE_BYTE_LIMIT` | ERROR | title | Title must not exceed 200 UTF-8 bytes | Yes |
| `AMAZON_BULLET_COUNT` | WARNING | bullets | Fewer than 3 bullets hurts conversion | No |
| `AMAZON_BACKEND_KEYWORD_OVERLAP` | WARNING | backendKeywords | Backend keywords should not duplicate title words | Yes |
| `AMAZON_BRAND_REGISTRY` | INFO | brand | Brand Registry enrollment preferred for enhanced content | No |
| `AMAZON_IMAGE_RESOLUTION` | BLOCKING | images[0] | Main image must be at least 1000px on shortest side | No |
| `AMAZON_CONDITION_REQUIRED` | BLOCKING | condition | Item condition must be specified | No |
| `AMAZON_VARIATION_THEME` | WARNING | variations | Variation theme should match category standard | No |
| `AMAZON_DESCRIPTION_HTML` | WARNING | description | Description should use HTML formatting | Yes |
| `AMAZON_IMAGE_TEXT_WATERMARK` | BLOCKING | images | Images must not contain text overlays or watermarks | No |

### GTIN Exemption Categories
Some Amazon categories do not require GTINs:
- Handmade items
- Private label products (with Brand Registry)
- Certain media categories
- Bundled products created by the seller

### Policy Sources
- [Product Image Requirements](https://sellercentral.amazon.com/help/hub/reference/G1881)
- [Product Title Requirements](https://sellercentral.amazon.com/help/hub/reference/G200390640)
- [GTIN Requirements](https://sellercentral.amazon.com/help/hub/reference/G200317470)

---

## eBay (8 rules)

| Rule ID | Severity | Field | Description | Auto-fix |
|---------|----------|-------|-------------|----------|
| `EBAY_ITEM_SPECIFICS_REQUIRED` | BLOCKING | itemSpecifics | Required item specifics for the mapped category must be filled | No |
| `EBAY_TITLE_CHAR_LIMIT` | BLOCKING | title | Title must not exceed 80 characters | Yes |
| `EBAY_CONDITION_REQUIRED` | BLOCKING | condition | Item condition must be specified with valid condition ID | No |
| `EBAY_SHIPPING_POLICY` | BLOCKING | shippingPolicy | Shipping policy must be defined | No |
| `EBAY_RETURN_POLICY` | BLOCKING | returnPolicy | Return policy must be defined | No |
| `EBAY_CATEGORY_REQUIRED` | BLOCKING | categoryId | Valid eBay category ID must be mapped | No |
| `EBAY_IMAGE_RESOLUTION` | WARNING | images | Images should be at least 500px | No |
| `EBAY_GTIN_RECOMMENDED` | INFO | gtin | GTIN improves search discoverability | No |

### Item Specifics
eBay item specifics are pulled per-category from the eBay Taxonomy API. Required specifics vary by category. ListingPilot cross-references extracted attributes against required specifics and flags gaps.

---

## Etsy (8 rules)

| Rule ID | Severity | Field | Description | Auto-fix |
|---------|----------|-------|-------------|----------|
| `ETSY_TAG_COUNT_EXACT` | BLOCKING | tags | Etsy requires exactly 13 tags | Yes |
| `ETSY_AI_DISCLOSURE_REQUIRED` | BLOCKING | description | AI-generated content must include disclosure | Yes |
| `ETSY_TAG_CHAR_LIMIT` | ERROR | tags | Each tag must not exceed 20 characters | Yes |
| `ETSY_TITLE_LIMIT` | BLOCKING | title | Title must not exceed 140 characters | Yes |
| `ETSY_WHO_MADE_REQUIRED` | BLOCKING | who_made | who_made field is required | No |
| `ETSY_WHEN_MADE_REQUIRED` | BLOCKING | when_made | when_made field is required | No |
| `ETSY_IMAGE_COUNT` | WARNING | images | Using all 10 image slots improves conversion | No |
| `ETSY_PROHIBITED_CATEGORY` | BLOCKING | category | Product falls in prohibited category | No |

### AI Disclosure
When any attribute was extracted via LLM with no source evidence, Etsy requires disclosure. ListingPilot auto-appends: *"This listing description was created with the assistance of AI tools. All product details have been verified by the seller."*

---

## Shopify (6 rules)

| Rule ID | Severity | Field | Description | Auto-fix |
|---------|----------|-------|-------------|----------|
| `SHOPIFY_TITLE_LIMIT` | BLOCKING | title | Title must not exceed 255 characters | Yes |
| `SHOPIFY_SEO_TITLE_LIMIT` | WARNING | seoTitle | SEO title should be under 70 characters | Yes |
| `SHOPIFY_SEO_DESCRIPTION_LIMIT` | WARNING | seoDescription | SEO description should be under 160 characters | Yes |
| `SHOPIFY_VARIANT_LIMIT` | BLOCKING | variants | Product cannot exceed 100 variants | No |
| `SHOPIFY_DESCRIPTION_FORMAT` | WARNING | description | Description should be valid HTML | Yes |
| `SHOPIFY_IMAGE_REQUIRED` | WARNING | images | At least one product image recommended | No |

---

## Walmart (9 rules)

| Rule ID | Severity | Field | Description | Auto-fix |
|---------|----------|-------|-------------|----------|
| `WALMART_GTIN_REQUIRED` | BLOCKING | gtin | Valid GTIN required for all listings | No |
| `WALMART_SUPPLIER_ID_REQUIRED` | BLOCKING | supplierId | Supplier ID required | No |
| `WALMART_CONTENT_SCORE` | WARNING | _contentScore | Content score should be at least 90 | No |
| `WALMART_TITLE_LIMIT` | BLOCKING | title | Title must not exceed 200 characters | Yes |
| `WALMART_IMAGE_BACKGROUND` | BLOCKING | images[0] | Main image must have pure white background | Yes |
| `WALMART_IMAGE_RESOLUTION` | BLOCKING | images[0] | Main image must be at least 1000px | No |
| `WALMART_REQUIRED_ATTRIBUTES` | ERROR | attributes | Brand, manufacturer, model, color, size, material required | No |
| `WALMART_BULLET_COUNT` | WARNING | bullets | At least 3 bullet points recommended | No |
| `WALMART_DESCRIPTION_LENGTH` | WARNING | description | Description should be at least 150 words | No |

---

## Quality Score (7 factors)

| Factor | Weight | Description |
|--------|--------|-------------|
| Required field completeness | 25% | All required fields for channel are filled |
| Category accuracy | 20% | Confidence score of category mapping |
| Image compliance score | 20% | Weighted average across all images |
| Attribute richness | 15% | Number of filled vs available attributes |
| Title quality | 10% | Keyword density, clarity, format |
| Policy risk penalty | up to -20% | Deducted for unresolved BLOCKING issues |
| Safety-critical field review | 10% | Seller-confirmed safety fields |
