declare module 'luxon' {
  export class DateTime {
    static fromISO(text: string, opts?: { zone?: string }): DateTime;
    static fromJSDate(d: Date, opts?: { zone?: string }): DateTime;
    static now(): DateTime;
    readonly isValid: boolean;
    readonly weekday: number; // 1=Mon .. 7=Sun
    startOf(unit: string): DateTime;
    endOf(unit: string): DateTime;
    plus(duration: { days?: number; minutes?: number }): DateTime;
    minus(duration: { days?: number; minutes?: number }): DateTime;
    set(obj: { hour: number; minute: number }): DateTime;
    toUTC(): DateTime;
    setZone(zone: string): DateTime;
    toJSDate(): Date;
    toMillis(): number;
    toISO(): string;
    toISODate(): string;
    valueOf(): number;
    isAfter(other: DateTime): boolean;
  }
}
