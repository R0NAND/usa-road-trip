import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    setTimeout(() => {
      map?.invalidateSize(); // Force Leaflet to update
    }, 200); // Small delay to allow rendering
  }, [map]);

  const location_order = [
    "Entering_Detroit",
    "Ann_Arbor",
    "Toledo_Suburb",
    "Indiannapolis_Wal-Mart",
    "Nashville_Indiana",
    "Mammoth_Cave",
    "Nashville",
    "Outdoor_World",
    "Smoky_Mountains",
    "Atlanta",
    "Savannah_Farm",
    "Jacksonville",
    "Universal_Studios_Orlando",
    "Disney_Animal_Kingdom",
    "Disney_Magic_Kingdom",
    "Disney_Epcot",
    "Florida_Everglades",
    "Key_West",
    "Port_Charlotte",
    "Tampa",
    "Florida_Campsite",
    "New_Orleans",
    "Texas_Wal-Mart",
    "Houston",
    "Austin",
    "San_Antonio",
    "Fort_Clark_Campsite",
    "Marathon_Texas",
    "Big_Bend",
    "BLM_Campsite",
    "Carlsbad_Caverns",
    "Guadalupe_Mountains",
    "White_Sands",
    "Dog_Canyon",
    "Very_Large_Array",
    "Los_Alamos",
    "Mesa_Verde",
    "Ship_Rock",
    "Flagstaff",
    "Sedona",
    "Grand_Canyon",
    "Bryce_Canyon",
    "Kodachrome_Park",
    "Capitol_Reef",
    "Larb_Hollow_Overlook",
    "Zion_Park",
    "Natural_Bridges",
    "Arches_Park",
    "Canyonlands",
    "Black_Canyon_of_the_Gunnison",
    "Aspen",
    "Denver",
    "Boulder",
    "Rocky_Mountains_National_Park",
    "Grand_Teton_National_Park",
    "Yellowstone",
    "Idaho_Hostel",
    "Salt_Lake_City",
    "Antelope_Island",
    "Bonneville_Salt_Flats",
    "Great_Basin_National_Park",
    "Lake_Tahoe",
    "Road_To_Yosemite",
    "Yosemite",
    "Sequioa_and_King's_Canyon",
    "Los_Angeles",
    "Universal_Studios_Hollywood",
    "Pinnacles_National_Park",
    "Big_Sur",
    "San_Francisco",
    "Redwoods",
    "Thor's_Well",
    "Cannon_Beach",
    "Washington_Campground",
    "Seattle",
    "Glacier_National_Park",
    "Black_Hills",
    "Badlands",
    "Chicago",
    "Exiting_Through_Detroit",
  ];

  const [photos] = useState(photosJson as PhotoData[]);
  const [locations] = useState(
    location_order.map((loc) => {
      const longitude =
        photos
          .filter((photo) => photo.location === loc)
          .map((p) => {
            return p.longitude;
          })
          .reduce((a, b) => a + b, 0) /
        photos.filter((photo) => photo.location === loc).length;
      const latitude =
        photos
          .filter((photo) => photo.location === loc)
          .map((p) => {
            return p.latitude;
          })
          .reduce((a, b) => a + b, 0) /
        photos.filter((photo) => photo.location === loc).length;
      return { name: loc, longitude: longitude, latitude: latitude };
    })
  );
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
    window.innerWidth < 768 ? 100 : 200
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
      } bg-zinc-900 text-zinc-100 h-screen w-screen`}
      sizes={[50, 50]}
      minSize={100} // Minimum size in pixels for each panel
      gutterSize={10} // Size of the draggable splitter
      gutter={(_index, direction) => {
        const gutter = document.createElement("div");
        gutter.className = `gutter ${direction}`;
        return gutter;
      }}
      direction={isPortrait ? "vertical" : "horizontal"}
    >
      <div className="text-left overflow-y-scroll p-4">
        {locations.map((loc, loc_index) => {
          return (
            <>
              <div className="p-4 m-4 rounded-4xl shadow-2xl">
                <h2
                  ref={(el: HTMLDivElement) => {
                    galleries.current[loc.name] = el;
                  }}
                  className="text-4xl mb-2 font-bold"
                >
                  {loc.name.replace("_", " ")}
                </h2>
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
                                map?.flyTo(
                                  [photo.latitude, photo.longitude],
                                  15,
                                  { animate: true }
                                );
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
                      {loc.name.replace("_", " ")}
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
            </>
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
          zoom={3}
          style={{ height: "100%", width: "100%" }}
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
          {zoom <= 9 && (
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
                <Popup className="font-bold">
                  {loc.name.replace("_", " ")}
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
