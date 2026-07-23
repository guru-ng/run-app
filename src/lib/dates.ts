export function todayIso() {
	return dateToIso(new Date());
}

export function dateToIso(d: Date) {
	return d.toISOString().slice(0, 10);
}

export function isoToDate(iso: string) {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function addDaysIso(iso: string, days: number) {
	const d = isoToDate(iso);
	d.setDate(d.getDate() + days);
	return dateToIso(d);
}

/** Monday of the week containing `date` (or today). */
export function startOfWeekIso(date: Date = new Date()) {
	const d = new Date(date);
	const day = (d.getDay() + 6) % 7; // 0 = Monday
	d.setDate(d.getDate() - day);
	return dateToIso(d);
}

export function shortDateLabel(iso: string) {
	const d = isoToDate(iso);
	const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
	return `${month} ${d.getDate()}`;
}

export type DayCell = { iso: string; day: number; inMonth: boolean; isToday: boolean };

/** Mon-first calendar grid for the month containing `date`, in whole weeks. */
export function getMonthGrid(date: Date = new Date()): DayCell[] {
	const year = date.getFullYear();
	const month = date.getMonth();
	const first = new Date(year, month, 1);
	const startIso = startOfWeekIso(first);
	const start = isoToDate(startIso);

	const last = new Date(year, month + 1, 0);
	const endIso = startOfWeekIso(last);
	const end = isoToDate(endIso);
	end.setDate(end.getDate() + 6);

	const today = todayIso();
	const cells: DayCell[] = [];
	const cursor = new Date(start);
	while (cursor <= end) {
		const iso = dateToIso(cursor);
		cells.push({
			iso,
			day: cursor.getDate(),
			inMonth: cursor.getMonth() === month,
			isToday: iso === today,
		});
		cursor.setDate(cursor.getDate() + 1);
	}
	return cells;
}
