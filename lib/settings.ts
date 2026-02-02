import { db } from "./db";

const DEFAULT_SETTINGS_ID = "default";

/**
 * Default admin settings values.
 */
export const DEFAULT_SETTINGS = {
  lowStockThreshold: 5,
};

/**
 * Admin settings data transfer object.
 */
export interface AdminSettingsDTO {
  lowStockThreshold: number;
}

/**
 * Retrieves the current admin settings.
 * Creates default settings if none exist.
 * @returns The admin settings.
 */
export async function getAdminSettings(): Promise<AdminSettingsDTO> {
  try {
    let settings = await db.adminSettings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });

    if (!settings) {
      settings = await db.adminSettings.create({
        data: {
          id: DEFAULT_SETTINGS_ID,
          lowStockThreshold: DEFAULT_SETTINGS.lowStockThreshold,
        },
      });
    }

    return {
      lowStockThreshold: settings.lowStockThreshold,
    };
  } catch {
    // Return defaults if database is unavailable
    return DEFAULT_SETTINGS;
  }
}

/**
 * Updates admin settings.
 * @param settings - Partial settings to update.
 * @returns The updated settings.
 */
export async function updateAdminSettings(
  settings: Partial<AdminSettingsDTO>
): Promise<AdminSettingsDTO> {
  const updated = await db.adminSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: settings,
    create: {
      id: DEFAULT_SETTINGS_ID,
      lowStockThreshold: settings.lowStockThreshold ?? DEFAULT_SETTINGS.lowStockThreshold,
    },
  });

  return {
    lowStockThreshold: updated.lowStockThreshold,
  };
}

/**
 * Gets the low stock threshold value.
 * @returns The low stock threshold.
 */
export async function getLowStockThreshold(): Promise<number> {
  const settings = await getAdminSettings();
  return settings.lowStockThreshold;
}
