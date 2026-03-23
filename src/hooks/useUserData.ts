import { useState, useEffect, useCallback } from "react";
import { Block, BLOCKS, ClassType } from "@/lib/schedule";

export type LunchOverride = ClassType | "default";

export interface UserScheduleData {
  classType: ClassType;
  blockNames: Record<Block, string>;
  blockColors: Record<Block, string>;
  blockLunchOverrides: Record<Block, LunchOverride>;
  studentName: string;
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
    studentName: "",
    onboarded: false,
  };
}

export function useUserData() {
  const [data, setData] = useState<UserScheduleData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...getDefaults(), ...parsed };
      }
    } catch {
      // ignore
    }
    return getDefaults();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full
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

  const setStudentName = useCallback((studentName: string) => {
    setData((prev) => ({ ...prev, studentName }));
  }, []);

  const setOnboarded = useCallback((onboarded: boolean) => {
    setData((prev) => ({ ...prev, onboarded }));
  }, []);

  const resetAll = useCallback(() => {
    setData(getDefaults());
  }, []);

  return {
    data,
    updateBlockName,
    setClassType,
    setStudentName,
    setOnboarded,
    resetAll,
  };
}
