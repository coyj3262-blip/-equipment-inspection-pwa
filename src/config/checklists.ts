export type ChecklistItem = {
  id: string;
  label: string;
  photoRequired?: boolean;
  noteRequired?: boolean;
  category: string;
};

export type EquipmentChecklist = {
  categories: string[];
  items: ChecklistItem[];
};

export const checklists: Record<string, EquipmentChecklist> = {
  dozer: {
    categories: ["Pre-Start Visual", "Operator Station", "Fluids & Filters", "Operational Checks", "Safety Equipment"],
    items: [
      // Pre-Start Visual
      { id: "prestart_walkaround", label: "Walk-around inspection completed", category: "Pre-Start Visual" },
      { id: "prestart_leaks", label: "No fluid leaks (oil, hydraulic, coolant)", photoRequired: true, category: "Pre-Start Visual" },
      { id: "prestart_track", label: "Track condition and tension acceptable", category: "Pre-Start Visual" },
      { id: "prestart_blade", label: "Blade cutting edge condition good", category: "Pre-Start Visual" },
      { id: "prestart_rops", label: "ROPS/FOPS structure intact", category: "Pre-Start Visual" },
      { id: "prestart_extinguisher", label: "Fire extinguisher present and charged", category: "Pre-Start Visual" },

      // Operator Station
      { id: "operator_seatbelt", label: "Seat belt functional", category: "Operator Station" },
      { id: "operator_mirrors", label: "Mirrors clean and adjusted", category: "Operator Station" },
      { id: "operator_controls", label: "Controls responsive", category: "Operator Station" },
      { id: "operator_horn", label: "Horn operational", category: "Operator Station" },
      { id: "operator_lights", label: "Lights functional (if equipped)", category: "Operator Station" },

      // Fluids & Filters
      { id: "fluids_engine_oil", label: "Engine oil level within spec", photoRequired: true, category: "Fluids & Filters" },
      { id: "fluids_hydraulic", label: "Hydraulic fluid level acceptable", category: "Fluids & Filters" },
      { id: "fluids_coolant", label: "Coolant level sufficient", category: "Fluids & Filters" },
      { id: "fluids_fuel", label: "Fuel level adequate for shift", category: "Fluids & Filters" },
      { id: "fluids_airfilter", label: "Air filter condition good", category: "Fluids & Filters" },

      // Operational Checks
      { id: "ops_start", label: "Engine starts and idles smoothly", category: "Operational Checks" },
      { id: "ops_steering", label: "Steering responsive", category: "Operational Checks" },
      { id: "ops_brakes", label: "Brake function normal", category: "Operational Checks" },
      { id: "ops_blade", label: "Blade lift/tilt operation smooth", category: "Operational Checks" },
      { id: "ops_tracks", label: "Track movement smooth and even", category: "Operational Checks" },

      // Safety Equipment
      { id: "safety_backup", label: "Backup alarm functional", category: "Safety Equipment" },
      { id: "safety_beacon", label: "Strobe/beacon working", category: "Safety Equipment" },
      { id: "safety_estop", label: "Emergency stop accessible", category: "Safety Equipment" },
    ]
  },

  excavator: {
    categories: ["Pre-Start Visual", "Operator Station", "Hydraulics", "Boom & Stick", "Final Checks"],
    items: [
      // Pre-Start Visual
      { id: "prestart_undercarriage", label: "Undercarriage inspection completed", category: "Pre-Start Visual" },
      { id: "prestart_bucket", label: "Bucket teeth/edge condition acceptable", photoRequired: true, category: "Pre-Start Visual" },
      { id: "prestart_pins", label: "Pin and bushing wear within limits", category: "Pre-Start Visual" },
      { id: "prestart_hoses", label: "Hydraulic hoses in good condition", category: "Pre-Start Visual" },
      { id: "prestart_glass", label: "Cab glass intact and clean", category: "Pre-Start Visual" },

      // Operator Station
      { id: "operator_seatbelt", label: "Seat belt and controls functional", category: "Operator Station" },
      { id: "operator_travelalarm", label: "Travel alarm functional", category: "Operator Station" },
      { id: "operator_wipers", label: "Windshield wipers operational", category: "Operator Station" },
      { id: "operator_climate", label: "Climate control working", category: "Operator Station" },

      // Hydraulics
      { id: "hydraulic_leaks", label: "No visible hydraulic leaks", photoRequired: true, category: "Hydraulics" },
      { id: "hydraulic_cylinders", label: "Cylinder rods in good condition", category: "Hydraulics" },
      { id: "hydraulic_coupler", label: "Quick coupler functions properly", category: "Hydraulics" },
      { id: "hydraulic_swing", label: "Swing brake operational", category: "Hydraulics" },

      // Boom & Stick
      { id: "boom_operation", label: "Boom operates smoothly", category: "Boom & Stick" },
      { id: "boom_noise", label: "No unusual noises during operation", category: "Boom & Stick" },
      { id: "boom_bucket", label: "Bucket curl responsive", category: "Boom & Stick" },

      // Final Checks
      { id: "final_hourmeter", label: "Hour meter reading recorded", category: "Final Checks" },
      { id: "final_fuel", label: "Fuel consumption normal", category: "Final Checks" },
      { id: "final_temp", label: "Operating temperature normal", category: "Final Checks" },
    ]
  },

  loader: {
    categories: ["Pre-Start Visual", "Operator Station", "Hydraulics & Loader", "Operational Checks", "Safety"],
    items: [
      // Pre-Start Visual
      { id: "prestart_walkaround", label: "Complete walk-around inspection", category: "Pre-Start Visual" },
      { id: "prestart_tires", label: "Tire condition and pressure", photoRequired: true, category: "Pre-Start Visual" },
      { id: "prestart_bucket", label: "Bucket/fork condition acceptable", category: "Pre-Start Visual" },
      { id: "prestart_leaks", label: "No visible fluid leaks", photoRequired: true, category: "Pre-Start Visual" },

      // Operator Station
      { id: "operator_controls", label: "All controls functional", category: "Operator Station" },
      { id: "operator_horn", label: "Horn and lights working", category: "Operator Station" },
      { id: "operator_seatbelt", label: "Seat belt operational", category: "Operator Station" },

      // Hydraulics & Loader
      { id: "hydraulic_system", label: "Hydraulic system pressure normal", category: "Hydraulics & Loader" },
      { id: "loader_lift", label: "Loader lift arms operate smoothly", category: "Hydraulics & Loader" },
      { id: "loader_tilt", label: "Bucket tilt responsive", category: "Hydraulics & Loader" },

      // Operational Checks
      { id: "ops_brakes", label: "Service and parking brakes functional", category: "Operational Checks" },
      { id: "ops_steering", label: "Steering response adequate", category: "Operational Checks" },
      { id: "ops_transmission", label: "Transmission shifts smoothly", category: "Operational Checks" },

      // Safety
      { id: "safety_backup", label: "Backup alarm working", category: "Safety" },
      { id: "safety_rops", label: "ROPS structure intact", category: "Safety" },
    ]
  },

  farm_tractor: {
    categories: ["Pre-Start Visual", "Engine & Fluids", "PTO & Hydraulics", "Operational", "Safety"],
    items: [
      // Pre-Start Visual
      { id: "prestart_walkaround", label: "Visual inspection completed", category: "Pre-Start Visual" },
      { id: "prestart_tires", label: "Tire condition and ballast", category: "Pre-Start Visual" },
      { id: "prestart_hitch", label: "Three-point hitch condition", category: "Pre-Start Visual" },

      // Engine & Fluids
      { id: "engine_oil", label: "Engine oil level checked", photoRequired: true, category: "Engine & Fluids" },
      { id: "engine_coolant", label: "Coolant level adequate", category: "Engine & Fluids" },
      { id: "engine_fuel", label: "Fuel level and quality", category: "Engine & Fluids" },

      // PTO & Hydraulics
      { id: "pto_shield", label: "PTO shield in place", category: "PTO & Hydraulics" },
      { id: "pto_operation", label: "PTO engages/disengages properly", category: "PTO & Hydraulics" },
      { id: "hydraulic_function", label: "Hydraulic remotes functional", category: "PTO & Hydraulics" },

      // Operational
      { id: "ops_brakes", label: "Brake pedals locked together", category: "Operational" },
      { id: "ops_clutch", label: "Clutch operation smooth", category: "Operational" },
      { id: "ops_steering", label: "Steering responsive", category: "Operational" },

      // Safety
      { id: "safety_rops", label: "ROPS/seat belt functional", category: "Safety" },
      { id: "safety_lights", label: "All lights operational", category: "Safety" },
      { id: "safety_smi", label: "SMV emblem present and visible", category: "Safety" },
    ]
  }
};

export function getChecklist(equipmentType: string): EquipmentChecklist {
  return checklists[equipmentType] || checklists.dozer;
}
