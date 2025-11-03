import { ref, update } from "firebase/database";
import { rtdb } from "../firebase";
import { path } from "../backend.paths";

const ROLE_PATH = (uid: string) => path("users", uid);

export async function grantSupervisorRole(uid: string) {
  const payload = {
    role: "supervisor",
    roleGrantedAt: Date.now(),
  } satisfies Record<string, unknown>;

  await update(ref(rtdb, ROLE_PATH(uid)), payload);
}

export async function revokeSupervisorRole(uid: string) {
  const payload = {
    role: null,
    roleGrantedAt: null,
  } satisfies Record<string, unknown>;

  await update(ref(rtdb, ROLE_PATH(uid)), payload);
}