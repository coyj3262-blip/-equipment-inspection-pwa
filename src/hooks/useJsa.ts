import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "../firebase";
import { path } from "../backend.paths";
import type { Jsa, JsaSignature, SopDocument } from "../services/jsa";

export type JsaSignatureMap = Record<string, Record<string, JsaSignature>>;

type RawJsa = Omit<Jsa, "id" | "sopDocs"> & {
  sopDocs?: Record<string, SopDocument> | null;
};

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeJsa(id: string, data: RawJsa): Jsa {
  const createdAt = data.createdAt;
  const updatedAt = data.updatedAt ?? createdAt;
  const archivedAt = data.archivedAt ?? null;
  const status = data.status ?? "active";
  const effectiveDate = data.effectiveDate ?? new Date(createdAt).toISOString().slice(0, 10);

  const sopDocsObject = data.sopDocs ?? null;
  const sopDocs: SopDocument[] | undefined = sopDocsObject
    ? Object.entries(sopDocsObject)
        .map(([docId, doc]) => ({ ...doc, id: docId }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt)
    : undefined;

  return {
    ...data,
    sopDocs,
    id,
    createdAt,
    updatedAt,
    archivedAt,
    status,
    effectiveDate,
  };
}

export function useJsaData(siteId?: string | null) {
  const [jsas, setJsas] = useState<Jsa[]>([]);
  const [signaturesByJsa, setSignaturesByJsa] = useState<JsaSignatureMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jsasRef = ref(rtdb, path("jsas"));
    const unsubscribe = onValue(jsasRef, (snapshot) => {
      const val = snapshot.val() as Record<string, RawJsa> | null;
      if (!val) {
        setJsas([]);
        setLoading(false);
        return;
      }
      let entries: Jsa[] = Object.entries(val).map(([id, raw]) => normalizeJsa(id, raw));

      // Filter by site if provided
      if (siteId) {
        entries = entries.filter(jsa => jsa.siteId === siteId);
      }

      entries.sort((a, b) => b.createdAt - a.createdAt);
      setJsas(entries);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [siteId]);

  useEffect(() => {
    const sigRef = ref(rtdb, path("jsaSignatures"));
    const unsubscribe = onValue(sigRef, (snapshot) => {
      const val = snapshot.val() as JsaSignatureMap | null;
      setSignaturesByJsa(val ?? {});
    });
    return () => unsubscribe();
  }, []);

  const { activeJsas, archivedJsas, recentArchivedJsas, stats } = useMemo(() => {
    const active = jsas.filter(jsa => jsa.status === "active");
    const archived = jsas.filter(jsa => jsa.status === "archived");
    const now = Date.now();
    const recentArchived = archived.filter(jsa => {
      const reference = jsa.archivedAt ?? jsa.updatedAt ?? jsa.createdAt;
      return now - reference <= WEEK_IN_MS;
    });

    return {
      activeJsas: active,
      archivedJsas: archived,
      recentArchivedJsas: recentArchived,
      stats: {
        total: jsas.length,
        active: active.length,
        archived: archived.length,
      },
    };
  }, [jsas]);

  return { jsas, activeJsas, archivedJsas, recentArchivedJsas, signaturesByJsa, loading, stats };
}
