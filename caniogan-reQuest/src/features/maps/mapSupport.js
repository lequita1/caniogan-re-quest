import { useEffect, useRef, useState } from "react";
import { divIcon } from "leaflet";

export const pinIcon = divIcon({
  className: "request-map__pin",
  html: '<span aria-hidden="true"></span>',
  iconSize: [32, 40],
  iconAnchor: [16, 38],
  popupAnchor: [0, -36],
});

export function useDeviceLocation() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const sequence = useRef(0);
  useEffect(
    () => () => {
      sequence.current += 1;
    },
    [],
  );
  function cancel() {
    sequence.current += 1;
    setPending(false);
    setStatus("");
  }
  function locate(onLocated) {
    if (!navigator.geolocation) {
      setStatus(
        "Hindi suportado ang lokasyon sa device na ito. Piliin ang lugar sa mapa o ilagay ang detalye ng lugar.",
      );
      return;
    }
    const request = ++sequence.current;
    setPending(true);
    setStatus("Hinihintay ang pahintulot at lokasyon ng device…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (sequence.current !== request) return;
        setPending(false);
        setStatus("Nahanap ang lokasyon ng device. Suriin ang lugar sa mapa.");
        onLocated({ lat: coords.latitude, lng: coords.longitude });
      },
      (error) => {
        if (sequence.current !== request) return;
        setPending(false);
        setStatus(
          error.code === 1
            ? "Hindi pinayagan ang lokasyon. Maaari mong payagan ito sa browser at subukang muli, o piliin ang lugar sa mapa."
            : "Hindi makuha ang lokasyon. Subukang muli o piliin ang lugar sa mapa.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }
  return { locate, cancel, pending, status };
}
