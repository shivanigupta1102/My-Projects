"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Package } from "lucide-react";
import { toast } from "sonner";
import { AttributeRow } from "@/components/product/AttributeRow";
import { ConflictResolver } from "@/components/product/ConflictResolver";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductHeaderMeta = {
  title: string;
  brand: string;
  image: string;
  status: string;
  completeness: number;
};

const FALLBACK_META: ProductHeaderMeta = {
  title: "Catalog product",
  brand: "Northwind",
  image: "https://picsum.photos/seed/pd/120/120",
  status: "REVIEW_READY",
  completeness: 82,
};

const productMeta: Record<string, ProductHeaderMeta> = {
  "prod-8842": {
    title: "AeroPress Clear Coffee Maker",
    brand: "AeroPress",
    image: "https://picsum.photos/seed/aphero/120/120",
    status: "REVIEW_READY",
    completeness: 88,
  },
};

export default function ProductTruthPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "prod-8842";
  const meta: ProductHeaderMeta = productMeta[id] ?? FALLBACK_META;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 md:flex-row md:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
          <Image src={meta.image} alt="" width={96} height={96} className="object-cover" unoptimized />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{meta.title}</h1>
            <Badge variant="warning">{meta.status.replace("_", " ")}</Badge>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">Brand · {meta.brand}</p>
          <div className="mt-3 max-w-sm">
            <div className="mb-1 flex justify-between text-xs text-foreground-muted">
              <span>Completeness</span>
              <span>{meta.completeness}%</span>
            </div>
            <Progress value={meta.completeness} className="h-2" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <Button
            variant="secondary"
            onClick={() => toast.success("Approved high-confidence fields (demo)")}
          >
            Approve all high-confidence
          </Button>
          <Button asChild>
            <Link href={`/products/${id}/channels`} className="gap-2">
              Generate channel packages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="attributes" className="space-y-4">
        <TabsList className="bg-surface">
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>

        <TabsContent value="attributes" className="space-y-4">
          <ScrollArea className="max-h-[720px] pr-2">
            <div className="space-y-3">
              <AttributeRow
                fieldName="Title"
                value={meta.title}
                confidence={0.95}
                method="LLM_INFERENCE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-title-1",
                    snippet: meta.title,
                    explanation: "Consensus from HERO image OCR and supplier title row.",
                    confidence: 0.95,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Brand"
                value={meta.brand}
                confidence={0.92}
                method="STRUCTURED_PARSE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-brand-1",
                    snippet: meta.brand,
                    explanation: "Parsed from structured vendor feed column brand_name.",
                    confidence: 0.92,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Color"
                value="Clear / Smoke Gray"
                confidence={0.78}
                method="IMAGE_VISION"
                requiresReview
                evidences={[
                  {
                    id: "e-col-1",
                    snippet: "Translucent gray tint on chamber",
                    explanation: "Vision model on packshot IMG_2044.jpg",
                    confidence: 0.81,
                  },
                  {
                    id: "e-col-2",
                    snippet: "Color: Slate",
                    explanation: "Supplier CSV row 12",
                    confidence: 0.64,
                  },
                ]}
                onApprove={() => toast.success("Color approved")}
                onOverride={() => undefined}
              />
              <ConflictResolver
                fieldName="Weight"
                candidates={[
                  {
                    id: "c1",
                    value: "6.4 oz",
                    sourceLabel: "Supplier PDF — shipping table",
                    confidence: 0.62,
                    evidences: [
                      {
                        id: "w1",
                        snippet: "Unit weight 6.4 oz",
                        explanation: "Extracted from PDF page 3 table.",
                        confidence: 0.62,
                      },
                    ],
                  },
                  {
                    id: "c2",
                    value: "7.1 oz",
                    sourceLabel: "Amazon prior listing scrape",
                    confidence: 0.58,
                    evidences: [
                      {
                        id: "w2",
                        snippet: "Item weight 7.1 ounces",
                        explanation: "Cached listing snapshot from URL_SCRAPE.",
                        confidence: 0.58,
                      },
                    ],
                  },
                ]}
                onResolve={() => toast.success("Conflict resolved (demo)")}
              />
              <AttributeRow
                fieldName="Material"
                value="Tritan copolyester, silicone seal"
                confidence={0.82}
                method="URL_SCRAPE"
                requiresReview
                evidences={[
                  {
                    id: "e-mat-1",
                    snippet: "BPA-free Tritan plastic",
                    explanation: "Product page materials section.",
                    confidence: 0.82,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Condition"
                value="New"
                confidence={0.99}
                method="SELLER_CONFIRMED"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-cond-1",
                    snippet: "New",
                    explanation: "Seller confirmed default for FBA inbound.",
                    confidence: 0.99,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="UPC"
                value="085255118926"
                confidence={0.95}
                method="STRUCTURED_PARSE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-upc-1",
                    snippet: "085255118926",
                    explanation: "Normalized from CSV GTIN column.",
                    confidence: 0.95,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Dimensions"
                value='3.1" × 3.1" × 5.2"'
                confidence={0.38}
                method="LLM_INFERENCE"
                requiresReview
                evidences={[
                  {
                    id: "e-dim-1",
                    snippet: null,
                    explanation: "Inferred from packaging image only — no ruler reference.",
                    confidence: 0.38,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Category"
                value={"Kitchen & Dining › Coffee Makers › Manual"}
                confidence={0.88}
                method="LLM_INFERENCE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-cat-1",
                    snippet: "Pour-over and press",
                    explanation: "Mapped to Amazon browse taxonomy via title + bullets.",
                    confidence: 0.88,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="MPN"
                value="AP-CLR-01"
                confidence={0.9}
                method="STRUCTURED_PARSE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-mpn-1",
                    snippet: "AP-CLR-01",
                    explanation: "Manufacturer part number from vendor XLSX.",
                    confidence: 0.9,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Capacity"
                value={"10 fl oz brewed (approx.)"}
                confidence={0.72}
                method="IMAGE_VISION"
                requiresReview
                evidences={[
                  {
                    id: "e-cap-1",
                    snippet: "Numbers on chamber marking",
                    explanation: "Read from graduated markings on side of chamber.",
                    confidence: 0.72,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Country of origin"
                value="USA"
                confidence={0.86}
                method="OCR"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-coo-1",
                    snippet: "Made in USA",
                    explanation: "OCR on packaging insert photo.",
                    confidence: 0.86,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Warranty"
                value={"1 year limited manufacturer warranty"}
                confidence={0.79}
                method="URL_SCRAPE"
                requiresReview
                evidences={[
                  {
                    id: "e-war-1",
                    snippet: "One year from purchase date",
                    explanation: "Support page warranty paragraph.",
                    confidence: 0.79,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
              <AttributeRow
                fieldName="Included components"
                value="Plunger, filter cap, stirrer, funnel, 350 filters"
                confidence={0.84}
                method="LLM_INFERENCE"
                requiresReview={false}
                evidences={[
                  {
                    id: "e-inc-1",
                    snippet: "350 microfilters included",
                    explanation: "Summarized from marketing PDF and hero image.",
                    confidence: 0.84,
                  },
                ]}
                onApprove={() => undefined}
                onOverride={() => undefined}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                id: "asset-1",
                label: "IMG_2044.jpg — Hero packshot",
                kind: "Image",
                notes: "Primary label legibility high; color temperature neutral.",
              },
              {
                id: "asset-2",
                label: "supplier_sheet.xlsx",
                kind: "Spreadsheet",
                notes: "Rows 10–40 contain GTIN, case pack, harmonized code.",
              },
              {
                id: "asset-3",
                label: "insert_scan.pdf — Page 2",
                kind: "PDF / OCR",
                notes: "Warranty and material callouts; OCR confidence 0.91 avg.",
              },
              {
                id: "asset-4",
                label: "https://brand.example/p/aeropress-clear",
                kind: "URL scrape",
                notes: "Bullets and description captured; schema.org Product parsed.",
              },
            ].map((a) => (
              <Card key={a.id} className="border-border bg-surface">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Package className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">{a.kind}</span>
                  </div>
                  <CardTitle className="text-base leading-snug">{a.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-muted">{a.notes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="variants">
          <div className="rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Attributes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">NW-2044-CLR</TableCell>
                  <TableCell>Clear — standard</TableCell>
                  <TableCell className="text-xs text-foreground-muted">
                    Color=Clear · Pack=Standard
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">NW-2044-CLR-350</TableCell>
                  <TableCell>Clear + extra filters</TableCell>
                  <TableCell className="text-xs text-foreground-muted">
                    Color=Clear · Pack=Filter bundle
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">NW-2044-ORG</TableCell>
                  <TableCell>Orange cap (limited)</TableCell>
                  <TableCell className="text-xs text-foreground-muted">
                    Color=Orange · Pack=Limited
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
