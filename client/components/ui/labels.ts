// Human labels for record keys.
/** "core.address.city" → "City", "extra.child3FirstName" → "Child 3 first name". */
const NAMES: Record<string, string> = { sss: "SSS number", tin: "TIN", zip: "ZIP code", philsysPcn: "PhilSys card number", pagibigMid: "Pag-IBIG MID", philhealthPin: "PhilHealth PIN", houseNo: "House / lot no.", unitBldg: "Unit and building", birthPlaceAbroad: "Birth place abroad" };
export function prettyKey(key: string) {
  const last = key.split(".").at(-1)!; if (NAMES[last]) return NAMES[last];
  const words = last.replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1 ").replace(/\s+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
