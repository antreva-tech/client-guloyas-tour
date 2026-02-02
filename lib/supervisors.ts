import { db } from "@/lib/db";
import { SUPERVISORS } from "@/lib/validation";

/**
 * Fetches the list of supervisor names used across the app.
 * Built from: User.supervisorName + distinct Sale.supervisor + base SUPERVISORS.
 * Sorted alphabetically, deduplicated.
 */
export async function getSupervisorList(): Promise<string[]> {
  const [userNames, saleSupervisors] = await Promise.all([
    db.user.findMany({
      where: { supervisorName: { not: null } },
      select: { supervisorName: true },
      distinct: ["supervisorName"],
    }),
    db.sale.findMany({
      where: { supervisor: { not: null } },
      select: { supervisor: true },
      distinct: ["supervisor"],
    }),
  ]);

  const set = new Set<string>([
    ...SUPERVISORS,
    ...userNames.map((u) => u.supervisorName!).filter(Boolean),
    ...saleSupervisors.map((s) => s.supervisor!).filter(Boolean),
  ]);

  return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
}
