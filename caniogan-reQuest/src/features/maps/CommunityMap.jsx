import { useEffect, useId, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { MapAccessibility, MapAttribution, MapTiles } from "./MapShared";
import { pinIcon, useDeviceLocation } from "./mapSupport";
import { boardPoint, MALOLOS_CENTER } from "./mapCoordinates";

const EMPTY_ITEMS = [];

function FitResults({ points, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (points.length)
      map.fitBounds(
        points.map(({ point }) => [point.lat, point.lng]),
        { padding: [36, 36], maxZoom: 15, animate: false },
      );
    else map.setView(MALOLOS_CENTER, 13, { animate: false });
  }, [map, points]);
  useEffect(() => {
    const selected = points.find(({ item }) => item.id === selectedId);
    if (selected) map.panTo(selected.point, { animate: false });
  }, [map, points, selectedId]);
  return null;
}

function RequestPin({ item, point, selected, onSelect }) {
  const { t } = useTranslation();
  const marker = useRef(null);
  useEffect(() => {
    if (selected) marker.current?.openPopup();
  }, [selected]);
  return (
    <Marker
      ref={marker}
      position={point}
      icon={pinIcon}
      keyboard
      eventHandlers={{ click: () => onSelect?.(item.id) }}
      title={item.title}
      alt={t("Tinatayang lokasyon: {{title}}", { title: item.title })}
    >
      <Popup closeButton={false}>
        <strong>{item.title}</strong>
        <p>{item.areaLabel}</p>
        <p>{t("Tinatayang lokasyon lamang")}</p>
        <Link
          className="button button--secondary"
          to={`/resident/community/${item.id}`}
          onClick={() => onSelect?.(item.id)}
        >
          {t("Tingnan ang kahilingan")}
        </Link>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => marker.current?.closePopup()}
        >
          {t("Isara ang detalye")}
        </button>
      </Popup>
    </Marker>
  );
}

export default function CommunityMap({
  items = EMPTY_ITEMS,
  selectedId,
  onSelect,
}) {
  const { t } = useTranslation();
  const id = useId();
  const map = useRef(null);
  const { locate, cancel, pending, status } = useDeviceLocation();
  const points = useMemo(
    () =>
      items.flatMap((item) => {
        const point = boardPoint(item);
        return point ? [{ item, point }] : [];
      }),
    [items],
  );
  function fitResults() {
    cancel();
    if (points.length)
      map.current?.fitBounds(
        points.map(({ point }) => [point.lat, point.lng]),
        { padding: [36, 36], maxZoom: 15, animate: false },
      );
    else map.current?.setView(MALOLOS_CENTER, 13, { animate: false });
  }
  return (
    <section className="request-map" aria-label={t("Mapa ng mga kahilingan")}>
      <p id={`${id}-instructions`} className="muted">
        {t(
          "Tinatayang lokasyon lamang ang mga pin. Gamitin ang listahan para makita rin ang mga kahilingang walang pin. Ituon ang mapa at gamitin ang arrow keys para gumalaw.",
        )}
      </p>
      <MapContainer
        ref={map}
        center={MALOLOS_CENTER}
        zoom={13}
        attributionControl={false}
        zoomControl={false}
        scrollWheelZoom={false}
        className="request-map__canvas"
      >
        <MapTiles />
        <MapAccessibility
          label={t("Mapa ng mga kahilingan")}
          instructions={`${id}-instructions`}
        />
        <FitResults points={points} selectedId={selectedId} />
        {points.map(({ item, point }) => (
          <RequestPin
            key={item.id}
            item={item}
            point={point}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>
      <MapAttribution />
      <div className="request-map__actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={fitResults}
        >
          {t("Ipakita ang lahat ng pin")}
        </button>
        <button
          className="button button--secondary"
          type="button"
          disabled={pending}
          onClick={() =>
            locate((point) =>
              map.current?.setView(point, 14, { animate: false }),
            )
          }
        >
          {t("Hanapin ang aking paligid")}
        </button>
      </div>
      {points.length === 0 && (
        <p>
          {t(
            "Walang pin sa mga resultang ito. Tingnan ang listahan ng mga kahilingan.",
          )}
        </p>
      )}
      <p className="small" role="status">
        {status
          ? t(status)
          : t("Hindi ipinapakita ang eksaktong lokasyon ng mga residente.")}
      </p>
    </section>
  );
}
