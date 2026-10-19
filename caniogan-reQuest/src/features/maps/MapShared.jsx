import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TileLayer, ZoomControl, useMap } from "react-leaflet";
import { DomEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map.css";

const customUrl = import.meta.env.VITE_MAP_TILE_URL;
const customAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION;
// A different provider must supply its own credit; never misattribute its tiles.
const useCustomTiles = !!customUrl && !!customAttribution;
const tileUrl = useCustomTiles
  ? customUrl
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function MapTiles() {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <>
      <TileLayer
        key={attempt}
        url={tileUrl}
        maxZoom={19}
        eventHandlers={{ tileerror: () => setFailed(true) }}
      />
      {failed && (
        <div
          className="request-map__tile-error"
          role="status"
          ref={(node) => {
            if (node) DomEvent.disableClickPropagation(node);
          }}
        >
          <span>
            {t(
              "Hindi ma-load ang mapa. Maaari mo pa ring gamitin ang mga detalye ng lugar.",
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            {t("Subukang muli ang mapa")}
          </button>
        </div>
      )}
    </>
  );
}

export function MapAttribution() {
  return (
    <p className="request-map__attribution">
      {useCustomTiles ? (
        customAttribution
      ) : (
        <>
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>
        </>
      )}
    </p>
  );
}

export function MapAccessibility({ label, instructions }) {
  const map = useMap();
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", label);
    container.setAttribute("aria-describedby", instructions);
  }, [map, label, instructions]);
  return (
    <ZoomControl
      key={i18n.language}
      zoomInTitle={t("Palakihin ang mapa")}
      zoomOutTitle={t("Paliitin ang mapa")}
    />
  );
}
