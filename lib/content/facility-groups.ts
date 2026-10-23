export const facilityGroupOptions = [
  { value: "bolnica", label: "Болници" },
  { value: "centar", label: "Медицински центрове / ДКЦ" },
  { value: "laboratoria", label: "Лаборатории" },
  { value: "dentalni", label: "Дентални" },
  { value: "drugi", label: "Други" },
] as const

export type FacilityGroup = (typeof facilityGroupOptions)[number]["value"]

export function parseFacilityGroup(value: string | undefined): FacilityGroup | "" {
  if (!value) return ""
  return facilityGroupOptions.some((item) => item.value === value) ? (value as FacilityGroup) : ""
}

export function facilityGroupLabel(value: string | undefined) {
  return facilityGroupOptions.find((item) => item.value === value)?.label ?? ""
}
