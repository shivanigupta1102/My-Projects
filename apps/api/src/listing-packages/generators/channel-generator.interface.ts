import { Channel } from '@prisma/client';

export interface CanonicalFacts {
  title: string | null;
  brand: string | null;
  bullets: string[];
  description: string | null;
  attributes: Record<string, unknown>;
  keywords: string[];
  images: { url: string; role: string; order: number }[];
}

export interface GeneratedChannelPackage {
  channel: Channel;
  title: string;
  bullets: string[];
  description: string | null;
  attributes: Record<string, unknown>;
  keywords: string[];
  images: { url: string; role: string; order: number }[];
}

export interface ChannelGenerator {
  readonly channel: Channel;
  generate(facts: CanonicalFacts): Promise<GeneratedChannelPackage>;
}
