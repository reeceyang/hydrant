import { Link } from "@chakra-ui/react";
// @ts-ignore
import Msgpack from "msgpack-lite";

import { Activity } from "./activity";
import { Firehose } from "./firehose";

//========================================================================
// Class utilities:

/**
 * This regex matches a class number like 6.042J or 21W.THU. The groups are
 * courseDigits ("6", "21"), courseLetters ("", "W"), and classNumber ("042J",
 * "THU").
 */
const CLASS_REGEX = new RegExp(
  [
    "^",
    "(?<courseDigits>[0-9]*)",
    "(?<courseLetters>[A-Z]*)",
    "\\.",
    "(?<classNumber>[0-9A-Z]*)",
    "$",
  ].join("")
);

/** Three-way comparison for class numbers. */
export function classSort(a: string, b: string) {
  const aGroups = a.match(CLASS_REGEX)?.groups;
  const bGroups = b.match(CLASS_REGEX)?.groups;
  if (!aGroups || !bGroups) return 0;
  const aCourseNumber = Number(aGroups.courseDigits || "Infinity");
  const bCourseNumber = Number(bGroups.courseDigits || "Infinity");
  if (aCourseNumber > bCourseNumber) return 1;
  if (aCourseNumber < bCourseNumber) return -1;
  if (aGroups.courseLetters > bGroups.courseLetters) return 1;
  if (aGroups.courseLetters < bGroups.courseLetters) return -1;
  if (aGroups.classNumber > bGroups.classNumber) return 1;
  if (aGroups.classNumber < bGroups.classNumber) return -1;
  return 0;
}

