import { Location } from "../model";
import request from "./request";

export function getLastLocation() {
  return request.get("location").then((res) => res.data);
}

export function getLocations() {
  return request.get("getLocations").then((res) => res.data);
}

export function updateLocation(location: Location) {
  return request.post("updateLocation", location).then((res) => res.data);
}

export function addFort(fort: { content: string }) {
  return request.post("addFort", fort).then((res) => res.data);
}
