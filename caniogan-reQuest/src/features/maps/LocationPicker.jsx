import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { MapAccessibility, MapAttribution, MapTiles } from "./MapShared";
import { pinIcon, useDeviceLocation } from "./mapSupport";
import { MALOLOS_CENTER, validPoint } from "./mapCoordinates";

function PickerEvents({ value, onChange, disabled }) {
  const map = useMap();
  useMapEvents({
    click: ({ latlng }) => {
      if (!disabled) {
        const next = latlng.wrap();
        onChange({ lat: next.lat, lng: next.lng });
      }
    },
  });
  const lat = value?.lat;
  const lng = value?.lng;
  useEffect(() => {
    if (validPoint({ lat, lng })) map.panTo([lat, lng], { animate: false });
  }, [map, lat, lng]);
  return null;
}

export default function LocationPicker({
  value = null,
  onChange,
  disabled = false,
}) {
  const { t } = useTranslation();
  const id = useId();
  const map = useRef(null);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);
  const { locate, cancel, pending, status } = useDeviceLocation();
  const point = validPoint(value) ? value : null;
  function choosePoint(next) {
    cancel();
    onChange(next);
  }
  function chooseDeviceLocation() {
    locate((next) => {
      if (!disabledRef.current) onChange(next);
    });
  }
  return (
    <section className="request-map" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{t("Pin ng lugar (opsyonal)")}</h3>
      <p id={`${id}-instructions`} className="muted">
        {t(
          "I-click ang mapa o ilipat ang pin. Sa keyboard, ituon ang mapa at gamitin ang arrow keys, saka piliin ang gitna. Maaari ring ilagay lang ang detalye ng lugar sa form.",
        )}
      </p>
      <p className="small muted">
        {t(
          "Pribado ang eksaktong pin. Tinatayang lokasyon lang ang makikita sa komunidad kapag naaprubahan.",
        )}
      </p>
      <div className="request-map__frame">
        <MapContainer
          ref={map}
          center={point || MALOLOS_CENTER}
          zoom={13}
          attributionControl={false}
          zoomControl={false}
          scrollWheelZoom={false}
          className="request-map__canvas"
        >
          <MapTiles />
          <MapAccessibility
            label={t("Mapa para pumili ng lugar")}
            instructions={`${id}-instructions`}
          />
          <PickerEvents
            value={point}
            onChange={choosePoint}
            disabled={disabled}
          />
          {point && (
            <Marker
              position={point}
              icon={pinIcon}
              draggable={!disabled}
              keyboard
              alt={t("Napiling pribadong pin")}
              eventHandlers={{
                dragend: ({ target }) => {
                  if (!disabledRef.current) {
                    const next = target.getLatLng().wrap();
                    choosePoint({ lat: next.lat, lng: next.lng });
                  }
                },
              }}
            />
          )}
        </MapContainer>
        <span className="request-map__center" aria-hidden="true" />
      </div>
      <MapAttribution />
      <div className="request-map__actions">
        <button
          className="button button--secondary"
          type="button"
          disabled={disabled}
          onClick={() => {
            const next = map.current?.getCenter().wrap();
            if (next) choosePoint({ lat: next.lat, lng: next.lng });
          }}
        >
          {t("Piliin ang gitna ng mapa")}
        </button>
        <button
          className="button button--secondary"
          type="button"
          disabled={disabled || pending}
          onClick={chooseDeviceLocation}
        >
          {t("Gamitin ang lokasyon ng device")}
        </button>
        <button
          className="button button--secondary"
          type="button"
          disabled={disabled || (!point && !pending)}
          onClick={() => {
            choosePoint(null);
            map.current?.setView(MALOLOS_CENTER, 13, { animate: false });
          }}
        >
          {t("Alisin ang pin")}
        </button>
      </div>
      <p className="small" role="status">
        {status
          ? t(status)
          : point
            ? t("May napiling pin. Maaari mo itong ilipat o alisin.")
            : t("Walang napiling pin. Maaari kang magpatuloy nang walang pin.")}
      </p>
    </section>
  );
}
