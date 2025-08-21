import { RequestHandler } from "express";
import { decryptIfEncrypted } from "../middleware/decrypt";
import { syncData } from "./data";

// This route demonstrates how a mobile app forwarding BLE data would send payloads (optionally encrypted)
export const bleIngest: RequestHandler[] = [decryptIfEncrypted, syncData];