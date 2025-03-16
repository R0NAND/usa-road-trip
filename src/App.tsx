import { useEffect, useRef, useState } from "react";
import "./App.css";
import { PhotoData } from "./types/PhotoData";
import photosJson from "./photo-data.json";
import { MapContainer, Marker, TileLayer, Polyline } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import L from "leaflet";
import Car from "./assets/car.svg?react";
import { renderToStaticMarkup } from "react-dom/server";

function App() {
  const [map, setMap] = useState<L.Map | null>(null);
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
    const newGalleryIndices = galleryIndices.map((gal_loc_index) => {
      if (gal_loc_index === loc_index) {
        return photo_index;
      } else {
        return -1;
      }
    });
    console.log(newGalleryIndices);
    setGalleryIndices(newGalleryIndices);
  };

  const [zoom, setZoom] = useState(8);
  useEffect(() => {
    if (map) {
      console.log("foo");
      map.on("zoomend", () => {
        setZoom(map.getZoom());
      });
    }
  }, [map]);

  const getCustomIcon = (iconUrl: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `<img src="${iconUrl}" alt="Marker" />`,
      iconSize: [40, 40], // Adjust size if needed
      iconAnchor: [20, 40],
      popupAnchor: [0, -50],
    });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100vh",
        }}
      >
        <div style={{ width: "50%", textAlign: "left", overflowY: "scroll" }}>
          {locations.map((loc, loc_index) => {
            return (
              <>
                <h2>{loc.name.replace("_", " ")}</h2>
                <div
                  ref={(el: HTMLDivElement) => {
                    galleries.current[loc.name] = el;
                  }}
                >
                  <Gallery
                    images={photos
                      .filter((photo) => photo.location === loc.name)
                      .map((photo, photo_index) => ({
                        src: `${photo.root_url}w_200,q_80/${photo.id}.jpg`,
                        width: 100,
                        height: (100 * photo.height) / photo.width,
                        customOverlay: (
                          <div
                            onMouseEnter={() =>
                              map?.flyTo(
                                [photo.latitude, photo.longitude],
                                13,
                                { animate: true }
                              )
                            }
                            onClick={() => {
                              handleGalleryThumbnailClick(
                                loc_index,
                                photo_index
                              );
                            }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0,0,0,0.1)", // Optional overlay styling
                              pointerEvents: "auto", // Ensure the event gets picked up
                            }}
                          />
                        ),
                      }))}
                    enableImageSelection={false}
                  />
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
                  />
                </div>
              </>
            );
          })}
        </div>
        <div style={{ height: "100%", width: "50%", border: "1px solid red" }}>
          <MapContainer
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
            {zoom <= 8 ? (
              <>
                {locations.map((loc, i) => (
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
                    position={[loc.latitude, loc.longitude]}
                  ></Marker>
                ))}
                {
                  <Polyline
                    pathOptions={{
                      color: "yellow",
                      weight: 4, // Line thickness
                      dashArray: "10, 10", // 10px dash, 10px gap
                      opacity: 0.8,
                    }}
                    positions={locations.map((loc) => [
                      loc.latitude,
                      loc.longitude,
                    ])}
                  />
                }
              </>
            ) : (
              <MarkerClusterGroup maxClusterRadius={1}>
                {photos.map((photo) => (
                  <Marker
                    key={photo.id}
                    position={[photo.latitude, photo.longitude]}
                    icon={getCustomIcon(
                      `${photo.root_url}w_40,h_40,c_fill,q_80/${photo.id}.jpg`
                    )}
                    eventHandlers={{
                      click: () =>
                        galleries.current[photo.location].scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        }),
                    }}
                  ></Marker>
                ))}
              </MarkerClusterGroup>
            )}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default App;
