import { useState, useEffect, useCallback } from "react";
import { Block, BLOCKS, ClassType } from "@/lib/schedule";

export type LunchOverride = ClassType | "default";

export interface UserScheduleData {
  classType: ClassType;
  blockNames: Record<Block, string>;
  blockColors: Record<Block, string>;
  blockLunchOverrides: Record<Block, LunchOverride>;
  onboarded: boolean;
}

const STORAGE_KEY = "brunswick-schedule-data";

const BLOCK_COLOR_DEFAULTS: Record<Block, string> = {
  A: "hsl(20, 40%, 28%)",
  B: "hsl(25, 50%, 38%)",
  C: "hsl(35, 55%, 45%)",
  D: "hsl(30, 35%, 32%)",
  E: "hsl(15, 45%, 35%)",
  F: "hsl(28, 42%, 42%)",
  G: "hsl(22, 38%, 30%)",
};

function getDefaults(): UserScheduleData {
  return {
    classType: "underclassman",
    blockNames: Object.fromEntries(BLOCKS.map((b) => [b, ""])) as Record<Block, string>,
    blockColors: { ...BLOCK_COLOR_DEFAULTS },
    blockLunchOverrides: Object.fromEntries(BLOCKS.map((b) => [b, "default"])) as Record<Block, LunchOverride>,
    onboarded: false,
  };
}

function restoreData(value: unknown): UserScheduleData {
  const defaults = getDefaults();
  if (!value || typeof value !== "object") return defaults;
  const stored = value as Partial<UserScheduleData>;
  const classType = stored.classType === "upperclassman" ? "upperclassman" : "underclassman";
  const blockNames = stored.blockNames && typeof stored.blockNames === "object" ? stored.blockNames : {};
  const blockLunchOverrides = stored.blockLunchOverrides && typeof stored.blockLunchOverrides === "object"
    ? stored.blockLunchOverrides
    : {};

  return {
    ...defaults,
    classType,
    onboarded: stored.onboarded === true,
    blockNames: Object.fromEntries(BLOCKS.map((block) => [
      block,
      typeof blockNames[block] === "string" ? blockNames[block] : "",
    ])) as Record<Block, string>,
    blockLunchOverrides: Object.fromEntries(BLOCKS.map((block) => {
      const override = blockLunchOverrides[block];
      return [block, override === "underclassman" || override === "upperclassman" ? override : "default"];
    })) as Record<Block, LunchOverride>,
  };
}

export function useUserData() {
  const [data, setData] = useState<UserScheduleData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return restoreData(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Saved schedule data could not be restored.", error);
    }
    return getDefaults();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Schedule changes could not be saved on this device.", error);
    }
  }, [data]);

  const updateBlockName = useCallback((block: Block, name: string) => {
    setData((prev) => ({
      ...prev,
      blockNames: { ...prev.blockNames, [block]: name },
    }));
  }, []);

  const setClassType = useCallback((classType: ClassType) => {
    setData((prev) => ({ ...prev, classType }));
  }, []);


  const setOnboarded = useCallback((onboarded: boolean) => {
    setData((prev) => ({ ...prev, onboarded }));
  }, []);

  const setBlockLunchOverride = useCallback((block: Block, override: LunchOverride) => {
    setData((prev) => ({
      ...prev,
      blockLunchOverrides: { ...prev.blockLunchOverrides, [block]: override },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData(getDefaults());
  }, []);

  return {
    data,
    updateBlockName,
    setClassType,
    
    setOnboarded,
    setBlockLunchOverride,
    resetAll,
  };
}
