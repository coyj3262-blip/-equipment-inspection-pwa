/**
 * KMZ/KML Parser Service
 *
 * Parses KMZ files (zipped KML) and extracts KML data for Google Maps display
 */

import JSZip from "jszip";
import type { KmzData } from "../types/documents";

/**
 * Parse a KMZ file from a URL and extract KML content
 */
export async function parseKmzFromUrl(url: string): Promise<KmzData> {
  try {
    // Fetch the KMZ file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch KMZ file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return parseKmzFromArrayBuffer(arrayBuffer);
  } catch (err) {
    console.error("Failed to parse KMZ from URL:", err);
    throw new Error(`Failed to parse KMZ file: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Parse a KMZ file from an ArrayBuffer
 */
export async function parseKmzFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<KmzData> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find the main KML file (usually doc.kml or the first .kml file)
    let kmlFile = zip.file("doc.kml") || zip.file("Doc.kml");

    if (!kmlFile) {
      // Find any .kml file
      const kmlFiles = Object.keys(zip.files).filter((name) => name.toLowerCase().endsWith(".kml"));
      if (kmlFiles.length === 0) {
        throw new Error("No KML file found in KMZ archive");
      }
      kmlFile = zip.file(kmlFiles[0]);
    }

    if (!kmlFile) {
      throw new Error("Could not access KML file");
    }

    // Extract KML content as text
    const kmlText = await kmlFile.async("text");

    // Parse basic metadata from KML
    const name = extractKmlName(kmlText);
    const description = extractKmlDescription(kmlText);

    return {
      kml: kmlText,
      name: name || "Untitled",
      description
    };
  } catch (err) {
    console.error("Failed to parse KMZ:", err);
    throw new Error(`Failed to parse KMZ file: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

/**
 * Parse a KML file (non-zipped) from text
 */
export function parseKmlFromText(kmlText: string): KmzData {
  const name = extractKmlName(kmlText);
  const description = extractKmlDescription(kmlText);

  return {
    kml: kmlText,
    name: name || "Untitled",
    description
  };
}

/**
 * Extract name from KML XML
 */
function extractKmlName(kmlText: string): string | undefined {
  const nameMatch = kmlText.match(/<name>(.*?)<\/name>/);
  return nameMatch ? nameMatch[1].trim() : undefined;
}

/**
 * Extract description from KML XML
 */
function extractKmlDescription(kmlText: string): string | undefined {
  const descMatch = kmlText.match(/<description>(.*?)<\/description>/s);
  return descMatch ? descMatch[1].trim() : undefined;
}

/**
 * Convert KML data to a data URI for Google Maps KmlLayer
 */
export function kmlToDataUri(kmlText: string): string {
  const encoded = encodeURIComponent(kmlText);
  return `data:application/vnd.google-earth.kml+xml,${encoded}`;
}

/**
 * Check if a file is a KMZ file (by extension)
 */
export function isKmzFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".kmz");
}

/**
 * Check if a file is a KML file (by extension)
 */
export function isKmlFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".kml");
}
