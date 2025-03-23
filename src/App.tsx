import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { PhotoData } from "./types/PhotoData";
import photosJson from "./photo-data.json";
import {
  MapContainer,
  Marker,
  TileLayer,
  Polyline,
  Popup,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import L from "leaflet";
import Car from "./assets/car.svg?react";
import { renderToStaticMarkup } from "react-dom/server";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocation } from "@fortawesome/free-solid-svg-icons";
import PhotoMarker from "./PhotoMarker";
import Split from "react-split";

function App() {
  const [map, setMap] = useState<L.Map | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  useEffect(() => {
    map?.invalidateSize();
  }, [map]);

  const [photos] = useState(photosJson as PhotoData[]);

  const locations = useMemo(() => {
    const groupedData: Record<
      string,
      { latSum: number; lonSum: number; count: number; earliest: string }
    > = {};

    photos.forEach(({ location, latitude, longitude, timestamp }) => {
      if (!groupedData[location]) {
        groupedData[location] = {
          latSum: 0,
          lonSum: 0,
          count: 0,
          earliest: timestamp,
        };
      }
      const group = groupedData[location];
      group.latSum += latitude;
      group.lonSum += longitude;
      group.count += 1;
      if (timestamp < group.earliest) {
        group.earliest = timestamp;
      }
    });

    return Object.entries(groupedData).map(
      ([name, { latSum, lonSum, count, earliest }]) => ({
        name,
        latitude: latSum / count,
        longitude: lonSum / count,
        timestamp: new Date(earliest).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })
    );
  }, [photos]);

  const getLocationAngle = (i: number): number => {
    let angles: number[] = [];
    if (i < locations.length - 1) {
      angles.push(
        3.14159 +
          Math.atan2(
            locations[i].latitude - locations[i + 1].latitude,
            locations[i + 1].longitude - locations[i].longitude
          )
      );
    }
    if (i > 0) {
      angles.push(
        3.14159 +
          Math.atan2(
            locations[i - 1].latitude - locations[i].latitude,
            locations[i].longitude - locations[i - 1].longitude
          )
      );
    }
    return angles.reduce((a, b) => a + b, 0) / angles.length;
  };
  const [galleryIndices, setGalleryIndices] = useState<number[]>(
    locations.map(() => -1)
  );

  const galleries = useRef<{ [key: string]: HTMLDivElement }>({});

  const handleGalleryThumbnailClick = (
    loc_index: number,
    photo_index: number
  ) => {
    const newGalleryIndices = galleryIndices.map((_gal, gal_loc_index) => {
      if (gal_loc_index === loc_index) {
        return photo_index;
      } else {
        return -1;
      }
    });
    setGalleryIndices(newGalleryIndices);
  };

  const [zoom, setZoom] = useState(4);
  useEffect(() => {
    if (map) {
      map.on("zoomend", () => {
        setZoom(map.getZoom());
        setIsFlying(false);
      });
    }
  }, [map]);

  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [rowHeight, setRowHeight] = useState(
    window.innerWidth < 768 ? 120 : 200
  );

  useEffect(() => {
    const updateRowHeight = () => {
      setRowHeight(window.innerWidth < 768 ? 100 : 200);
    };

    window.addEventListener("resize", updateRowHeight);
    return () => window.removeEventListener("resize", updateRowHeight);
  }, []);

  return (
    <Split
      key={isPortrait ? "vertical" : "horizontal"}
      className={`flex ${
        isPortrait ? "flex-col-reverse" : "flex-row"
      } h-screen w-screen`}
      sizes={[50, 50]}
      minSize={100}
      gutterSize={10}
      gutter={(_index, direction) => {
        const gutter = document.createElement("div");
        gutter.className = `gutter ${direction}`;
        return gutter;
      }}
      direction={isPortrait ? "vertical" : "horizontal"}
    >
      <div className="text-left bg-zinc-200 overflow-y-scroll p-4">
        {locations.map((loc, loc_index) => {
          return (
            <div
              key={loc.name}
              className="p-4 m-4 bg-zinc-50 rounded-4xl shadow"
            >
              <div className="flex items-center justify-between">
                <h2
                  ref={(el: HTMLDivElement) => {
                    galleries.current[loc.name] = el;
                  }}
                  className="text-4xl mb-2 font-bold"
                >
                  {loc.name.replace(/_/g, " ")}
                </h2>
                <h3>{loc.timestamp}</h3>
              </div>
              <div>
                <Gallery
                  images={photos
                    .filter((photo) => photo.location === loc.name)
                    .map((photo) => ({
                      src: `${photo.root_url}w_200,q_80/${photo.id}.jpg`,
                      width: 100,
                      height: (100 * photo.height) / photo.width,
                      thumbnailStyle: { borderRadius: "30px" },
                      thumbnailCaption: (
                        <div className="caption-overlay">
                          <button
                            className="fly-button"
                            onClick={() => {
                              setIsFlying(true);
                              map?.flyTo([photo.latitude, photo.longitude], 15);
                              map?.once("drag", () => {
                                setIsFlying(false);
                                setZoom(map.getZoom());
                              });
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faLocation}
                            ></FontAwesomeIcon>
                          </button>
                        </div>
                      ),
                    }))}
                  onClick={(photo_index) => {
                    handleGalleryThumbnailClick(loc_index, photo_index);
                  }}
                  rowHeight={rowHeight}
                  margin={rowHeight / 33.33333}
                  enableImageSelection={false}
                />
                {galleryIndices[loc_index] >= 0 && (
                  <div className="fixed top-4 left-1/2 -translate-x-1/2 text-white text-2xl font-bold bg-black bg-opacity-50 px-4 py-2 rounded-lg z-[100000]">
                    {loc.name.replace(/_/g, " ")}
                  </div>
                )}
                <Lightbox
                  slides={photos
                    .filter((photo) => photo.location === loc.name)
                    .map((photo) => ({
                      src: `${photo.root_url}${photo.id}.jpg`,
                      caption: photo.description,
                    }))}
                  open={galleryIndices[loc_index] >= 0}
                  index={galleryIndices[loc_index]}
                  close={() =>
                    setGalleryIndices(
                      galleryIndices.map(() => {
                        return -1;
                      })
                    )
                  }
                  styles={{
                    container: {
                      backgroundColor: "rgba(0, 0, 0, 0.9)", // Set background color with opacity
                    },
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative">
        <MapContainer
          className="absolute inset-0"
          minZoom={4}
          maxBounds={[
            [24.396308, -125.0], // Southwest corner
            [49.384358, -66.93457], // Northeast corner
          ]}
          maxBoundsViscosity={1.0} // Prevents panning outside the bounds
          ref={setMap}
          center={[35, -100]}
          zoom={zoom}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={20}
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          />
          {zoom <= 9 && !isFlying && (
            <>
              <Polyline
                pathOptions={{
                  color: "black",
                  weight: 10, // Line thickness
                  // dashArray: "10, 10", // 10px dash, 10px gap
                  opacity: 0.8,
                }}
                positions={locations.map((loc) => [
                  loc.latitude,
                  loc.longitude,
                ])}
              />
              <Polyline
                pathOptions={{
                  color: "yellow",
                  weight: 3, // Line thickness
                  dashArray: "10, 10", // 10px dash, 10px gap
                  opacity: 0.8,
                }}
                positions={locations.map((loc) => [
                  loc.latitude,
                  loc.longitude,
                ])}
              />
            </>
          )}
          {zoom < 8 &&
            zoom >= 6 &&
            !isFlying &&
            locations.map((loc, i) => (
              <Marker
                key={loc.name}
                icon={L.divIcon({
                  className: "car-icon",
                  html: renderToStaticMarkup(
                    <Car
                      style={{
                        transform: `rotate(${getLocationAngle(i)}rad)`,
                      }}
                      height={50}
                      width={50}
                    ></Car>
                  ),
                  iconSize: [50, 50], // Width and height of the icon
                  iconAnchor: [25, 25],
                })}
                eventHandlers={{
                  mouseover: (event) => event.target.openPopup(),
                  mouseout: (event) => event.target.closePopup(),
                  click: () =>
                    galleries.current[loc.name].scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    }),
                }}
                position={[loc.latitude, loc.longitude]}
              >
                <Popup className="font-bold" closeButton={false}>
                  {loc.name.replace(/_/g, " ")}
                </Popup>
              </Marker>
            ))}
          {zoom >= 8 && (
            <MarkerClusterGroup maxClusterRadius={1}>
              {photos.map((photo) => (
                <PhotoMarker
                  key={photo.id}
                  photo={photo}
                  onClick={() => {
                    galleries.current[photo.location].scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                ></PhotoMarker>
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>
    </Split>
  );
}

export default App;
