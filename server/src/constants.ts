export const FIC_STATUSES = ["ONGOING", "COMPLETE"] as const;
export type FicStatus = (typeof FIC_STATUSES)[number];

export const TAG_CATEGORIES = ["TROPE", "WARNING", "SPICE", "OTHER"] as const;
export type TagCategory = (typeof TAG_CATEGORIES)[number];

export const READ_TYPES = ["FIRST_READ", "REREAD"] as const;
export type ReadType = (typeof READ_TYPES)[number];

export const READ_STATUSES = ["READING", "FINISHED", "WANT_TO_READ", "DNF"] as const;
export type ReadStatus = (typeof READ_STATUSES)[number];