/** Turn a string lowercase and keep only alphanumeric characters. */
export function simplifyString(s: string): string {
  return s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

/**
 * Smart class number matching. Case-insensitive. Punctuation-insensitive when
 * the searchString has no punctuation, but cares otherwise.
 */
export function classNumberMatch(
  searchString: string,
  classNumber: string,
  exact: boolean = false
): boolean {
  const process = (s: string) =>
    searchString.includes(".") ? s.toLowerCase() : simplifyString(s);
  const compare = (a: string, b: string) => (exact ? a === b : a.includes(b));
  return compare(process(classNumber), process(searchString));
}

//========================================================================
// Date utilities:
// TODO: rename these

/**
 * Converts a slot number (as in {@link Timeslot}) to a date in the week of
 * 2001-01-01, which is the week the calendar shows.
 */
export function toDate(slot: number): Date {
  const day = Math.floor(slot / 30) + 1;
  const hour = Math.floor((slot % 30) / 2) + 8;
  const minute = (slot % 2) * 30;
  return new Date(2001, 0, day, hour, minute);
}

/** Converts date (within 8 AM to 9 PM) to a slot number. */
export function toSlot(date: Date): number {
  return (
    30 * (date.getDay() - 1) +
    2 * (date.getHours() - 8) +
    Math.floor(date.getMinutes() / 30)
  );
}

/** Strings for each weekday. */
export const WEEKDAY_STRINGS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** See {@link TIMESLOT_STRINGS}. */
function generateTimeslotStrings(): Array<string> {
  const res = [];
  for (let i = 8; i <= 11; i++) {
    res.push(`${i}:00 AM`);
    res.push(`${i}:30 AM`);
  }
  res.push("12:00 PM");
  res.push("12:30 PM");
  for (let i = 1; i <= 9; i++) {
    res.push(`${i}:00 PM`);
    res.push(`${i}:30 PM`);
  }
  res.push(`10:00 PM`);
  return res;
}

/** Strings for each slot number, in order. */
export const TIMESLOT_STRINGS = generateTimeslotStrings();

/** Convert a slot number to a day string. */
export function slotToDayString(slot: number): string {
  return WEEKDAY_STRINGS[Math.floor(slot / 30)]!;
}

/** Convert a slot number to a time string. */
export function slotToTimeString(slot: number): string {
  return TIMESLOT_STRINGS[slot % 30]!;
}

/** Converts a day and time stirng to a slot number. */
export function dayStringToSlot(day: string, time: string): number {
  return 30 * WEEKDAY_STRINGS.indexOf(day) + TIMESLOT_STRINGS.indexOf(time);
}

//========================================================================
// Color utilities:

/** The possible color schemes. */
export const ColorScheme = {
  Light: "Light",
  Dark: "Dark",
  Classic: "Classic",
  ClassicDark: "Classic Dark"
} as const;

/** The type of {@link ColorScheme}. */
export type TColorScheme = typeof ColorScheme[keyof typeof ColorScheme];

/** The set of activity background colors for a color scheme. */
const BACKGROUND_COLORS = {
  [ColorScheme.Light]: [
    "#D32F2F",
    "#2E7D32",
    "#1565C0",
    "#BF360C",
    "#00838f",
    "#AD1457",
    "#827717",
    "#795548",
  ],
  [ColorScheme.Dark]: [
    "#D47777",
    "#7BC77F",
    "#8AA3BF",
    "#E68E73",
    "#9BC6C9",
    "#CC9DB1",
    "#F5EA87",
    "#DE9D85",
  ],
  [ColorScheme.Classic]: [
    "#23AF83",
    "#3E9ED1",
    "#AE7CB4",
    "#DE676F",
    "#E4793C",
    "#D7AD00",
    "#33AE60",
    "#F08E94",
    "#8FBDD9",
    "#A2ACB0",
  ],
  [ColorScheme.ClassicDark]: [
    "#36C0A5",
    "#5EBEF1",
    "#CE9CD4",
    "#EA636B",
    "#FF995C",
    "#F7CD20",
    "#47CE80",
    "#FFAEB4",
    "#AFDDF9",
    "#C2CCD0",
  ],
} as const;

/** Whether a color scheme is UI light or UI dark. */
export function colorModeFor(colorScheme: TColorScheme): "light" | "dark" {
  switch (colorScheme) {
    case ColorScheme.Light: return 'light';
    case ColorScheme.Dark: return 'dark';
    case ColorScheme.Classic: return 'light';
    case ColorScheme.ClassicDark: return 'dark';
  }
}

/** The default background color for a color scheme. */
export function fallbackColor(colorScheme: TColorScheme): string {
  return colorModeFor(colorScheme) === 'light' ? '#4A5568' : '#CBD5E0';
}

/** MurmurHash3, seeded with a string. */
function murmur3(str: string): () => number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

/**
 * Assign background colors to a list of activities. Mutates each activity
 * in the list.
 */
export function chooseColors(
  activities: Array<Activity>,
  colorScheme: TColorScheme
): void {
  // above this length, we give up trying to be nice:
  const colorLen = BACKGROUND_COLORS[colorScheme].length;
  const indices: Array<number> = [];
  for (const activity of activities) {
    if (activity.manualColor) continue;
    const hash = murmur3(activity.id);
    let index = hash() % colorLen;
    // try to pick distinct colors if possible; hash to try to make each
    // activity have a consistent color.
    while (indices.length < colorLen && indices.indexOf(index) !== -1) {
      index = hash() % colorLen;
    }
    indices.push(index);
    activity.backgroundColor = BACKGROUND_COLORS[colorScheme][index];
  }
}

/** Choose a text color for a background given by hex code color. */
export function textColor(color: string): string {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

//========================================================================
// Other utilities:

/**
 * Rounds {@param x} to {@param n} decimal places?
 * TODO: figure out what this does and then remove it
 */
export function formatNumber(x: number, n: number): string {
  const re = "\\d(?=(\\d{" + (x || 3) + "})+" + (n > 0 ? "\\." : "$") + ")";
  return x.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, "g"), "$&,");
}

/** Takes the sum of an array. */
export function sum(arr: Array<number>): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

export function urlencode(obj: any): string {
  return btoa(String.fromCharCode.apply(null, Msgpack.encode(obj)));
}

export function urldecode(obj: string): any {
  return Msgpack.decode(
    new Uint8Array(
      atob(obj)
        .split("")
        .map((c) => c.charCodeAt(0))
    )
  );
}

/** Wrapper to link all classes in a given string. */
export function linkClasses(firehose: Firehose, str: string): JSX.Element {
  return (
    <>
      {str.split(/([ ,;[\]()/])/).map((text) => {
        const cls = firehose.classes.get(text);
        if (!cls) return text;
        return (
          <Link key={text} onClick={() => firehose.setViewedActivity(cls)}>
            {text}
          </Link>
        );
      })}
    </>
  );
}